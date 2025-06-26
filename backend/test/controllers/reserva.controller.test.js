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
    OBJECT: 'OBJECT',
    NUMBER: 'NUMBER',
  },
}));

/**
 * Suite de pruebas para el Controlador de Reservas
 */
describe('Controlador de Reservas', () => {
  let mockConnection;
  let req, res;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { getConnection } = await import('../../db.js');

    // Crear mock de conexión
    mockConnection = {
      execute: vi.fn(),
      executeMany: vi.fn(), // Agregar executeMany
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
      user: {},
      app: {
        get: vi.fn().mockReturnValue(null), // Mock para io
      },
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

  describe('getAllReservas', () => {
    test('debería retornar todas las reservas exitosamente', async () => {
      const { getAllReservas } = await import(
        '../../controllers/reserva.controller.js'
      );

      const mockReservas = [
        {
          ID_RESERVA: 1,
          FECHA_RESERVA: '2024-01-15',
          NOMBRE_EXAMEN: 'Matemáticas I',
          NOMBRE_SALA: 'Aula 101',
          EDIFICIO: 'A',
          SEDE: 'Campus Central',
        },
        {
          ID_RESERVA: 2,
          FECHA_RESERVA: '2024-01-16',
          NOMBRE_EXAMEN: 'Física I',
          NOMBRE_SALA: 'Aula 102',
          EDIFICIO: 'B',
          SEDE: 'Campus Central',
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockReservas,
      });

      await getAllReservas(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockReservas);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería manejar errores de base de datos', async () => {
      const { getAllReservas } = await import(
        '../../controllers/reserva.controller.js'
      );

      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValueOnce(dbError);

      await getAllReservas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Error al obtener reservas'),
        })
      );
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReservaById', () => {
    test('debería retornar una reserva específica exitosamente', async () => {
      const { getReservaById } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.id = '1';

      const mockReserva = {
        ID_RESERVA: 1,
        FECHA_RESERVA: '2024-01-15',
        NOMBRE_EXAMEN: 'Matemáticas I',
        NOMBRE_SALA: 'Aula 101',
        EDIFICIO: 'A',
        SEDE: 'Campus Central',
      };

      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [mockReserva],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await getReservaById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.ID_RESERVA = :id_param'),
        { id_param: 1 },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        ...mockReserva,
        MODULOS: [],
      });
    });

    test('debería retornar 400 cuando el ID no es válido', async () => {
      const { getReservaById } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.id = 'invalid';

      await getReservaById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El ID de la reserva no es válido.',
        details: 'El ID de la reserva no es válido.',
      });
    });

    test('debería retornar 404 cuando la reserva no existe', async () => {
      const { getReservaById } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.id = '999';

      mockConnection.execute.mockResolvedValueOnce({
        rows: [],
      });

      await getReservaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Reserva no encontrada'),
        })
      );
    });
  });

  describe('crearReservaParaExamenExistente', () => {
    test('debería crear una reserva exitosamente', async () => {
      const { crearReservaParaExamenExistente } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.body = {
        examen_id_examen: 1,
        fecha_reserva: '2024-01-15',
        sala_id_sala: 1,
        modulos_ids: [1, 2],
        docente_ids: [1],
      };

      // Mock del estado PROGRAMADO y creación de reserva
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ ID_ESTADO: 1 }] }) // Estado PROGRAMADO
        .mockResolvedValueOnce({
          outBinds: { new_reserva_id: [123] },
        }) // Insertar reserva con RETURNING
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Actualizar estado del examen

      // Mock para executeMany (módulos y docentes)
      mockConnection.executeMany
        .mockResolvedValueOnce({ rowsAffected: 2 }) // Insertar módulos
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Insertar docentes

      await crearReservaParaExamenExistente(req, res);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('exitosamente'),
        })
      );
    });

    test('debería retornar 400 cuando faltan campos obligatorios', async () => {
      const { crearReservaParaExamenExistente } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.body = {
        examen: 1,
        // Faltan campos requeridos
      };

      await crearReservaParaExamenExistente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Faltan campos obligatorios'),
        })
      );
    });

    test('debería retornar 500 cuando el estado PROGRAMADO no existe', async () => {
      const { crearReservaParaExamenExistente } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.body = {
        examen_id_examen: 1,
        fecha_reserva: '2024-01-15',
        sala_id_sala: 1,
        modulos_ids: [1, 2],
        docente_ids: [1],
      };

      // Mock cuando no se encuentra el estado PROGRAMADO
      mockConnection.execute.mockResolvedValueOnce({ rows: [] });

      await crearReservaParaExamenExistente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining(
            "El estado 'PROGRAMADO' no se encuentra configurado"
          ),
        })
      );
    });
  });

  describe('descartarReserva', () => {
    test('debería descartar una reserva exitosamente', async () => {
      const { descartarReserva } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.idReserva = '1';

      // Mock para simulación exitosa
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [
            {
              EXAMEN_ID_EXAMEN: 1,
              ESTADO_CONFIRMACION_DOCENTE: 'PENDIENTE',
            },
          ],
        }) // Información de la reserva
        .mockResolvedValueOnce({
          rows: [{ ID_ESTADO: 3 }],
        }) // Estado DESCARTADO
        .mockResolvedValueOnce({
          rows: [{ ID_ESTADO: 2 }],
        }) // Estado ACTIVO
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar módulos
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Actualizar reserva
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Actualizar estado del examen

      await descartarReserva(req, res);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            'descartada y examen reactivado exitosamente'
          ),
        })
      );
    });

    test('debería retornar 400 cuando la reserva no existe', async () => {
      const { descartarReserva } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.idReserva = 'abc'; // ID no numérico

      await descartarReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('ID de reserva inválido'),
        })
      );
    });
  });

  describe('cancelarReservaCompleta', () => {
    test('debería cancelar una reserva completa exitosamente', async () => {
      const { cancelarReservaCompleta } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.idReserva = '1';

      // Mock para simulación exitosa
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [{ EXAMEN_ID_EXAMEN: 1 }],
        }) // Obtener examen
        .mockResolvedValueOnce({
          rows: [{ ID_ESTADO: 2 }],
        }) // Estado ACTIVO
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar módulos
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar docentes
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar reserva
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Actualizar estado del examen

      await cancelarReservaCompleta(req, res);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            'cancelada y examen reactivado exitosamente'
          ),
        })
      );
    });

    test('debería retornar 400 cuando el ID no es válido', async () => {
      const { cancelarReservaCompleta } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.idReserva = 'xyz'; // ID no numérico

      await cancelarReservaCompleta(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('ID de reserva inválido'),
        })
      );
    });
  });

  describe('updateReserva', () => {
    test('debería actualizar una reserva exitosamente', async () => {
      const { updateReserva } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.id = '1';
      req.body = {
        fecha_reserva: '2024-01-16',
        sala_id_sala: 2,
        modulos_ids: [2, 3],
        docente_ids: [2],
      };

      // Mock para simulación exitosa
      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Actualizar fecha/sala
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar módulos antiguos
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar docentes antiguos
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Insertar docente

      // Mock para executeMany (insertar módulos)
      mockConnection.executeMany.mockResolvedValueOnce({ rowsAffected: 2 });

      await updateReserva(req, res);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('actualizada exitosamente'),
        })
      );
    });

    test('debería retornar error cuando la reserva no existe', async () => {
      const { updateReserva } = await import(
        '../../controllers/reserva.controller.js'
      );

      req.params.id = '999';
      req.body = {
        fecha_reserva: '2024-01-16',
        sala_id_sala: 2,
        modulos_ids: [2, 3],
        docente_ids: [2],
      };

      // Mock para simular error de actualización
      mockConnection.execute.mockRejectedValueOnce(
        new Error('Reserva no encontrada')
      );

      await updateReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Error al actualizar la reserva'),
        })
      );
    });
  });
});
