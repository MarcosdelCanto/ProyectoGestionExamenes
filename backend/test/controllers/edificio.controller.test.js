import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllEdificios,
  getEdificioById,
  createEdificio,
  updateEdificio,
  deleteEdificio,
  getEdificiosBySede,
} from '../../controllers/edificio.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Edificios', () => {
  let mockConnection;
  let req;
  let res;

  beforeEach(() => {
    mockConnection = {
      execute: vi.fn(),
      close: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };
    getConnection.mockResolvedValue(mockConnection);

    req = {
      params: {},
      body: {},
      query: {},
    };

    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('getAllEdificios', () => {
    it('debería retornar todos los edificios exitosamente', async () => {
      const mockEdificios = [
        {
          ID_EDIFICIO: 1,
          NOMBRE_EDIFICIO: 'Edificio A',
          SIGLA_EDIFICIO: 'EDA',
          SEDE_ID_SEDE: 1,
          NOMBRE_SEDE: 'Sede Central',
        },
        {
          ID_EDIFICIO: 2,
          NOMBRE_EDIFICIO: 'Edificio B',
          SIGLA_EDIFICIO: 'EDB',
          SEDE_ID_SEDE: 1,
          NOMBRE_SEDE: 'Sede Central',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockEdificios });

      await getAllEdificios(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT e.id_edificio'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEdificios);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllEdificios', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getAllEdificios(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener edificios',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getEdificioById', () => {
    it('debería retornar un edificio por ID exitosamente', async () => {
      const mockEdificio = {
        ID_EDIFICIO: 1,
        NOMBRE_EDIFICIO: 'Edificio A',
        SIGLA_EDIFICIO: 'EDA',
        SEDE_ID_SEDE: 1,
        NOMBRE_SEDE: 'Sede Central',
      };

      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rows: [mockEdificio] });

      await getEdificioById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.id_edificio = :id'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEdificio);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el edificio no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getEdificioById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Edificio no encontrado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getEdificioById', async () => {
      req.params.id = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getEdificioById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener edificio',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('createEdificio', () => {
    it('debería crear un edificio exitosamente', async () => {
      req.body = {
        nombre_edificio: 'Nuevo Edificio',
        sigla_edificio: 'NED',
        sede_id_sede: 1,
      };

      // Mock para verificar que la sede existe
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockResolvedValueOnce({ outBinds: { newId: [123] } }); // insert

      await createEdificio(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM SEDE'),
        [1],
        expect.any(Object)
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO EDIFICIO'),
        expect.objectContaining({
          nombre: 'Nuevo Edificio',
          sigla: 'NED',
          sede_id: 1,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_edificio: 123 });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando faltan campos obligatorios', async () => {
      req.body = {
        nombre_edificio: 'Nuevo Edificio',
        // Faltan sigla_edificio y sede_id_sede
      };

      await createEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Todos los campos son requeridos (nombre_edificio, sigla_edificio, sede_id_sede)',
      });
    });

    it('debería retornar 400 cuando la sede no existe', async () => {
      req.body = {
        nombre_edificio: 'Nuevo Edificio',
        sigla_edificio: 'NED',
        sede_id_sede: 999,
      };

      mockConnection.execute.mockResolvedValue({ rows: [] }); // sede no existe

      await createEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La sede especificada no existe',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de constraint único', async () => {
      req.body = {
        nombre_edificio: 'Edificio Duplicado',
        sigla_edificio: 'DUP',
        sede_id_sede: 1,
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockRejectedValueOnce({ errorNum: 1 }); // constraint violation

      await createEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error de validación: verifique los datos ingresados',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar otros errores al crear edificio', async () => {
      req.body = {
        nombre_edificio: 'Nuevo Edificio',
        sigla_edificio: 'NED',
        sede_id_sede: 1,
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockRejectedValueOnce(new Error('Error general')); // other error

      await createEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear edificio',
        detalles: 'Error general',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('updateEdificio', () => {
    it('debería actualizar un edificio exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nombre_edificio: 'Edificio Actualizado',
        sigla_edificio: 'EAC',
        sede_id_sede: 2,
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await updateEdificio(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE EDIFICIO'),
        expect.objectContaining({
          id: '1',
          nombre: 'Edificio Actualizado',
          sigla: 'EAC',
          sede_id: 2,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Edificio actualizado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el edificio a actualizar no existe', async () => {
      req.params.id = '999';
      req.body = {
        nombre_edificio: 'Edificio Actualizado',
        sigla_edificio: 'EAC',
        sede_id_sede: 2,
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Edificio no encontrado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar edificio', async () => {
      req.params.id = '1';
      req.body = {
        nombre_edificio: 'Edificio Actualizado',
        sigla_edificio: 'EAC',
        sede_id_sede: 2,
      };

      mockConnection.execute.mockRejectedValue(
        new Error('Error al actualizar')
      );

      await updateEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar edificio',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('deleteEdificio', () => {
    it('debería eliminar un edificio exitosamente cuando no tiene dependencias', async () => {
      req.params.id = '1';

      // Mock para que el DELETE retorne 1 row affected
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await deleteEdificio(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM EDIFICIO WHERE id_edificio = :id',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Edificio eliminado' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el edificio a eliminar no existe', async () => {
      req.params.id = '999';

      // Mock para que el DELETE retorne 0 rows affected
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await deleteEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Edificio no encontrado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar edificio', async () => {
      req.params.id = '1';

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteEdificio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar edificio',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getEdificiosBySede', () => {
    it('debería retornar edificios por sede exitosamente', async () => {
      const mockEdificios = [
        {
          ID_EDIFICIO: 1,
          NOMBRE_EDIFICIO: 'Edificio A',
          SIGLA_EDIFICIO: 'EDA',
        },
        {
          ID_EDIFICIO: 2,
          NOMBRE_EDIFICIO: 'Edificio B',
          SIGLA_EDIFICIO: 'EDB',
        },
      ];

      req.params.sedeId = '1';
      mockConnection.execute.mockResolvedValue({ rows: mockEdificios });

      await getEdificiosBySede(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE SEDE_ID_SEDE = :id'),
        [1],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEdificios);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al obtener edificios por sede', async () => {
      req.params.sedeId = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getEdificiosBySede(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener edificios por sede',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
