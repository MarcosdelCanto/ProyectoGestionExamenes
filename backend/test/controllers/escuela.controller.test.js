import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllEscuelas,
  getEscuelaById,
  createEscuela,
  updateEscuela,
  deleteEscuela,
  getEscuelasBySede,
} from '../../controllers/escuela.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Escuelas', () => {
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

  describe('getAllEscuelas', () => {
    it('debería retornar todas las escuelas exitosamente', async () => {
      const mockEscuelas = [
        {
          ID_ESCUELA: 1,
          NOMBRE_ESCUELA: 'Escuela de Ingeniería',
          FECHA_ACTUALIZACION_ESCUELA: '2024-01-01',
          SEDE_ID_SEDE: 1,
          NOMBRE_SEDE: 'Sede Central',
          COLOR_BACKGROUND: '#FF0000',
          COLOR_BORDER: '#000000',
        },
        {
          ID_ESCUELA: 2,
          NOMBRE_ESCUELA: 'Escuela de Medicina',
          FECHA_ACTUALIZACION_ESCUELA: '2024-01-01',
          SEDE_ID_SEDE: 2,
          NOMBRE_SEDE: 'Sede Norte',
          COLOR_BACKGROUND: '#00FF00',
          COLOR_BORDER: '#000000',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockEscuelas });

      await getAllEscuelas(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT e.id_escuela'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEscuelas);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllEscuelas', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getAllEscuelas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener escuelas',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getEscuelaById', () => {
    it('debería retornar una escuela por ID exitosamente', async () => {
      const mockEscuela = {
        ID_ESCUELA: 1,
        NOMBRE_ESCUELA: 'Escuela de Ingeniería',
        FECHA_ACTUALIZACION_ESCUELA: '2024-01-01',
        SEDE_ID_SEDE: 1,
        NOMBRE_SEDE: 'Sede Central',
        COLOR_BACKGROUND: '#FF0000',
        COLOR_BORDER: '#000000',
      };

      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rows: [mockEscuela] });

      await getEscuelaById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.id_escuela = :id'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEscuela);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la escuela no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getEscuelaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Escuela no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getEscuelaById', async () => {
      req.params.id = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getEscuelaById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener escuela',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('createEscuela', () => {
    it('debería crear una escuela exitosamente', async () => {
      req.body = {
        nombre_escuela: 'Nueva Escuela',
        sede_id_sede: 1,
        color_background: '#FF0000',
        color_border: '#000000',
      };

      // Mock para verificar que la sede existe
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockResolvedValueOnce({ outBinds: { newId: [123] } }); // insert

      await createEscuela(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM SEDE'),
        [1],
        expect.any(Object)
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ESCUELA'),
        expect.objectContaining({
          nombre: 'Nueva Escuela',
          sede_id: 1,
          color_background: '#FF0000',
          color_border: '#000000',
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_escuela: 123 });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando faltan campos obligatorios', async () => {
      req.body = {
        // Falta nombre_escuela y sede_id_sede
      };

      await createEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El nombre de la escuela y la sede son campos obligatorios.',
      });
    });

    it('debería retornar 400 cuando la sede no existe', async () => {
      req.body = {
        nombre_escuela: 'Nueva Escuela',
        sede_id_sede: 999,
      };

      mockConnection.execute.mockResolvedValue({ rows: [] }); // sede no existe

      await createEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La sede especificada no existe.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de constraint único', async () => {
      req.body = {
        nombre_escuela: 'Escuela Duplicada',
        sede_id_sede: 1,
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockRejectedValueOnce({ errorNum: 1 }); // constraint violation

      await createEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Ya existe una escuela con ese nombre o ID de sede.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar otros errores al crear escuela', async () => {
      req.body = {
        nombre_escuela: 'Nueva Escuela',
        sede_id_sede: 1,
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // sede exists
        .mockRejectedValueOnce(new Error('Error general')); // other error

      await createEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear escuela',
        detalles: 'Error general',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('updateEscuela', () => {
    it('debería actualizar una escuela exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nombre_escuela: 'Escuela Actualizada',
        sede_id_sede: 2,
        color_background: '#00FF00',
        color_border: '#FFFFFF',
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await updateEscuela(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ESCUELA'),
        expect.objectContaining({
          id: '1',
          nombre: 'Escuela Actualizada',
          sede_id: 2,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Escuela actualizada con éxito',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la escuela a actualizar no existe', async () => {
      req.params.id = '999';
      req.body = {
        nombre_escuela: 'Escuela Actualizada',
        sede_id_sede: 2,
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Escuela no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar escuela', async () => {
      req.params.id = '1';
      req.body = {
        nombre_escuela: 'Escuela Actualizada',
        sede_id_sede: 2,
      };

      mockConnection.execute.mockRejectedValue(
        new Error('Error al actualizar')
      );

      await updateEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar escuela',
        detalles: 'Error al actualizar',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('deleteEscuela', () => {
    it('debería eliminar una escuela exitosamente cuando no tiene dependencias', async () => {
      req.params.id = '1';

      // Mock para que el DELETE retorne 1 row affected
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await deleteEscuela(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM ESCUELA WHERE id_escuela = :id',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Escuela eliminada con éxito',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la escuela a eliminar no existe', async () => {
      req.params.id = '999';

      // Mock para que el DELETE retorne 0 rows affected
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await deleteEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Escuela no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar escuela', async () => {
      req.params.id = '1';

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar escuela',
        detalles: 'Error al eliminar',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getEscuelasBySede', () => {
    it('debería retornar escuelas por sede exitosamente', async () => {
      const mockEscuelas = [
        { ID_ESCUELA: 1, NOMBRE_ESCUELA: 'Escuela de Ingeniería' },
        { ID_ESCUELA: 2, NOMBRE_ESCUELA: 'Escuela de Medicina' },
      ];

      req.params.sedeId = '1';
      mockConnection.execute.mockResolvedValue({ rows: mockEscuelas });

      await getEscuelasBySede(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE SEDE_ID_SEDE = :id'),
        [1],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEscuelas);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al obtener escuelas por sede', async () => {
      req.params.sedeId = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getEscuelasBySede(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener escuelas por sede',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
