// test/controllers/dashboard.controller.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock de la base de datos
const mockConnection = {
  execute: vi.fn(),
  close: vi.fn().mockResolvedValue(),
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

// Importar controladores después del mock
import {
  getDashboardSummary,
  getExamenesPorCarreraChartData,
  getModulosAgendadosChartData,
  getUsoSalasChartData,
} from '../../controllers/dashboard.controller.js';

describe('Controlador de Dashboard', () => {
  let req, res;

  beforeEach(() => {
    // Setup para cada test
    req = {
      user: { id_usuario: 1, rol_id_rol: 1 }, // Admin por defecto
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Limpiar mocks
    vi.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    test('debería retornar resumen completo para usuario administrador', async () => {
      // Arrange - Mock de respuestas para admin
      const mockResults = [
        { rows: [{ TOTAL: 5 }] }, // sedes
        { rows: [{ TOTAL: 10 }] }, // escuelas
        { rows: [{ TOTAL: 15 }] }, // carreras
        { rows: [{ TOTAL: 50 }] }, // asignaturas
        { rows: [{ TOTAL: 100 }] }, // usuarios
        { rows: [{ TOTAL: 25 }] }, // docentes
        { rows: [{ TOTAL: 30 }] }, // exámenes activos
      ];

      mockConnection.execute
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])
        .mockResolvedValueOnce(mockResults[3])
        .mockResolvedValueOnce(mockResults[4])
        .mockResolvedValueOnce(mockResults[5])
        .mockResolvedValueOnce(mockResults[6]);

      // Act
      await getDashboardSummary(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        totalSedes: 5,
        totalEscuelas: 10,
        totalCarreras: 15,
        totalAsignaturas: 50,
        totalUsuarios: 100,
        totalDocentes: 25,
        examenesActivos: 30,
      });
      expect(mockConnection.execute).toHaveBeenCalledTimes(7);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería retornar resumen filtrado para usuario no administrador', async () => {
      // Arrange - Usuario no admin
      req.user = { id_usuario: 2, rol_id_rol: 2 };

      const mockResults = [
        { rows: [{ TOTAL: 2 }] }, // carreras asociadas
        { rows: [{ TOTAL: 8 }] }, // asignaturas asociadas
        { rows: [{ TOTAL: 1 }] }, // escuelas asociadas
        { rows: [{ TOTAL: 1 }] }, // sedes asociadas
        { rows: [{ TOTAL: 5 }] }, // exámenes activos asociados
        { rows: [{ TOTAL: 100 }] }, // usuarios totales
        { rows: [{ TOTAL: 25 }] }, // docentes totales
      ];

      mockConnection.execute
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])
        .mockResolvedValueOnce(mockResults[3])
        .mockResolvedValueOnce(mockResults[4])
        .mockResolvedValueOnce(mockResults[5])
        .mockResolvedValueOnce(mockResults[6]);

      // Act
      await getDashboardSummary(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        totalCarreras: 2,
        totalAsignaturas: 8,
        totalEscuelas: 1,
        totalSedes: 1,
        examenesActivos: 5,
        totalUsuarios: 100,
        totalDocentes: 25,
      });

      // Verificar que se pase el userId en los parámetros
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('uc.USUARIO_ID_USUARIO = :userId'),
        { userId: 2 }
      );
    });

    test('debería manejar valores null en las consultas', async () => {
      // Arrange - Resultados con null
      const mockResults = [
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
        { rows: [{ TOTAL: null }] },
      ];

      mockConnection.execute
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])
        .mockResolvedValueOnce(mockResults[3])
        .mockResolvedValueOnce(mockResults[4])
        .mockResolvedValueOnce(mockResults[5])
        .mockResolvedValueOnce(mockResults[6]);

      // Act
      await getDashboardSummary(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        totalSedes: 0,
        totalEscuelas: 0,
        totalCarreras: 0,
        totalAsignaturas: 0,
        totalUsuarios: 0,
        totalDocentes: 0,
        examenesActivos: 0,
      });
    });

    test('debería manejar errores de base de datos', async () => {
      // Arrange
      const dbError = new Error('Error de conexión a BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getDashboardSummary(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Error al obtener el resumen del dashboard. Error: Error de conexión a BD',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getExamenesPorCarreraChartData', () => {
    test('debería retornar datos de exámenes por carrera para administrador', async () => {
      // Arrange
      const mockData = [
        { name: 'Ingeniería Civil', value: 15 },
        { name: 'Medicina', value: 12 },
        { name: 'Derecho', value: 8 },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockData });

      // Act
      await getExamenesPorCarreraChartData(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockData);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT CRR.NOMBRE_CARRERA'),
        {}
      );
    });

    test('debería aplicar filtros de rol para usuario no administrador', async () => {
      // Arrange
      req.user = { id_usuario: 2, rol_id_rol: 2 };
      const mockData = [{ name: 'Ingeniería Civil', value: 5 }];
      mockConnection.execute.mockResolvedValue({ rows: mockData });

      // Act
      await getExamenesPorCarreraChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('JOIN USUARIOCARRERA UC'),
        { userId: 2 }
      );
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('debería aplicar filtros de query parameters', async () => {
      // Arrange
      req.query = {
        sedeId: '1',
        escuelaId: '2',
        carreraId: '3',
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getExamenesPorCarreraChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SED.ID_SEDE = :sedeId'),
        expect.objectContaining({
          sedeId: 1,
          escuelaId: 2,
          carreraId: 3,
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
        })
      );
    });

    test('debería manejar errores en consulta de exámenes por carrera', async () => {
      // Arrange
      const dbError = new Error('Error en consulta');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getExamenesPorCarreraChartData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Error al obtener datos de exámenes por carrera. Error: Error en consulta',
      });
    });
  });

  describe('getModulosAgendadosChartData', () => {
    test('debería retornar datos de módulos agendados', async () => {
      // Arrange
      const mockData = [
        { hora: 'Módulo 1 (08:00-09:30)', cantidad: 5 },
        { hora: 'Módulo 2 (09:45-11:15)', cantidad: 3 },
        { hora: 'Módulo 3 (11:30-13:00)', cantidad: 7 },
      ];
      mockConnection.execute.mockResolvedValue({ rows: mockData });

      // Act
      await getModulosAgendadosChartData(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockData);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT M.NOMBRE_MODULO'),
        {}
      );
    });

    test('debería aplicar filtros de rol para usuario no administrador', async () => {
      // Arrange
      req.user = { id_usuario: 3, rol_id_rol: 3 };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getModulosAgendadosChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UC.USUARIO_ID_USUARIO = :userId'),
        { userId: 3 }
      );
    });

    test('debería aplicar filtros de query parameters para módulos', async () => {
      // Arrange
      req.query = {
        jornadaId: '1',
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31',
        estadoModuloId: '1',
      };
      mockConnection.execute.mockResolvedValue({ rows: [] });

      // Act
      await getModulosAgendadosChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('S.JORNADA_ID_JORNADA = :jornadaId'),
        expect.objectContaining({
          jornadaId: 1,
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
          estadoModuloId: 1,
        })
      );
    });

    test('debería manejar errores en consulta de módulos agendados', async () => {
      // Arrange
      const dbError = new Error('Error en módulos');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getModulosAgendadosChartData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Error al obtener datos de módulos agendados. Error: Error en módulos',
      });
    });
  });

  describe('getUsoSalasChartData', () => {
    test('debería retornar datos de uso de salas', async () => {
      // Arrange
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ OCUPADAS: 8 }] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: 20 }] });

      // Act
      await getUsoSalasChartData(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([
        { name: 'Ocupadas', value: 8 },
        { name: 'Disponibles', value: 12 },
      ]);
    });

    test('debería aplicar filtros de sede y edificio', async () => {
      // Arrange
      req.query = { sedeId: '1', edificioId: '2' };
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ OCUPADAS: 5 }] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: 10 }] });

      // Act
      await getUsoSalasChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ED.SEDE_ID_SEDE = :sedeId'),
        expect.objectContaining({ sedeId: 1, edificioId: 2 })
      );
    });

    test('debería aplicar filtro de fecha', async () => {
      // Arrange
      req.query = { fecha: '2024-01-15' };
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ OCUPADAS: 3 }] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: 15 }] });

      // Act
      await getUsoSalasChartData(req, res);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('TO_DATE(:fecha'),
        expect.objectContaining({ fecha: '2024-01-15' })
      );
    });

    test('debería manejar valores null en consultas de salas', async () => {
      // Arrange
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ OCUPADAS: null }] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: null }] });

      // Act
      await getUsoSalasChartData(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([
        { name: 'Ocupadas', value: 0 },
        { name: 'Disponibles', value: 0 },
      ]);
    });

    test('debería manejar errores en consulta de uso de salas', async () => {
      // Arrange
      const dbError = new Error('Error en salas');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await getUsoSalasChartData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Error al obtener datos de uso de salas. Error: Error en salas',
      });
    });
  });
});
