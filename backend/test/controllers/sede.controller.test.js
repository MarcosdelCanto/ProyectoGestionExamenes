import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede,
} from '../../controllers/sede.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Sedes', () => {
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

  describe('getAllSedes', () => {
    it('debería retornar todas las sedes exitosamente', async () => {
      const mockSedes = [
        { ID_SEDE: 1, NOMBRE_SEDE: 'Sede Central' },
        { ID_SEDE: 2, NOMBRE_SEDE: 'Sede Norte' },
        { ID_SEDE: 3, NOMBRE_SEDE: 'Sede Sur' },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockSedes });

      await getAllSedes(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id_sede, nombre_sede'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockSedes);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllSedes', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getAllSedes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener sedes',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getSedeById', () => {
    it('debería retornar una sede por ID exitosamente', async () => {
      const mockSede = {
        ID_SEDE: 1,
        NOMBRE_SEDE: 'Sede Central',
      };

      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rows: [mockSede] });

      await getSedeById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id_sede = :id'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockSede);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la sede no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getSedeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sede no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getSedeById', async () => {
      req.params.id = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getSedeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener sede' });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('createSede', () => {
    it('debería crear una sede exitosamente', async () => {
      req.body = {
        nombre_sede: 'Nueva Sede',
      };

      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      await createSede(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO SEDE'),
        expect.objectContaining({
          nombre: 'Nueva Sede',
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_sede: 123 });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al crear sede', async () => {
      req.body = {
        nombre_sede: 'Nueva Sede',
      };

      mockConnection.execute.mockRejectedValue(new Error('Error al insertar'));

      await createSede(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear sede' });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('updateSede', () => {
    it('debería actualizar una sede exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nombre_sede: 'Sede Actualizada',
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await updateSede(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE SEDE'),
        expect.objectContaining({
          id: '1',
          nombre: 'Sede Actualizada',
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Sede actualizada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la sede a actualizar no existe', async () => {
      req.params.id = '999';
      req.body = {
        nombre_sede: 'Sede Actualizada',
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateSede(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sede no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar sede', async () => {
      req.params.id = '1';
      req.body = {
        nombre_sede: 'Sede Actualizada',
      };

      mockConnection.execute.mockRejectedValue(
        new Error('Error al actualizar')
      );

      await updateSede(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar sede',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('deleteSede', () => {
    it('debería eliminar una sede exitosamente', async () => {
      req.params.id = '1';

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await deleteSede(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM SEDE'),
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Sede eliminada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la sede a eliminar no existe', async () => {
      req.params.id = '999';

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await deleteSede(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sede no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar sede', async () => {
      req.params.id = '1';

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteSede(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar sede',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
