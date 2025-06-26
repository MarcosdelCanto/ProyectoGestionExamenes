// test/controllers/asignatura.controller.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getAllAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura,
} from '../../controllers/asignatura.controller.js';

// Mock de la base de datos
const mockConnection = {
  execute: vi.fn(),
  close: vi.fn(),
  commit: vi.fn(),
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador de Asignaturas', () => {
  let req, res;

  beforeEach(() => {
    // Setup para cada test
    req = {
      params: {},
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Limpiar mocks
    vi.clearAllMocks();
  });

  describe('getAllAsignaturas', () => {
    test('debería retornar todas las asignaturas con información de carrera', async () => {
      // Arrange
      const mockAsignaturas = [
        {
          ID_ASIGNATURA: 1,
          NOMBRE_ASIGNATURA: 'Matemáticas I',
          CARRERA_ID_CARRERA: 1,
          NOMBRE_CARRERA: 'Ingeniería Civil',
        },
        {
          ID_ASIGNATURA: 2,
          NOMBRE_ASIGNATURA: 'Física I',
          CARRERA_ID_CARRERA: 1,
          NOMBRE_CARRERA: 'Ingeniería Civil',
        },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockAsignaturas });

      // Act
      await getAllAsignaturas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockAsignaturas);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id_asignatura, a.nombre_asignatura'),
        [],
        expect.any(Object)
      );
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería manejar errores de base de datos en getAllAsignaturas', async () => {
      // Arrange
      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getAllAsignaturas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener asignaturas',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getAsignaturaById', () => {
    test('debería retornar una asignatura por ID con información de carrera', async () => {
      // Arrange
      req.params.id = '1';
      const mockAsignatura = {
        ID_ASIGNATURA: 1,
        NOMBRE_ASIGNATURA: 'Matemáticas I',
        CARRERA_ID_CARRERA: 1,
        NOMBRE_CARRERA: 'Ingeniería Civil',
      };
      mockConnection.execute.mockResolvedValue({ rows: [mockAsignatura] });

      // Act
      await getAsignaturaById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockAsignatura);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE a.id_asignatura = :id'),
        ['1'],
        expect.any(Object)
      );
    });

    test('debería retornar 404 cuando la asignatura no existe', async () => {
      // Arrange
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getAsignaturaById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Asignatura no encontrada',
      });
    });

    test('debería manejar errores de base de datos en getAsignaturaById', async () => {
      // Arrange
      req.params.id = '1';
      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getAsignaturaById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener asignatura',
      });
    });
  });

  describe('createAsignatura', () => {
    test('debería crear una asignatura exitosamente', async () => {
      // Arrange
      req.body = {
        nombre_asignatura: 'Química I',
        carrera_id_carrera: 2,
      };
      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      // Act
      await createAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_asignatura: 123 });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ASIGNATURA'),
        expect.objectContaining({
          nombre: 'Química I',
          carrera: 2,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería manejar errores al crear asignatura', async () => {
      // Arrange
      req.body = {
        nombre_asignatura: 'Química I',
        carrera_id_carrera: 2,
      };
      const dbError = new Error('Error al insertar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await createAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear asignatura',
      });
    });
  });

  describe('updateAsignatura', () => {
    test('debería actualizar una asignatura exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        nombre_asignatura: 'Matemáticas Avanzadas',
        carrera_id_carrera: 3,
      };
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      // Act
      await updateAsignatura(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        message: 'Asignatura actualizada',
      });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ASIGNATURA'),
        expect.objectContaining({
          id: '1',
          nombre: 'Matemáticas Avanzadas',
          carrera: 3,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería retornar 404 cuando la asignatura a actualizar no existe', async () => {
      // Arrange
      req.params.id = '999';
      req.body = {
        nombre_asignatura: 'Matemáticas Avanzadas',
        carrera_id_carrera: 3,
      };
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act
      await updateAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Asignatura no encontrada',
      });
    });

    test('debería manejar errores al actualizar asignatura', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        nombre_asignatura: 'Matemáticas Avanzadas',
        carrera_id_carrera: 3,
      };
      const dbError = new Error('Error al actualizar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await updateAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar asignatura',
      });
    });
  });

  describe('deleteAsignatura', () => {
    test('debería eliminar una asignatura exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      // Act
      await deleteAsignatura(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        message: 'Asignatura eliminada',
      });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM ASIGNATURA WHERE id_asignatura = :id',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería retornar 404 cuando la asignatura a eliminar no existe', async () => {
      // Arrange
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act
      await deleteAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Asignatura no encontrada',
      });
    });

    test('debería manejar errores al eliminar asignatura', async () => {
      // Arrange
      req.params.id = '1';
      const dbError = new Error('Error al eliminar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await deleteAsignatura(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar asignatura',
      });
    });
  });
});
