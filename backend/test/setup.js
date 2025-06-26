/**
 * @fileoverview Configuración global para las pruebas
 * @description Configuración de variables de entorno y utilidades comunes para testing
 * @author Sistema de Pruebas
 * @version 1.0.0
 */

import { beforeAll, afterAll, vi, expect } from 'vitest';

// Configurar variables de entorno para pruebas
beforeAll(() => {
  // JWT Configuration
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';

  // Database Configuration (mock)
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '1521';
  process.env.DB_SERVICE = 'test';
  process.env.DB_USER = 'test';
  process.env.DB_PASSWORD = 'test';

  // Application Configuration
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';

  // Email Configuration (mock)
  process.env.EMAIL_HOST = 'test-smtp.example.com';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_PASS = 'test-password';
});

afterAll(() => {
  // Limpiar mocks globales si es necesario
  vi.restoreAllMocks();
});

// Utilidades comunes para las pruebas
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
    sendStatus: vi.fn(),
  };
  return res;
};

export const createMockConnection = () => ({
  execute: vi.fn(),
  executeMany: vi.fn(),
  close: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
});

export const createMockUser = (overrides = {}) => ({
  id_usuario: 1,
  nombre_usuario: 'Test User',
  email_usuario: 'test@example.com',
  rol_id_rol: 1,
  nombre_rol: 'ADMINISTRADOR',
  ...overrides,
});

export const createMockExamen = (overrides = {}) => ({
  ID_EXAMEN: 1,
  NOMBRE_EXAMEN: 'Examen Test',
  INSCRITOS_EXAMEN: 30,
  TIPO_PROCESAMIENTO_EXAMEN: 'AUTOMATICO',
  PLATAFORMA_PROSE_EXAMEN: 'MOODLE',
  SITUACION_EVALUATIVA_EXAMEN: 'FINAL',
  CANTIDAD_MODULOS_EXAMEN: 2,
  SECCION_ID_SECCION: 1,
  ESTADO_ID_ESTADO: 1,
  NOMBRE_SECCION: 'TEST-001',
  NOMBRE_ASIGNATURA: 'Asignatura Test',
  NOMBRE_ESTADO: 'ACTIVO',
  ...overrides,
});

export const createMockReserva = (overrides = {}) => ({
  ID_RESERVA: 1,
  FECHA_RESERVA: '2024-01-15',
  EXAMEN_ID_EXAMEN: 1,
  SALA_ID_SALA: 1,
  ESTADO_ID_ESTADO: 2,
  NOMBRE_EXAMEN: 'Examen Test',
  NOMBRE_SALA: 'Aula Test',
  ESTADO_RESERVA: 'PROGRAMADO',
  ESTADO_CONFIRMACION_DOCENTE: 'PENDIENTE',
  ...overrides,
});

export const createMockModulo = (overrides = {}) => ({
  ID_MODULO: 1,
  NOMBRE_MODULO: '08:00-09:30',
  INICIO_MODULO: '08:00',
  FIN_MODULO: '09:30',
  ORDEN: 1,
  ESTADO_ID_ESTADO: 1,
  NOMBRE_ESTADO: 'ACTIVO',
  ...overrides,
});

// Matchers personalizados para las pruebas
export const expectValidationError = (response, expectedMessage) => {
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.stringContaining(expectedMessage),
    })
  );
};

export const expectNotFoundError = (
  response,
  expectedMessage = 'no encontrado'
) => {
  expect(response.status).toHaveBeenCalledWith(404);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.stringContaining(expectedMessage),
    })
  );
};

export const expectUnauthorizedError = (
  response,
  expectedMessage = 'no autorizado'
) => {
  expect(response.status).toHaveBeenCalledWith(401);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.stringContaining(expectedMessage),
    })
  );
};

export const expectServerError = (response, expectedMessage = 'Error') => {
  expect(response.status).toHaveBeenCalledWith(500);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.stringContaining(expectedMessage),
    })
  );
};

// Helpers para testing de base de datos
export const mockDatabaseSuccess = (connection, data = []) => {
  connection.execute.mockResolvedValue({ rows: data });
  connection.commit.mockResolvedValue();
};

export const mockDatabaseError = (
  connection,
  error = new Error('Database error')
) => {
  connection.execute.mockRejectedValue(error);
  connection.rollback.mockResolvedValue();
};

export const mockDatabaseInsert = (connection, newId = 1) => {
  connection.execute.mockResolvedValue({
    outBinds: { newId: [newId] },
    rowsAffected: 1,
  });
  connection.commit.mockResolvedValue();
};

export const mockDatabaseUpdate = (connection, rowsAffected = 1) => {
  connection.execute.mockResolvedValue({ rowsAffected });
  connection.commit.mockResolvedValue();
};

export const mockDatabaseDelete = (connection, rowsAffected = 1) => {
  connection.execute.mockResolvedValue({ rowsAffected });
  connection.commit.mockResolvedValue();
};

// Helper para testing de Oracle constraints
export const createOracleConstraintError = (
  errorNum,
  message = 'Constraint violation'
) => {
  const error = new Error(message);
  error.errorNum = errorNum;
  return error;
};

export const ORACLE_ERRORS = {
  UNIQUE_CONSTRAINT: 1,
  NOT_NULL_CONSTRAINT: 1400,
  FOREIGN_KEY_CONSTRAINT: 2292,
  CHECK_CONSTRAINT: 2290,
};
