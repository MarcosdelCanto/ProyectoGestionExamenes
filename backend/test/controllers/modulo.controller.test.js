import { describe, test, expect, beforeEach, vi } from 'vitest';

/**
 * Configuración de mocks antes de las importaciones
 */

// Mock de la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

// Mock de oracledb
vi.mock('oracledb', () => ({
  default: {
    OUT_FORMAT_OBJECT: 4002,
    BIND_OUT: 3003,
    NUMBER: 2010,
  },
}));

/**
 * Suite de pruebas para el Controlador de Módulos
 */
describe('Controlador de Módulos', () => {
  let mockConnection;
  let req, res;

  beforeEach(async () => {
    const { getConnection } = await import('../../db.js');

    // Crear mock de conexión
    mockConnection = {
      execute: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      close: vi.fn(),
    };

    getConnection.mockResolvedValue(mockConnection);

    // Crear mocks de request y response
    req = {
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Limpiar todos los mocks
    vi.clearAllMocks();

    // Configurar comportamientos por defecto
    mockConnection.execute.mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    });
  });

  describe('getAllModulos', () => {
    test('debería retornar todos los módulos exitosamente', async () => {
      const { getAllModulos } = await import(
        '../../controllers/modulo.controller.js'
      );

      const mockModulos = [
        {
          ID_MODULO: 1,
          NOMBRE_MODULO: '08:00-09:30',
          INICIO_MODULO: '08:00',
          FIN_MODULO: '09:30',
          ORDEN: 1,
        },
        {
          ID_MODULO: 2,
          NOMBRE_MODULO: '09:45-11:15',
          INICIO_MODULO: '09:45',
          FIN_MODULO: '11:15',
          ORDEN: 2,
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockModulos,
      });

      await getAllModulos(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
        expect.objectContaining({
          outFormat: expect.any(Number),
        })
      );
      expect(res.json).toHaveBeenCalledWith(mockModulos);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería manejar errores de base de datos', async () => {
      const { getAllModulos } = await import(
        '../../controllers/modulo.controller.js'
      );

      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValueOnce(dbError);

      await getAllModulos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al obtener módulos',
        })
      );
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModuloById', () => {
    test('debería retornar un módulo específico exitosamente', async () => {
      const { getModuloById } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '1';

      const mockModulo = {
        ID_MODULO: 1,
        NOMBRE_MODULO: '08:00-09:30',
        INICIO_MODULO: '08:00',
        FIN_MODULO: '09:30',
        ORDEN: 1,
      };

      mockConnection.execute.mockResolvedValueOnce({
        rows: [mockModulo],
      });

      await getModuloById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM MODULO WHERE ID_MODULO = :id',
        { id: 1 },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockModulo);
    });

    test('debería retornar 404 cuando el módulo no existe', async () => {
      const { getModuloById } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '999';

      mockConnection.execute.mockResolvedValueOnce({
        rows: [],
      });

      await getModuloById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Módulo no encontrado'),
        })
      );
    });
  });

  describe('createModulo', () => {
    test('debería crear un módulo exitosamente', async () => {
      const { createModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.body = {
        nombre_modulo: '11:30-13:00',
        inicio_modulo: '11:30',
        fin_modulo: '13:00',
        orden: 3,
      };

      const mockResult = {
        outBinds: { newId: [3] },
      };

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      await createModulo(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO MODULO'),
        expect.objectContaining({
          nombre: '11:30-13:00',
          inicio: '11:30',
          fin: '13:00',
          orden: 3,
          newId: expect.any(Object),
        })
      );
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id_modulo: 3,
      });
    });

    test('debería retornar 400 cuando faltan campos obligatorios', async () => {
      const { createModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.body = {
        // Faltan campos requeridos
        nombre_modulo: '11:30-13:00',
      };

      const validationError = new Error('Required fields missing');
      mockConnection.execute.mockRejectedValueOnce(validationError);

      await createModulo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error creando módulo',
        })
      );
    });

    test('debería manejar errores de validación de horarios', async () => {
      const { createModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.body = {
        nombre_modulo: '11:30-13:00',
        inicio_modulo: '13:00', // Hora de inicio después de la de fin
        fin_modulo: '11:30',
        orden: 3,
      };

      const constraintError = new Error('Check constraint violation');
      constraintError.errorNum = 2290;
      mockConnection.execute.mockRejectedValueOnce(constraintError);

      await createModulo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error creando módulo',
        })
      );
    });
  });

  describe('updateModulo', () => {
    test('debería actualizar un módulo exitosamente', async () => {
      const { updateModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '1';
      req.body = {
        orden: 1,
        nombre_modulo: '08:00-09:30 (Actualizado)',
        inicio_modulo: '08:00',
        fin_modulo: '09:30',
        estado_id_estado: 1,
      };

      mockConnection.execute.mockResolvedValueOnce({
        rowsAffected: 1,
      });

      await updateModulo(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE MODULO'),
        expect.objectContaining({
          orden: 1,
          nombre: '08:00-09:30 (Actualizado)',
          inicio: '08:00',
          fin: '09:30',
          id: 1,
          estado_id: 1,
        })
      );
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Módulo actualizado correctamente',
      });
    });

    test('debería retornar 404 cuando el módulo no existe', async () => {
      const { updateModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '999';
      req.body = {
        orden: 1,
        nombre_modulo: 'No existe',
        inicio_modulo: '08:00',
        fin_modulo: '09:30',
        estado_id_estado: 1,
      };

      mockConnection.execute.mockResolvedValueOnce({
        rowsAffected: 0,
      });

      await updateModulo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Módulo no encontrado',
      });
    });
  });

  describe('deleteModulo', () => {
    test('debería eliminar un módulo exitosamente', async () => {
      const { deleteModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '1';

      mockConnection.execute.mockResolvedValueOnce({
        rowsAffected: 1,
      });

      await deleteModulo(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM MODULO WHERE id_modulo = :id',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Módulo eliminado',
      });
    });

    test('debería retornar 404 cuando el módulo no existe', async () => {
      const { deleteModulo } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.params.id = '999';

      mockConnection.execute.mockResolvedValueOnce({
        rowsAffected: 0,
      });

      await deleteModulo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Módulo no encontrado',
      });
    });
  });

  describe('getAvailableModules', () => {
    test('debería retornar módulos disponibles para una fecha y sala', async () => {
      const { getAvailableModules } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.query = {
        fecha_reserva: '2024-01-15',
        sala_id: '1',
      };

      const mockModulos = [
        {
          ID_MODULO: 1,
          NOMBRE_MODULO: '08:00-09:30',
          INICIO_MODULO: '08:00',
          FIN_MODULO: '09:30',
          ORDEN: 1,
        },
        {
          ID_MODULO: 2,
          NOMBRE_MODULO: '09:45-11:15',
          INICIO_MODULO: '09:45',
          FIN_MODULO: '11:15',
          ORDEN: 2,
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockModulos,
      });

      await getAvailableModules(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE e.NOMBRE_ESTADO = 'ACTIVO'"),
        expect.objectContaining({
          fecha_reserva_param: '2024-01-15',
          sala_id_param: 1,
          reserva_id_excluir_param: null,
        }),
        expect.objectContaining({
          outFormat: 4002,
        })
      );
      expect(res.json).toHaveBeenCalledWith(mockModulos);
    });

    test('debería retornar 400 cuando faltan parámetros requeridos', async () => {
      const { getAvailableModules } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.query = {
        fecha_reserva: '2024-01-15',
        // Falta sala_id
      };

      await getAvailableModules(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Se requiere una fecha y una sala'),
        })
      );
    });

    test('debería excluir una reserva específica cuando se proporciona reserva_id_excluir', async () => {
      const { getAvailableModules } = await import(
        '../../controllers/modulo.controller.js'
      );

      req.query = {
        fecha_reserva: '2024-01-15',
        sala_id: '1',
        reserva_id_excluir: '123',
      };

      const mockModulos = [
        {
          ID_MODULO: 1,
          NOMBRE_MODULO: '08:00-09:30',
          INICIO_MODULO: '08:00',
          FIN_MODULO: '09:30',
          ORDEN: 1,
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockModulos,
      });

      await getAvailableModules(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE e.NOMBRE_ESTADO = 'ACTIVO'"),
        expect.objectContaining({
          fecha_reserva_param: '2024-01-15',
          sala_id_param: 1,
          reserva_id_excluir_param: 123,
        }),
        expect.objectContaining({
          outFormat: 4002,
        })
      );
      expect(res.json).toHaveBeenCalledWith(mockModulos);
    });
  });
});
