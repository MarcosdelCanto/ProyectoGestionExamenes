/**
 * @fileoverview Pruebas de integración de base de datos
 * @description Valida la integración con Oracle DB usando mocks realistas
 * @author Sistema de Gestión de Exámenes
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock configurado de Oracle DB
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
  pool: {
    getConnection: vi.fn(),
    close: vi.fn(),
  }
}));

/**
 * Suite de pruebas de integración con base de datos
 */
describe('Integración Base de Datos', () => {
  let mockConnection;
  let getConnection;

  beforeEach(async () => {
    const dbModule = await import('../../db.js');
    getConnection = dbModule.getConnection;

    mockConnection = {
      execute: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      close: vi.fn(),
    };

    getConnection.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Transacciones complejas', () => {
    test('Debe crear examen con reservas múltiples en transacción', async () => {
      // Importar controlador después del mock
      const { crearExamenConReservas } = await import('./test-helpers/db-operations.js');

      // Simular transacción exitosa
      mockConnection.execute
        // Crear examen
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [101] }
        })
        // Crear primera reserva
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [201] }
        })
        // Crear segunda reserva
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [202] }
        });

      mockConnection.commit.mockResolvedValueOnce();

      const resultado = await crearExamenConReservas({
        examen: {
          nombre: 'Examen Final',
          fecha_inicio: '2025-07-01T09:00:00Z',
          fecha_fin: '2025-07-01T11:00:00Z',
          id_asignatura: 1
        },
        reservas: [
          { id_sala: 1, fecha_inicio: '2025-07-01T09:00:00Z', fecha_fin: '2025-07-01T11:00:00Z' },
          { id_sala: 2, fecha_inicio: '2025-07-01T09:00:00Z', fecha_fin: '2025-07-01T11:00:00Z' }
        ]
      });

      expect(resultado.examenId).toBe(101);
      expect(resultado.reservaIds).toEqual([201, 202]);
      expect(mockConnection.commit).toHaveBeenCalledOnce();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
    });

    test('Debe hacer rollback si falla alguna operación en transacción', async () => {
      const { crearExamenConReservas } = await import('./test-helpers/db-operations.js');

      // Simular error en segunda reserva
      mockConnection.execute
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [101] }
        })
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [201] }
        })
        .mockRejectedValueOnce(new Error('Sala no disponible'));

      mockConnection.rollback.mockResolvedValueOnce();

      await expect(crearExamenConReservas({
        examen: {
          nombre: 'Examen Final',
          fecha_inicio: '2025-07-01T09:00:00Z',
          fecha_fin: '2025-07-01T11:00:00Z',
          id_asignatura: 1
        },
        reservas: [
          { id_sala: 1, fecha_inicio: '2025-07-01T09:00:00Z', fecha_fin: '2025-07-01T11:00:00Z' },
          { id_sala: 999, fecha_inicio: '2025-07-01T09:00:00Z', fecha_fin: '2025-07-01T11:00:00Z' }
        ]
      })).rejects.toThrow('Sala no disponible');

      expect(mockConnection.rollback).toHaveBeenCalledOnce();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe('Consultas complejas', () => {
    test('Debe ejecutar consulta con joins múltiples correctamente', async () => {
      const { obtenerExamenesConDetalles } = await import('./test-helpers/db-operations.js');

      mockConnection.execute.mockResolvedValueOnce({
        rows: [
          {
            ID_EXAMEN: 101,
            NOMBRE_EXAMEN: 'Examen Final',
            NOMBRE_ASIGNATURA: 'Matemáticas',
            NOMBRE_SECCION: 'A1',
            NOMBRE_SALA: 'Aula 101',
            CAPACIDAD_SALA: 30,
            FECHA_INICIO: new Date('2025-07-01T09:00:00Z'),
            FECHA_FIN: new Date('2025-07-01T11:00:00Z')
          }
        ]
      });

      const resultado = await obtenerExamenesConDetalles();

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toMatchObject({
        ID_EXAMEN: 101,
        NOMBRE_EXAMEN: 'Examen Final',
        NOMBRE_ASIGNATURA: 'Matemáticas',
        NOMBRE_SECCION: 'A1'
      });

      // Verificar que se ejecutó la consulta con joins
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('JOIN'),
        expect.anything()
      );
    });

    test('Debe manejar consultas paginadas correctamente', async () => {
      const { obtenerUsuariosPaginados } = await import('./test-helpers/db-operations.js');

      mockConnection.execute.mockResolvedValueOnce({
        rows: [
          { ID_USUARIO: 1, NOMBRE_USUARIO: 'admin', TOTAL_COUNT: 100 },
          { ID_USUARIO: 2, NOMBRE_USUARIO: 'profesor1', TOTAL_COUNT: 100 }
        ]
      });

      const resultado = await obtenerUsuariosPaginados({ page: 1, limit: 2 });

      expect(resultado.usuarios).toHaveLength(2);
      expect(resultado.total).toBe(100);
      expect(resultado.page).toBe(1);
      expect(resultado.totalPages).toBe(50);
    });
  });

  describe('Manejo de errores de BD', () => {
    test('Debe manejar errores de conexión', async () => {
      getConnection.mockRejectedValueOnce(new Error('Connection failed'));

      const { obtenerUsuarios } = await import('./test-helpers/db-operations.js');

      await expect(obtenerUsuarios()).rejects.toThrow('Connection failed');
    });

    test('Debe manejar errores de sintaxis SQL', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('ORA-00942: table or view does not exist'));

      const { obtenerUsuarios } = await import('./test-helpers/db-operations.js');

      await expect(obtenerUsuarios()).rejects.toThrow('ORA-00942');
    });

    test('Debe cerrar conexión incluso si hay error', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('Query failed'));

      const { obtenerUsuarios } = await import('./test-helpers/db-operations.js');

      try {
        await obtenerUsuarios();
      } catch {
        // Error esperado
      }

      expect(mockConnection.close).toHaveBeenCalledOnce();
    });
  });

  describe('Pool de conexiones', () => {
    test('Debe gestionar múltiples conexiones simultáneas', async () => {
      const { procesarOperacionesConcurrentes } = await import('./test-helpers/db-operations.js');

      // Simular múltiples conexiones
      const conexion1 = { ...mockConnection, execute: vi.fn().mockResolvedValue({ rows: [] }) };
      const conexion2 = { ...mockConnection, execute: vi.fn().mockResolvedValue({ rows: [] }) };
      const conexion3 = { ...mockConnection, execute: vi.fn().mockResolvedValue({ rows: [] }) };

      getConnection
        .mockResolvedValueOnce(conexion1)
        .mockResolvedValueOnce(conexion2)
        .mockResolvedValueOnce(conexion3);

      const operaciones = [
        { tipo: 'consulta', sql: 'SELECT 1' },
        { tipo: 'consulta', sql: 'SELECT 2' },
        { tipo: 'consulta', sql: 'SELECT 3' }
      ];

      const resultados = await procesarOperacionesConcurrentes(operaciones);

      expect(resultados).toHaveLength(3);
      expect(getConnection).toHaveBeenCalledTimes(3);
      expect(conexion1.close).toHaveBeenCalledOnce();
      expect(conexion2.close).toHaveBeenCalledOnce();
      expect(conexion3.close).toHaveBeenCalledOnce();
    });
  });
});
