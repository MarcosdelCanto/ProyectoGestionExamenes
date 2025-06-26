import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllEstados,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado,
} from '../../controllers/estado.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Estados', () => {
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

  describe('getAllEstados', () => {
    it('debería retornar todos los estados exitosamente', async () => {
      const mockEstados = [
        { ID_ESTADO: 1, NOMBRE_ESTADO: 'ACTIVO' },
        { ID_ESTADO: 2, NOMBRE_ESTADO: 'PROGRAMADO' },
        { ID_ESTADO: 3, NOMBRE_ESTADO: 'FINALIZADO' },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockEstados });

      await getAllEstados(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ESTADO'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEstados);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllEstados', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getAllEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener los estados',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getEstadoById', () => {
    it('debería retornar un estado por ID exitosamente', async () => {
      const mockEstado = {
        ID_ESTADO: 1,
        NOMBRE_ESTADO: 'ACTIVO',
      };

      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rows: [mockEstado] });

      await getEstadoById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id_estado = :id'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockEstado);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el estado no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getEstadoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Estado no encontrado' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getEstadoById', async () => {
      req.params.id = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getEstadoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener el estado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('createEstado', () => {
    it('debería crear un estado exitosamente', async () => {
      req.body = {
        nombre_estado: 'NUEVO_ESTADO',
      };

      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      await createEstado(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ESTADO'),
        expect.objectContaining({
          nombre: 'NUEVO_ESTADO',
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 123 });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al crear estado', async () => {
      req.body = {
        nombre_estado: 'NUEVO_ESTADO',
      };

      mockConnection.execute.mockRejectedValue(new Error('Error al insertar'));

      await createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear el estado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('updateEstado', () => {
    it('debería actualizar un estado exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nombre_estado: 'ESTADO_ACTUALIZADO',
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await updateEstado(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ESTADO'),
        expect.objectContaining({
          id: '1',
          nombre: 'ESTADO_ACTUALIZADO',
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado actualizado correctamente',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el estado a actualizar no existe', async () => {
      req.params.id = '999';
      req.body = {
        nombre_estado: 'ESTADO_ACTUALIZADO',
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Estado no encontrado' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar estado', async () => {
      req.params.id = '1';
      req.body = {
        nombre_estado: 'ESTADO_ACTUALIZADO',
      };

      mockConnection.execute.mockRejectedValue(
        new Error('Error al actualizar')
      );

      await updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar el estado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('deleteEstado', () => {
    it('debería eliminar un estado exitosamente', async () => {
      req.params.id = '1';

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await deleteEstado(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ESTADO'),
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado eliminado correctamente',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el estado a eliminar no existe', async () => {
      req.params.id = '999';

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Estado no encontrado' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar estado', async () => {
      req.params.id = '1';

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar el estado',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
