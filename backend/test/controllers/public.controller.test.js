import { vi, describe, it, expect, beforeEach } from 'vitest';
import { consultarReservasPublico } from '../../controllers/public.controller.js';

// Mocks
const mockExecute = vi.fn();
const mockClose = vi.fn();

const mockConnection = {
  execute: mockExecute,
  close: mockClose,
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador Public', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
    };
    res = {
      json: vi.fn(() => res),
      status: vi.fn(() => res),
    };
  });

  describe('consultarReservasPublico', () => {
    it('debería retornar reservas para un alumno exitosamente', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3, // ID_ROL_ALUMNO
      };

      const mockReservas = [
        {
          ID_RESERVA: 1,
          FECHA_RESERVA: '2024-01-15',
          NOMBRE_EXAMEN: 'Examen Final Matemática',
          NOMBRE_SECCION: 'Sección A',
          NOMBRE_ASIGNATURA: 'Matemática',
          NOMBRE_SALA: 'Sala A101',
          ESTADO_RESERVA: 'PROGRAMADO',
          ESTADO_CONFIRMACION_DOCENTE: 'CONFIRMADO',
          HORA_INICIO: '08:00',
          HORA_FIN: '10:00',
        },
      ];

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] }) // Buscar usuario
        .mockResolvedValueOnce({ rows: mockReservas }); // Buscar reservas

      await consultarReservasPublico(req, res);

      expect(mockExecute).toHaveBeenCalledTimes(2);

      // Verificar búsqueda de usuario
      expect(mockExecute).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT ID_USUARIO, ROL_ID_ROL'),
        { identificador_param: 'alumno@test.com' },
        expect.any(Object)
      );

      // Verificar búsqueda de reservas para alumno
      expect(mockExecute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'"),
        { userId_param: 1 },
        expect.any(Object)
      );
      expect(mockExecute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          "EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')"
        ),
        { userId_param: 1 },
        expect.any(Object)
      );

      expect(res.json).toHaveBeenCalledWith(mockReservas);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar reservas para un docente exitosamente', async () => {
      req.body = {
        identificador: 'docente@test.com',
        tipoUsuario: 'docente',
      };

      const mockUsuario = {
        ID_USUARIO: 2,
        ROL_ID_ROL: 2, // ID_ROL_DOCENTE
      };

      const mockReservas = [
        {
          ID_RESERVA: 2,
          FECHA_RESERVA: '2024-01-16',
          NOMBRE_EXAMEN: 'Examen Parcial Física',
          NOMBRE_SECCION: 'Sección B',
          NOMBRE_ASIGNATURA: 'Física',
          NOMBRE_SALA: 'Sala B102',
          ESTADO_RESERVA: 'PENDIENTE',
          ESTADO_CONFIRMACION_DOCENTE: 'PENDIENTE',
          HORA_INICIO: '14:00',
          HORA_FIN: '16:00',
        },
      ];

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] }) // Buscar usuario
        .mockResolvedValueOnce({ rows: mockReservas }); // Buscar reservas

      await consultarReservasPublico(req, res);

      expect(mockExecute).toHaveBeenCalledTimes(2);

      // Verificar búsqueda de reservas para docente
      expect(mockExecute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          "R.ESTADO_CONFIRMACION_DOCENTE != 'REQUIERE_REVISION'"
        ),
        { userId_param: 2 },
        expect.any(Object)
      );
      expect(mockExecute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          "EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO', 'PENDIENTE')"
        ),
        { userId_param: 2 },
        expect.any(Object)
      );

      expect(res.json).toHaveBeenCalledWith(mockReservas);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando falta identificador', async () => {
      req.body = {
        tipoUsuario: 'alumno',
        // Falta identificador
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Identificador y tipo de usuario son requeridos.',
        ':',
        null
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Identificador y tipo de usuario son requeridos.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockExecute).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería retornar 400 cuando falta tipoUsuario', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        // Falta tipoUsuario
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await consultarReservasPublico(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Identificador y tipo de usuario son requeridos.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockExecute).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería retornar 400 para tipo de usuario inválido', async () => {
      req.body = {
        identificador: 'usuario@test.com',
        tipoUsuario: 'administrador', // Tipo inválido
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Tipo de usuario no válido.',
        ':',
        null
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tipo de usuario no válido.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockExecute).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería retornar 404 cuando el usuario no existe', async () => {
      req.body = {
        identificador: 'inexistente@test.com',
        tipoUsuario: 'alumno',
      };

      mockExecute.mockResolvedValueOnce({ rows: [] }); // Usuario no encontrado

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Usuario no encontrado con el identificador proporcionado.',
        ':',
        null
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado con el identificador proporcionado.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería retornar 403 cuando el rol del usuario no coincide', async () => {
      req.body = {
        identificador: 'admin@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 1, // ROL_ID_ADMIN, no es alumno (3)
      };

      mockExecute.mockResolvedValueOnce({ rows: [mockUsuario] });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'El identificador no corresponde a un alumno.',
        ':',
        null
      );
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El identificador no corresponde a un alumno.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar tipos de usuario case-insensitive', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'ALUMNO', // Mayúsculas
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3,
      };

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] })
        .mockResolvedValueOnce({ rows: [] });

      await consultarReservasPublico(req, res);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('debería retornar error para rol no correspondiente al tipo solicitado', async () => {
      req.body = {
        identificador: 'usuario@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 999, // Rol que no es alumno
      };

      mockExecute.mockResolvedValueOnce({ rows: [mockUsuario] });

      await consultarReservasPublico(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: 'El identificador no corresponde a un alumno.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'alumno',
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de conexión BD'));

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al consultar reservas',
        ':',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al consultar reservas',
        details: 'Error de conexión BD',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar errores al cerrar la conexión', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3,
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] })
        .mockResolvedValueOnce({ rows: [] });
      mockClose.mockRejectedValue(new Error('Error al cerrar conexión'));

      await consultarReservasPublico(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error cerrando conexión en consultarReservasPublico',
        expect.any(Error)
      );
      expect(res.json).toHaveBeenCalledWith([]);

      consoleErrorSpy.mockRestore();
    });

    it('debería convertir identificador a minúsculas', async () => {
      req.body = {
        identificador: 'ALUMNO@TEST.COM',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3,
      };

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] })
        .mockResolvedValueOnce({ rows: [] });

      await consultarReservasPublico(req, res);

      expect(mockExecute).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        { identificador_param: 'alumno@test.com' }, // Convertido a minúsculas
        expect.any(Object)
      );
    });

    it('debería incluir ordenamiento por fecha y hora en las consultas', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3,
      };

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] })
        .mockResolvedValueOnce({ rows: [] });

      await consultarReservasPublico(req, res);

      expect(mockExecute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          'ORDER BY R.FECHA_RESERVA ASC, HORA_INICIO ASC'
        ),
        { userId_param: 1 },
        expect.any(Object)
      );
    });

    it('debería incluir cálculo de horas inicio y fin en la consulta', async () => {
      req.body = {
        identificador: 'alumno@test.com',
        tipoUsuario: 'alumno',
      };

      const mockUsuario = {
        ID_USUARIO: 1,
        ROL_ID_ROL: 3,
      };

      mockExecute
        .mockResolvedValueOnce({ rows: [mockUsuario] })
        .mockResolvedValueOnce({ rows: [] });

      await consultarReservasPublico(req, res);

      const sqlCall = mockExecute.mock.calls[1][0];
      expect(sqlCall).toContain('MIN(M.INICIO_MODULO)');
      expect(sqlCall).toContain('MAX(M.FIN_MODULO)');
      expect(sqlCall).toContain('AS HORA_INICIO');
      expect(sqlCall).toContain('AS HORA_FIN');
    });
  });
});
