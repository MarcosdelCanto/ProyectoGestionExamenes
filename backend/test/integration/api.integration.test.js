/**
 * @fileoverview Pruebas de integración API - Flujos completos de usuario
 * @description Valida que los módulos trabajen juntos correctamente
 * @author Sistema de Gestión de Exámenes
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Importar rutas
import authRoutes from '../../routes/auth.routes.js';
import userRoutes from '../../routes/user.routes.js';
import examenRoutes from '../../routes/examen.routes.js';
import reservaRoutes from '../../routes/reserva.routes.js';

// Mock de la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

// Mock de JWT utils
vi.mock('../../utils/jwt.utils.js', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn(() => ({ 
    userId: 1, 
    roleId: 1, 
    roleName: 'admin',
    permissions: ['usuarios:read', 'usuarios:write', 'examenes:read', 'examenes:write']
  })),
  verifyRefreshToken: vi.fn(() => ({ 
    userId: 1, 
    roleId: 1, 
    roleName: 'admin'
  })),
}));

// Mock de bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(() => Promise.resolve(true)),
    hash: vi.fn(() => Promise.resolve('hashed-password')),
  },
}));

/**
 * Suite de pruebas de integración para flujos completos de la API
 */
describe('Pruebas de Integración API', () => {
  let app;
  let mockConnection;
  let authToken = 'Bearer mock-access-token';

  beforeAll(async () => {
    // Configurar aplicación Express para pruebas
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Configurar rutas
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/examenes', examenRoutes);
    app.use('/api/reservas', reservaRoutes);

    // Mock de conexión a BD
    mockConnection = {
      execute: vi.fn(),
      close: vi.fn(),
    };

    const { getConnection } = await import('../../db.js');
    getConnection.mockResolvedValue(mockConnection);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flujo de autenticación completo', () => {
    test('Debe autenticar usuario y permitir acceso a recursos protegidos', async () => {
      // 1. Mock de datos de usuario para login
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [{
            ID_USUARIO: 1,
            NOMBRE_USUARIO: 'admin',
            PASSWORD_HASH: 'hashed-password',
            ID_ROL: 1,
            NOMBRE_ROL: 'admin',
            ESTADO: 'activo'
          }]
        })
        // 2. Mock para obtener permisos del usuario
        .mockResolvedValueOnce({
          rows: [
            { PERMISO: 'usuarios:read' },
            { PERMISO: 'usuarios:write' },
            { PERMISO: 'examenes:read' },
            { PERMISO: 'examenes:write' }
          ]
        });

      // 1. Login del usuario
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body).toMatchObject({
        user: expect.objectContaining({
          id: 1,
          username: 'admin',
          role: 'admin'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      // 2. Acceder a recurso protegido con token
      mockConnection.execute.mockResolvedValueOnce({
        rows: [
          {
            ID_USUARIO: 1,
            NOMBRE_USUARIO: 'admin',
            EMAIL: 'admin@test.com',
            ID_ROL: 1,
            NOMBRE_ROL: 'admin'
          }
        ]
      });

      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', authToken)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('users');
      expect(Array.isArray(usersResponse.body.users)).toBe(true);
    });

    test('Debe rechazar acceso sin token válido', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('Flujo de gestión de exámenes', () => {
    test('Debe crear, listar y actualizar exámenes correctamente', async () => {
      const nuevoExamen = {
        nombre: 'Examen de Matemáticas',
        descripcion: 'Examen final de matemáticas',
        fecha_inicio: '2025-07-01T09:00:00Z',
        fecha_fin: '2025-07-01T11:00:00Z',
        id_asignatura: 1,
        id_seccion: 1
      };

      // 1. Crear examen
      mockConnection.execute
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [101] }
        });

      const createResponse = await request(app)
        .post('/api/examenes')
        .set('Authorization', authToken)
        .send(nuevoExamen)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        message: expect.any(String),
        examenId: 101
      });

      // 2. Listar exámenes
      mockConnection.execute.mockResolvedValueOnce({
        rows: [{
          ID_EXAMEN: 101,
          NOMBRE: 'Examen de Matemáticas',
          DESCRIPCION: 'Examen final de matemáticas',
          FECHA_INICIO: new Date('2025-07-01T09:00:00Z'),
          FECHA_FIN: new Date('2025-07-01T11:00:00Z'),
          ID_ASIGNATURA: 1,
          ID_SECCION: 1
        }]
      });

      const listResponse = await request(app)
        .get('/api/examenes')
        .set('Authorization', authToken)
        .expect(200);

      expect(listResponse.body.examenes).toHaveLength(1);
      expect(listResponse.body.examenes[0]).toMatchObject({
        ID_EXAMEN: 101,
        NOMBRE: 'Examen de Matemáticas'
      });

      // 3. Actualizar examen
      mockConnection.execute.mockResolvedValueOnce({
        rowsAffected: 1
      });

      const updateResponse = await request(app)
        .put('/api/examenes/101')
        .set('Authorization', authToken)
        .send({
          ...nuevoExamen,
          nombre: 'Examen de Matemáticas Actualizado'
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        message: expect.stringContaining('actualizado')
      });
    });
  });

  describe('Flujo de reservas de salas', () => {
    test('Debe gestionar reservas de salas para exámenes', async () => {
      const reservaData = {
        id_examen: 101,
        id_sala: 1,
        fecha_inicio: '2025-07-01T09:00:00Z',
        fecha_fin: '2025-07-01T11:00:00Z'
      };

      // 1. Verificar disponibilidad de sala
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [] // No hay conflictos
        })
        // 2. Crear reserva
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [201] }
        });

      const reservaResponse = await request(app)
        .post('/api/reservas')
        .set('Authorization', authToken)
        .send(reservaData)
        .expect(201);

      expect(reservaResponse.body).toMatchObject({
        message: expect.any(String),
        reservaId: 201
      });

      // 3. Listar reservas
      mockConnection.execute.mockResolvedValueOnce({
        rows: [{
          ID_RESERVA: 201,
          ID_EXAMEN: 101,
          ID_SALA: 1,
          FECHA_INICIO: new Date('2025-07-01T09:00:00Z'),
          FECHA_FIN: new Date('2025-07-01T11:00:00Z'),
          ESTADO: 'confirmada'
        }]
      });

      const listReservasResponse = await request(app)
        .get('/api/reservas')
        .set('Authorization', authToken)
        .expect(200);

      expect(listReservasResponse.body.reservas).toHaveLength(1);
    });

    test('Debe evitar conflictos de reservas en la misma sala', async () => {
      const reservaConflicto = {
        id_examen: 102,
        id_sala: 1,
        fecha_inicio: '2025-07-01T10:00:00Z',
        fecha_fin: '2025-07-01T12:00:00Z'
      };

      // Mock que simula conflicto (hay una reserva existente)
      mockConnection.execute.mockResolvedValueOnce({
        rows: [{
          ID_RESERVA: 201,
          ID_SALA: 1,
          FECHA_INICIO: new Date('2025-07-01T09:00:00Z'),
          FECHA_FIN: new Date('2025-07-01T11:00:00Z')
        }]
      });

      await request(app)
        .post('/api/reservas')
        .set('Authorization', authToken)
        .send(reservaConflicto)
        .expect(409); // Conflict
    });
  });

  describe('Flujo de gestión de usuarios', () => {
    test('Debe crear usuario y asignar roles correctamente', async () => {
      const nuevoUsuario = {
        nombre_usuario: 'profesor1',
        email: 'profesor1@test.com',
        password: 'password123',
        id_rol: 2
      };

      // 1. Verificar que el usuario no existe
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [] // Usuario no existe
        })
        // 2. Crear usuario
        .mockResolvedValueOnce({
          rowsAffected: 1,
          outBinds: { id: [301] }
        });

      const createUserResponse = await request(app)
        .post('/api/users')
        .set('Authorization', authToken)
        .send(nuevoUsuario)
        .expect(201);

      expect(createUserResponse.body).toMatchObject({
        message: expect.any(String),
        userId: 301
      });

      // 3. Verificar que el usuario fue creado
      mockConnection.execute.mockResolvedValueOnce({
        rows: [{
          ID_USUARIO: 301,
          NOMBRE_USUARIO: 'profesor1',
          EMAIL: 'profesor1@test.com',
          ID_ROL: 2,
          NOMBRE_ROL: 'profesor'
        }]
      });

      const getUserResponse = await request(app)
        .get('/api/users/301')
        .set('Authorization', authToken)
        .expect(200);

      expect(getUserResponse.body.user).toMatchObject({
        ID_USUARIO: 301,
        NOMBRE_USUARIO: 'profesor1',
        EMAIL: 'profesor1@test.com'
      });
    });
  });

  describe('Flujo de permisos y autorización', () => {
    test('Debe respetar permisos de roles en operaciones', async () => {
      // Mock de usuario con permisos limitados
      const { verifyAccessToken } = await import('../../utils/jwt.utils.js');
      verifyAccessToken.mockReturnValueOnce({
        userId: 2,
        roleId: 3,
        roleName: 'estudiante',
        permissions: ['examenes:read'] // Solo lectura
      });

      // Intento de crear examen con permisos limitados
      await request(app)
        .post('/api/examenes')
        .set('Authorization', 'Bearer limited-token')
        .send({
          nombre: 'Examen No Autorizado',
          descripcion: 'No debería poder crear esto'
        })
        .expect(403); // Forbidden
    });
  });

  afterAll(async () => {
    if (mockConnection) {
      await mockConnection.close();
    }
  });
});
