// test/controllers/sala.controller.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getAllSalas,
  getSalaById,
  createSala,
  updateSala,
  deleteSala,
} from '../../controllers/sala.controller.js';

// Mock de la base de datos
const mockConnection = {
  execute: vi.fn(),
  close: vi.fn(),
  commit: vi.fn(),
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador de Salas', () => {
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

  describe('getAllSalas', () => {
    test('debería retornar todas las salas exitosamente', async () => {
      // Arrange
      const mockSalas = [
        {
          ID_SALA: 1,
          NOMBRE_SALA: 'Sala 101',
          CAPACIDAD_SALA: 30,
          EDIFICIO_ID_EDIFICIO: 1,
          COD_SALA: 'S101',
          NOMBRE_EDIFICIO: 'Edificio Central',
          SIGLA_EDIFICIO: 'EC',
        },
        {
          ID_SALA: 2,
          NOMBRE_SALA: 'Sala 102',
          CAPACIDAD_SALA: 25,
          EDIFICIO_ID_EDIFICIO: 1,
          COD_SALA: 'S102',
          NOMBRE_EDIFICIO: 'Edificio Central',
          SIGLA_EDIFICIO: 'EC',
        },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockSalas });

      // Act
      await getAllSalas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockSalas);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.id_sala, s.nombre_sala'),
        [],
        expect.any(Object)
      );
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería manejar errores de base de datos en getAllSalas', async () => {
      // Arrange
      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getAllSalas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener salas',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getSalaById', () => {
    test('debería retornar una sala por ID exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      const mockSala = {
        ID_SALA: 1,
        NOMBRE_SALA: 'Sala 101',
        CAPACIDAD_SALA: 30,
        EDIFICIO_ID_EDIFICIO: 1,
        COD_SALA: 'S101',
        NOMBRE_EDIFICIO: 'Edificio Central',
        SIGLA_EDIFICIO: 'EC',
      };
      mockConnection.execute.mockResolvedValue({ rows: [mockSala] });

      // Act
      await getSalaById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockSala);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE s.id_sala = :id'),
        ['1'],
        expect.any(Object)
      );
    });

    test('debería retornar 404 cuando la sala no existe', async () => {
      // Arrange
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getSalaById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sala no encontrada' });
    });

    test('debería manejar errores de base de datos en getSalaById', async () => {
      // Arrange
      req.params.id = '1';
      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getSalaById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener sala' });
    });
  });

  describe('createSala', () => {
    test('debería crear una sala exitosamente', async () => {
      // Arrange
      req.body = {
        nombre_sala: 'Sala Nueva',
        capacidad_sala: 40,
        edificio_id_edificio: 1,
      };
      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      // Act
      await createSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_sala: 123 });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO SALA'),
        expect.objectContaining({
          nombre: 'Sala Nueva',
          capacidad: 40,
          edificio: 1,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería manejar errores al crear sala', async () => {
      // Arrange
      req.body = {
        nombre_sala: 'Sala Nueva',
        capacidad_sala: 40,
        edificio_id_edificio: 1,
      };
      const dbError = new Error('Error al insertar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await createSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear sala' });
    });
  });

  describe('updateSala', () => {
    test('debería actualizar una sala exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        nombre_sala: 'Sala Actualizada',
        capacidad_sala: 35,
        edificio_id_edificio: 2,
      };
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      // Act
      await updateSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Sala actualizada' });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE SALA'),
        expect.objectContaining({
          id: '1',
          nombre: 'Sala Actualizada',
          capacidad: 35,
          edificio_id: 2,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería retornar 404 cuando la sala a actualizar no existe', async () => {
      // Arrange
      req.params.id = '999';
      req.body = {
        nombre_sala: 'Sala Actualizada',
        capacidad_sala: 35,
        edificio_id_edificio: 2,
      };
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act
      await updateSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sala no encontrada' });
    });

    test('debería manejar errores al actualizar sala', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        nombre_sala: 'Sala Actualizada',
        capacidad_sala: 35,
        edificio_id_edificio: 2,
      };
      const dbError = new Error('Error al actualizar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await updateSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar sala',
      });
    });
  });

  describe('deleteSala', () => {
    test('debería eliminar una sala exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      // Act
      await deleteSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Sala eliminada' });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM SALA WHERE id_sala = :id',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('debería retornar 404 cuando la sala a eliminar no existe', async () => {
      // Arrange
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act
      await deleteSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sala no encontrada' });
    });

    test('debería manejar errores al eliminar sala', async () => {
      // Arrange
      req.params.id = '1';
      const dbError = new Error('Error al eliminar');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await deleteSala(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar sala',
      });
    });
  });
});
