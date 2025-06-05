/**
 * @fileoverview Pruebas unitarias para el controlador de autenticación
 * @description Valida el comportamiento de login, refresh token y logout
 * @author Marquitos
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Configuración de mocks para dependencias externas
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(), // Simula conexión a Oracle DB
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(), // Simula comparación de passwords hasheados
  },
}));

vi.mock('../../utils/jwt.utils.js', () => ({
  generateAccessToken: vi.fn(() => 'fake-access-token'), // Token de acceso simulado
  generateRefreshToken: vi.fn(() => 'fake-refresh-token'), // Token de refresh simulado
}));

/**
 * Suite de pruebas para el Controlador de Autenticación
 * Cubre todas las funciones principales: login, refresh, logout
 */
describe('Controlador de Autenticación', () => {
  let mockConnection;
  let getConnection;
  let bcrypt;

  /** Configuración inicial antes de cada prueba
   Resetea todos los mocks y configura el estado inicial */
  beforeEach(async () => {
    // Importar módulos después de configurar mocks
    const dbModule = await import('../../db.js');
    const bcryptModule = await import('bcrypt');

    getConnection = dbModule.getConnection;
    bcrypt = bcryptModule.default;

    // Mock de conexión a BD con métodos típicos
    mockConnection = {
      execute: vi.fn(), // Simula ejecución de queries
      close: vi.fn(), // Simula cierre de conexión
    };

    getConnection.mockResolvedValue(mockConnection);
    vi.clearAllMocks(); // Limpia historial de llamadas
  });

  /**
   * Pruebas para la función de login
   * Valida autenticación, validación de datos y manejo de errores
   */
  describe('función de login', () => {
    /**
     * Caso 1: Validación de campos obligatorios - Email faltante
     * Verifica que se rechacen requests sin email
     */
    test('debería retornar 400 cuando falta el email', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: Preparar datos de prueba
      const req = {
        body: { password_usuario: 'password123' },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act: Ejecutar función bajo prueba
      await login(req, res);

      // Assert: Verificar comportamiento esperado
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Email y contraseña son obligatorios.',
      });
    });

    /**
     * Caso 2: Validación de campos obligatorios - Contraseña faltante
     * Verifica que se rechacen requests sin password
     */
    test('debería retornar 400 cuando falta la contraseña', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: Solo email, sin password
      const req = {
        body: { email_usuario: 'test@example.com' },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act & Assert
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Email y contraseña son obligatorios.',
      });
    });

    /**
     * Caso 3: Usuario no encontrado en base de datos
     * Simula BD que retorna resultado vacío
     */
    test('debería retornar 401 cuando el usuario no existe', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: BD retorna array vacío (usuario no encontrado)
      mockConnection.execute.mockResolvedValue({ rows: [] });

      const req = {
        body: {
          email_usuario: 'noexiste@example.com',
          password_usuario: 'password123',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act & Assert
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Credenciales inválidas.',
      });
    });

    /**
     * Caso 4: Contraseña incorrecta
     * Usuario existe pero bcrypt.compare retorna false
     */
    test('debería retornar 401 cuando la contraseña es incorrecta', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: Usuario encontrado en BD
      mockConnection.execute.mockResolvedValue({
        rows: [
          {
            ID_USUARIO: 1,
            HASH: 'hashedpassword',
            ROL_ID_ROL: 1,
            NOMBRE_ROL: 'ADMIN',
          },
        ],
      });

      // Pero bcrypt dice que password no coincide
      bcrypt.compare.mockResolvedValue(false);

      const req = {
        body: {
          email_usuario: 'test@example.com',
          password_usuario: 'contraseñaIncorrecta',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act & Assert
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Credenciales inválidas.',
      });
    });

    /**
     * Caso 5: Login exitoso - Caso feliz
     * Usuario existe y contraseña es correcta
     */
    test('debería retornar 200 con tokens cuando las credenciales son válidas', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: Usuario encontrado
      mockConnection.execute.mockResolvedValue({
        rows: [
          {
            ID_USUARIO: 1,
            EMAIL_USUARIO: 'test@example.com',
            HASH: 'hashedpassword',
            ROL_ID_ROL: 1,
            NOMBRE_ROL: 'ADMIN',
          },
        ],
      });

      // Password coincide
      bcrypt.compare.mockResolvedValue(true);

      const req = {
        body: {
          email_usuario: 'test@example.com',
          password_usuario: 'contraseñaCorrecta',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act & Assert
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Login exitoso.',
          accessToken: 'fake-access-token',
          refreshToken: 'fake-refresh-token',
          usuario: expect.objectContaining({
            id_usuario: 1,
            email_usuario: 'test@example.com',
          }),
        })
      );
    });

    /**
     * Caso 6: Error de sistema - Fallo de conexión a BD
     * Verifica manejo gracioso de errores de infraestructura
     */
    test('debería manejar errores de conexión a la base de datos', async () => {
      const { login } = await import('../../controllers/auth.controller.js');

      // Arrange: getConnection falla
      getConnection.mockRejectedValue(new Error('Fallo en conexión a BD'));

      const req = {
        body: {
          email_usuario: 'test@example.com',
          password_usuario: 'password123',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Act & Assert
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Error del servidor.',
      });
    });
  });

  /**
   * Pruebas para la función de renovación de tokens
   * Valida el manejo de refresh tokens
   */
  describe('función de renovar token', () => {
    /**
     * Caso 7: Token no proporcionado
     */
    test('debería retornar 401 cuando falta el token', async () => {
      const { handleRefreshToken } = await import(
        '../../controllers/auth.controller.js'
      );

      const req = { body: {} }; // Sin token
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleRefreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    /**
     * Caso 8: Token inválido o no reconocido
     */
    test('debería retornar 401 cuando el refresh token es inválido', async () => {
      const { handleRefreshToken } = await import(
        '../../controllers/auth.controller.js'
      );

      const req = { body: { token: 'token-invalido' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleRefreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Refresh token inválido.',
      });
    });
  });

  /**
   * Pruebas para la función de logout
   * Valida el cierre de sesión
   */
  describe('función de logout', () => {
    /**
     * Caso 9: Logout exitoso
     * Verifica que se elimine el refresh token y retorne 204
     */
    test('debería retornar 204 al hacer logout exitosamente', async () => {
      const { logout } = await import('../../controllers/auth.controller.js');

      const req = { body: { token: 'valid-refresh-token' } };
      const res = {
        sendStatus: vi.fn(),
      };

      await logout(req, res);

      // 204 = No Content (operación exitosa sin datos que retornar)
      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
