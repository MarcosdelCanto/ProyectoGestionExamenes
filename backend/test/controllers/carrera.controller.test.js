import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  getCarrerasByEscuela,
} from '../../controllers/carrera.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Carreras', () => {
  let mockConnection;
  let req;
  let res;

  beforeEach(() => {
    mockConnection = {
      execute: vi.fn(),
      executeMany: vi.fn(), // Agregar executeMany
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

  describe('getAllCarreras', () => {
    it('debería retornar todas las carreras exitosamente', async () => {
      const mockCarreras = [
        {
          ID_CARRERA: 1,
          NOMBRE_CARRERA: 'Ingeniería en Informática',
          ESCUELA_ID_ESCUELA: 1,
          NOMBRE_ESCUELA: 'Escuela de Ingeniería',
          PLANES_ESTUDIO_ASOCIADOS: 'Plan 2020',
        },
        {
          ID_CARRERA: 2,
          NOMBRE_CARRERA: 'Ingeniería Civil',
          ESCUELA_ID_ESCUELA: 1,
          NOMBRE_ESCUELA: 'Escuela de Ingeniería',
          PLANES_ESTUDIO_ASOCIADOS: 'Plan 2019',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockCarreras });

      await getAllCarreras(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockCarreras);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllCarreras', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getAllCarreras(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener carreras',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getCarreraById', () => {
    it('debería retornar una carrera por ID exitosamente', async () => {
      const mockCarrera = {
        ID_CARRERA: 1,
        NOMBRE_CARRERA: 'Ingeniería en Informática',
        ESCUELA_ID_ESCUELA: 1,
        NOMBRE_ESCUELA: 'Escuela de Ingeniería',
      };

      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rows: [mockCarrera] });

      await getCarreraById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.id_carrera = :id'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockCarrera);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la carrera no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getCarreraById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Carrera no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getCarreraById', async () => {
      req.params.id = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getCarreraById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener carrera',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('createCarrera', () => {
    it('debería crear una carrera exitosamente', async () => {
      req.body = {
        nombre_carrera: 'Nueva Carrera',
        escuela_id_escuela: 1,
      };

      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      await createCarrera(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ADMIN.CARRERA'),
        expect.objectContaining({
          nombre: 'Nueva Carrera',
          escuela: 1,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_carrera: 123 });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al crear carrera', async () => {
      req.body = {
        nombre_carrera: 'Nueva Carrera',
        escuela_id_escuela: 1,
      };

      mockConnection.execute.mockRejectedValue(new Error('Error al insertar'));

      await createCarrera(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear carrera',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('updateCarrera', () => {
    it('debería actualizar una carrera exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nombre_carrera: 'Carrera Actualizada',
        escuela_id_escuela: 2,
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await updateCarrera(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ADMIN.CARRERA'),
        expect.objectContaining({
          id: '1',
          nombre: 'Carrera Actualizada',
          escuela: 2,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Carrera actualizada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la carrera a actualizar no existe', async () => {
      req.params.id = '999';
      req.body = {
        nombre_carrera: 'Carrera Actualizada',
        escuela_id_escuela: 2,
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateCarrera(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Carrera no encontrada' });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar carrera', async () => {
      req.params.id = '1';
      req.body = {
        nombre_carrera: 'Carrera Actualizada',
        escuela_id_escuela: 2,
      };

      mockConnection.execute.mockRejectedValue(
        new Error('Error al actualizar')
      );

      await updateCarrera(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar carrera',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('deleteCarrera', () => {
    it('debería eliminar una carrera exitosamente cuando no tiene dependencias', async () => {
      req.params.id = '1';

      // Mock para simular todo el flujo de eliminación
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [] }) // SELECT ID_ASIGNATURA FROM ASIGNATURA - no asignaturas
        .mockResolvedValueOnce({}) // DELETE FROM ASIGNATURA WHERE CARRERA_ID_CARRERA
        .mockResolvedValueOnce({}) // DELETE FROM CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA
        .mockResolvedValueOnce({ rowsAffected: 1 }); // DELETE FROM CARRERA

      await deleteCarrera(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ID_ASIGNATURA FROM ASIGNATURA'),
        ['1'],
        expect.any(Object)
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Carrera y todos sus registros asociados eliminados correctamente.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la carrera a eliminar no existe', async () => {
      req.params.id = '999';

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [] }) // SELECT ID_ASIGNATURA FROM ASIGNATURA - no asignaturas
        .mockResolvedValueOnce({}) // DELETE FROM ASIGNATURA WHERE CARRERA_ID_CARRERA
        .mockResolvedValueOnce({}) // DELETE FROM CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA
        .mockResolvedValueOnce({ rowsAffected: 0 }); // DELETE FROM CARRERA - no rows affected

      await deleteCarrera(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Carrera no encontrada' });
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar carrera', async () => {
      req.params.id = '1';

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteCarrera(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar carrera y sus dependencias.',
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getCarrerasByEscuela', () => {
    it('debería retornar carreras por escuela exitosamente', async () => {
      const mockCarreras = [
        { ID_CARRERA: 1, NOMBRE_CARRERA: 'Ingeniería en Informática' },
        { ID_CARRERA: 2, NOMBRE_CARRERA: 'Ingeniería Civil' },
      ];

      req.params.escuelaId = '1';
      mockConnection.execute.mockResolvedValue({ rows: mockCarreras });

      await getCarrerasByEscuela(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ESCUELA_ID_ESCUELA = :escuelaId'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockCarreras);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al obtener carreras por escuela', async () => {
      req.params.escuelaId = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await getCarrerasByEscuela(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener carreras por escuela',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
