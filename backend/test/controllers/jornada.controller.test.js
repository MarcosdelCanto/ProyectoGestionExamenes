import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getAllJornadas,
  getJornadaById,
  createJornada,
  updateJornada,
  deleteJornada,
} from '../../controllers/jornada.controller.js';

// Mocks
const mockExecute = vi.fn();
const mockClose = vi.fn();
const mockCommit = vi.fn();

const mockConnection = {
  execute: mockExecute,
  close: mockClose,
  commit: mockCommit,
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador de Jornadas', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {
      json: vi.fn(() => res),
      status: vi.fn(() => res),
    };
  });

  describe('getAllJornadas', () => {
    it('debería retornar todas las jornadas exitosamente', async () => {
      const mockJornadas = [
        { ID_JORNADA: 1, NOMBRE_JORNADA: 'Diurna' },
        { ID_JORNADA: 2, NOMBRE_JORNADA: 'Vespertina' },
      ];

      mockExecute.mockResolvedValue({
        rows: mockJornadas,
      });

      await getAllJornadas(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT  id_jornada, nombre_jornada'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockJornadas);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllJornadas', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getAllJornadas(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener jornadas:',
        expect.any(Error)
      );
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getJornadaById', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería retornar una jornada específica exitosamente', async () => {
      const mockJornada = { ID_JORNADA: 1, NOMBRE_JORNADA: 'Diurna' };

      mockExecute.mockResolvedValue({
        rows: [mockJornada],
      });

      await getJornadaById(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT  id_jornada, nombre_jornada'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockJornada);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la jornada no existe', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getJornadaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'La jornada no existe' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getJornadaById', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getJornadaById(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener jornada:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener jornada',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createJornada', () => {
    it('debería crear una jornada exitosamente cuando cod_jornada es falsy', async () => {
      req.body = {
        nombre_jornada: 'Nueva Jornada',
        cod_jornada: null, // cod_jornada falsy para que pase la validación buggy
      };

      mockExecute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      await createJornada(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO JORNADA'),
        expect.objectContaining({
          nombre_jornada: 'Nueva Jornada',
          cod_jornada: null,
        })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Jornada creada con éxito',
        id: 123,
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando falta nombre_jornada', async () => {
      req.body = {
        // Falta nombre_jornada
        cod_jornada: 'NJ001',
      };

      await createJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Todos los campos son obligatorios',
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('debería retornar 400 cuando cod_jornada existe pero nombre_jornada falta (debido al bug lógico)', async () => {
      req.body = {
        // Falta nombre_jornada
        cod_jornada: 'NJ001',
      };

      await createJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Todos los campos son obligatorios',
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('debería manejar errores al crear jornada', async () => {
      req.body = {
        nombre_jornada: 'Nueva Jornada',
        cod_jornada: null, // cod_jornada falsy para que pase la validación buggy
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al insertar'));

      await createJornada(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al crear jornada:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear jornada',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateJornada', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería actualizar una jornada exitosamente', async () => {
      req.body = {
        nombre_jornada: 'Jornada Actualizada',
        cod_jornada: 'JA001',
      };

      mockExecute.mockResolvedValue({
        rowsAffected: 1,
      });

      await updateJornada(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE JORNADA'),
        expect.objectContaining({
          nombre_jornada: 'Jornada Actualizada',
          cod_jornada: 'JA001',
          id: '1',
        })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Jornada actualizada con éxito',
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando falta nombre_jornada', async () => {
      req.body = {
        cod_jornada: 'JA001',
        // Falta nombre_jornada
      };

      await updateJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nombre de jornada y código de jornada son obligatorios',
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('debería retornar 400 cuando falta cod_jornada', async () => {
      req.body = {
        nombre_jornada: 'Jornada Actualizada',
        // Falta cod_jornada
      };

      await updateJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nombre de jornada y código de jornada son obligatorios',
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la jornada no existe', async () => {
      req.body = {
        nombre_jornada: 'Jornada Actualizada',
        cod_jornada: 'JA001',
      };

      mockExecute.mockResolvedValue({
        rowsAffected: 0,
      });

      await updateJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La jornada no existe o no se modificaron datos',
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar jornada', async () => {
      req.body = {
        nombre_jornada: 'Jornada Actualizada',
        cod_jornada: 'JA001',
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al actualizar'));

      await updateJornada(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al actualizar jornada:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar jornada',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteJornada', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería eliminar una jornada exitosamente', async () => {
      mockExecute.mockResolvedValue({
        rowsAffected: 1,
      });

      await deleteJornada(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM JORNADA'),
        expect.objectContaining({
          id: '1',
        })
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la jornada no existe', async () => {
      mockExecute.mockResolvedValue({
        rowsAffected: 0,
      });

      await deleteJornada(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'La jornada no existe' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar jornada', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteJornada(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al eliminar jornada:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar jornada',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
