import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getMisReservas } from '../../controllers/alumno.controller.js';

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

describe('Controlador de Alumnos', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: {
        id_usuario: 1,
        rol_id_rol: 3, // ROL_ID_ALUMNO
      },
    };
    res = {
      json: vi.fn(() => res),
      status: vi.fn(() => res),
    };
  });

  describe('getMisReservas', () => {
    it('debería retornar las reservas del alumno exitosamente', async () => {
      const mockReservas = [
        {
          ID_USUARIO: 1,
          NOMBRE_USUARIO: 'Juan Estudiante',
          EMAIL_USUARIO: 'juan@estudiante.com',
          ID_EXAMEN: 10,
          NOMBRE_EXAMEN: 'Examen Final Matemática',
          ID_RESERVA: 5,
          FECHA_RESERVA: '2024-01-15',
          HORA_INICIO: '08:00',
          HORA_FIN: '10:00',
          NOMBRE_SALA: 'Sala A101',
          ESTADO_EXAMEN: 'ACTIVO',
          ESTADO_RESERVA: 'PROGRAMADO',
          ESTADO_CONFIRMACION_DOCENTE: ' CONFIRMADO',
          NOMBRE_ASIGNATURA: 'Matemática',
          NOMBRE_SECCION: 'Sección A',
          NOMBRE_CARRERA: 'Ingeniería',
          NOMBRE_JORNADA: 'Diurna',
        },
        {
          ID_USUARIO: 1,
          NOMBRE_USUARIO: 'Juan Estudiante',
          EMAIL_USUARIO: 'juan@estudiante.com',
          ID_EXAMEN: 11,
          NOMBRE_EXAMEN: 'Examen Parcial Física',
          ID_RESERVA: 6,
          FECHA_RESERVA: '2024-01-20',
          HORA_INICIO: '14:00',
          HORA_FIN: '16:00',
          NOMBRE_SALA: 'Sala B102',
          ESTADO_EXAMEN: 'ACTIVO',
          ESTADO_RESERVA: 'CONFIRMADO',
          ESTADO_CONFIRMACION_DOCENTE: ' CONFIRMADO',
          NOMBRE_ASIGNATURA: 'Física',
          NOMBRE_SECCION: 'Sección B',
          NOMBRE_CARRERA: 'Ingeniería',
          NOMBRE_JORNADA: 'Diurna',
        },
      ];

      mockExecute.mockResolvedValue({
        rows: mockReservas,
      });

      await getMisReservas(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('FROM V_REPORTE_ALUMNOS_RESERVAS'),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ID_USUARIO = :idAlumnoAutenticado'),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining(
          "AND ESTADO_CONFIRMACION_DOCENTE = ' CONFIRMADO'"
        ),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockReservas);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar lista vacía cuando el alumno no tiene reservas', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getMisReservas(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería denegar acceso si el usuario no es alumno', async () => {
      req.user.rol_id_rol = 1; // No es alumno (ROL_ID_ALUMNO = 3)

      await getMisReservas(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. Funcionalidad solo para alumnos.',
        details: null,
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de conexión BD'));

      await getMisReservas(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener las reservas del alumno',
        ':',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener las reservas del alumno',
        details: 'Error de conexión BD',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar errores al cerrar la conexión', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockResolvedValue({ rows: [] });
      mockClose.mockRejectedValue(new Error('Error al cerrar conexión'));

      await getMisReservas(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error closing connection for getMisReservas',
        expect.any(Error)
      );
      expect(res.json).toHaveBeenCalledWith([]);

      consoleErrorSpy.mockRestore();
    });

    it('debería verificar que el filtro incluye solo reservas confirmadas', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getMisReservas(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringMatching(/ESTADO_CONFIRMACION_DOCENTE = ' CONFIRMADO'/),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
    });

    it('debería ordenar las reservas por fecha y hora de inicio', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getMisReservas(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringMatching(/ORDER BY FECHA_RESERVA ASC, HORA_INICIO ASC/),
        { idAlumnoAutenticado: 1 },
        expect.any(Object)
      );
    });

    it('debería usar el ID del usuario autenticado correctamente', async () => {
      req.user.id_usuario = 999;

      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getMisReservas(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.any(String),
        { idAlumnoAutenticado: 999 },
        expect.any(Object)
      );
    });

    it('debería incluir todos los campos requeridos en la consulta', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getMisReservas(req, res);

      const sqlCall = mockExecute.mock.calls[0][0];

      // Verificar que incluye los campos principales
      expect(sqlCall).toContain('ID_USUARIO');
      expect(sqlCall).toContain('NOMBRE_USUARIO');
      expect(sqlCall).toContain('EMAIL_USUARIO');
      expect(sqlCall).toContain('ID_EXAMEN');
      expect(sqlCall).toContain('NOMBRE_EXAMEN');
      expect(sqlCall).toContain('ID_RESERVA');
      expect(sqlCall).toContain('FECHA_RESERVA');
      expect(sqlCall).toContain('HORA_INICIO');
      expect(sqlCall).toContain('HORA_FIN');
      expect(sqlCall).toContain('NOMBRE_SALA');
      expect(sqlCall).toContain('ESTADO_EXAMEN');
      expect(sqlCall).toContain('ESTADO_RESERVA');
      expect(sqlCall).toContain('ESTADO_CONFIRMACION_DOCENTE');
      expect(sqlCall).toContain('NOMBRE_ASIGNATURA');
      expect(sqlCall).toContain('NOMBRE_SECCION');
      expect(sqlCall).toContain('NOMBRE_CARRERA');
      expect(sqlCall).toContain('NOMBRE_JORNADA');
    });
  });
});
