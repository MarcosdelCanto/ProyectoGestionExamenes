// test/controllers/reports.controller.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getReporteDetalladoExamenes,
  getReporteAlumnosReservas,
} from '../../controllers/reports.controller.js';

// Mock de la base de datos
const mockConnection = {
  execute: vi.fn(),
  close: vi.fn(),
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador de Reportes', () => {
  let req, res;

  beforeEach(() => {
    // Setup para cada test
    req = {
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Limpiar mocks
    vi.clearAllMocks();
  });

  describe('getReporteDetalladoExamenes', () => {
    test('debería retornar reporte detallado de exámenes sin filtros', async () => {
      // Arrange
      const mockReportData = [
        {
          ID_EXAMEN: 1,
          NOMBRE_EXAMEN: 'Examen Matemáticas',
          FECHA_RESERVA: '2024-01-15',
          NOMBRE_SALA: 'Sala 101',
          NOMBRE_CARRERA: 'Ingeniería Civil',
          NOMBRE_ESTADO_RESERVA: 'PROGRAMADO',
        },
        {
          ID_EXAMEN: 2,
          NOMBRE_EXAMEN: 'Examen Física',
          FECHA_RESERVA: '2024-01-16',
          NOMBRE_SALA: 'Sala 102',
          NOMBRE_CARRERA: 'Ingeniería Civil',
          NOMBRE_ESTADO_RESERVA: 'PROGRAMADO',
        },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockReportData });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockReportData);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM V_REPORTE_EXAMENES_DETALLADO'),
        {},
        expect.any(Object)
      );
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería aplicar filtros de sede, escuela y carrera', async () => {
      // Arrange
      req.query = {
        sedeId: '1',
        escuelaId: '2',
        carreraId: '3',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ID_SEDE = :sedeId'),
        expect.objectContaining({
          sedeId: 1,
          escuelaId: 2,
          carreraId: 3,
        }),
        expect.any(Object)
      );
    });

    test('debería aplicar filtros de asignatura, jornada y estado', async () => {
      // Arrange
      req.query = {
        asignaturaId: '5',
        jornadaId: '1',
        estadoExamenId: '2',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ID_ASIGNATURA = :asignaturaId'),
        expect.objectContaining({
          asignaturaId: 5,
          jornadaId: 1,
          estadoExamenId: 2,
        }),
        expect.any(Object)
      );
    });

    test('debería aplicar filtro especial de docente con INSTR', async () => {
      // Arrange
      req.query = {
        docenteId: '123',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSTR'),
        expect.objectContaining({
          docenteId: '123',
        }),
        expect.any(Object)
      );
    });

    test('debería aplicar filtros de fecha desde y hasta', async () => {
      // Arrange
      req.query = {
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('TO_DATE(:fechaDesde'),
        expect.objectContaining({
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
        }),
        expect.any(Object)
      );
    });

    test('debería excluir reservas descartadas por defecto', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("NOMBRE_ESTADO_RESERVA != 'DESCARTADO'"),
        {},
        expect.any(Object)
      );
    });

    test('debería ordenar por fecha y nombre de examen', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY FECHA_RESERVA DESC, NOMBRE_EXAMEN'),
        {},
        expect.any(Object)
      );
    });

    test('debería ignorar filtros con valores inválidos', async () => {
      // Arrange
      req.query = {
        sedeId: 'invalid',
        escuelaId: '',
        carreraId: null,
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.not.stringContaining('ID_SEDE = :sedeId'),
        {},
        expect.any(Object)
      );
    });

    test('debería manejar errores de base de datos', async () => {
      // Arrange
      const dbError = new Error('Error de consulta');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getReporteDetalladoExamenes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al generar el reporte detallado de exámenes',
        details: 'Error de consulta',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getReporteAlumnosReservas', () => {
    test('debería retornar reporte de alumnos y reservas sin filtros', async () => {
      // Arrange
      const mockReportData = [
        {
          ID_USUARIO: 1,
          NOMBRE_USUARIO: 'Juan Pérez',
          NOMBRE_EXAMEN: 'Examen Matemáticas',
          FECHA_RESERVA: '2024-01-15',
          NOMBRE_CARRERA: 'Ingeniería Civil',
          ESTADO_RESERVA: 'PROGRAMADO',
        },
        {
          ID_USUARIO: 2,
          NOMBRE_USUARIO: 'María González',
          NOMBRE_EXAMEN: 'Examen Física',
          FECHA_RESERVA: '2024-01-16',
          NOMBRE_CARRERA: 'Ingeniería Civil',
          ESTADO_RESERVA: 'PROGRAMADO',
        },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockReportData });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockReportData);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM V_REPORTE_ALUMNOS_RESERVAS'),
        {},
        expect.any(Object)
      );
    });

    test('debería aplicar filtros de sede, escuela y carrera para alumnos', async () => {
      // Arrange
      req.query = {
        sedeId: '1',
        escuelaId: '2',
        carreraId: '3',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ID_CARRERA = :carreraId'),
        expect.objectContaining({
          sedeId: 1,
          escuelaId: 2,
          carreraId: 3,
        }),
        expect.any(Object)
      );
    });

    test('debería aplicar filtros de asignatura, sección y jornada', async () => {
      // Arrange
      req.query = {
        asignaturaId: '5',
        seccionId: '10',
        jornadaId: '1',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ID_SECCION = :seccionId'),
        expect.objectContaining({
          asignaturaId: 5,
          seccionId: 10,
          jornadaId: 1,
        }),
        expect.any(Object)
      );
    });

    test('debería excluir reservas descartadas en reporte de alumnos', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("ESTADO_RESERVA != 'DESCARTADO'"),
        {},
        expect.any(Object)
      );
    });

    test('debería ordenar por nombre de usuario y fecha de reserva', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY NOMBRE_USUARIO, FECHA_RESERVA DESC'),
        {},
        expect.any(Object)
      );
    });

    test('debería manejar errores de base de datos en reporte de alumnos', async () => {
      // Arrange
      const dbError = new Error('Error de consulta alumnos');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al generar el reporte de alumnos',
        details: 'Error de consulta alumnos',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería ignorar parámetros inválidos en reporte de alumnos', async () => {
      // Arrange
      req.query = {
        sedeId: 'abc',
        escuelaId: '',
        carreraId: undefined,
        asignaturaId: 'xyz',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getReporteAlumnosReservas(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.not.stringContaining('ID_SEDE = :sedeId'),
        {},
        expect.any(Object)
      );
    });
  });
});
