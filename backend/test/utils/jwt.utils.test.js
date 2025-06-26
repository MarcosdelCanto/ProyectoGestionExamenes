import { describe, test, expect, beforeEach, vi } from 'vitest';

/**
 * Configuración de mocks antes de las importaciones
 */

// Mock de jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

// Mock de variables de entorno
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.REFRESH_SECRET = 'otra_clave_super_segura';
process.env.JWT_EXPIRES_IN = '3h';

/**
 * Suite de pruebas para las Utilidades JWT
 */
describe('Utilidades JWT', () => {
  let jwt;

  beforeEach(async () => {
    const jwtModule = await import('jsonwebtoken');
    jwt = jwtModule.default;
    vi.clearAllMocks();

    // Configurar el comportamiento por defecto de jwt.sign
    jwt.sign.mockReturnValue('mocked-token');
  });

  describe('generateAccessToken', () => {
    test('debería generar un token de acceso con payload válido', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      const payload = {
        id_usuario: 1,
        email_usuario: 'test@example.com',
        rol_id_rol: 1,
        nombre_rol: 'ADMINISTRADOR',
      };

      jwt.sign.mockReturnValue('mocked-access-token');
      const result = generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, process.env.JWT_SECRET, {
        expiresIn: '3h',
      });
      expect(result).toBe('mocked-access-token');
    });

    test('debería usar la configuración de expiración por defecto', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      const payload = { id_usuario: 1 };

      generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, process.env.JWT_SECRET, {
        expiresIn: '3h',
      });
    });

    test('debería manejar payloads vacíos', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      const payload = {};

      jwt.sign.mockReturnValue('mocked-empty-token');
      const result = generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, process.env.JWT_SECRET, {
        expiresIn: '3h',
      });
      expect(result).toBe('mocked-empty-token');
    });
  });

  describe('generateRefreshToken', () => {
    test('debería generar un token de refresh con payload válido', async () => {
      const { generateRefreshToken } = await import('../../utils/jwt.utils.js');

      const payload = {
        id_usuario: 1,
        email_usuario: 'test@example.com',
      };

      jwt.sign.mockReturnValue('mocked-refresh-token');
      const result = generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe('mocked-refresh-token');
    });

    test('debería usar la configuración de expiración extendida', async () => {
      const { generateRefreshToken } = await import('../../utils/jwt.utils.js');

      const payload = { id_usuario: 1 };

      generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
      );
    });

    test('debería usar un secreto diferente para refresh tokens', async () => {
      const { generateRefreshToken } = await import('../../utils/jwt.utils.js');

      const payload = { id_usuario: 1 };

      generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
      );
    });
  });

  describe('integración de tokens', () => {
    test('debería generar tokens diferentes para access y refresh', async () => {
      const { generateAccessToken, generateRefreshToken } = await import(
        '../../utils/jwt.utils.js'
      );

      const payload = { id_usuario: 1 };

      jwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      expect(accessToken).toBe('access-token');
      expect(refreshToken).toBe('refresh-token');
      expect(accessToken).not.toBe(refreshToken);
    });

    test('debería mantener el payload en ambos tipos de tokens', async () => {
      const { generateAccessToken, generateRefreshToken } = await import(
        '../../utils/jwt.utils.js'
      );

      const payload = {
        id_usuario: 1,
        email_usuario: 'test@example.com',
      };

      generateAccessToken(payload);
      generateRefreshToken(payload);

      // Verificar que ambas llamadas usan el mismo payload
      expect(jwt.sign.mock.calls[0][0]).toEqual(payload);
      expect(jwt.sign.mock.calls[1][0]).toEqual(payload);
    });
  });

  describe('manejo de errores', () => {
    test('debería propagar errores de jwt.sign en generateAccessToken', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      const mockError = new Error('Error al firmar token');
      jwt.sign.mockImplementation(() => {
        throw mockError;
      });

      expect(() => {
        generateAccessToken({ id_usuario: 1 });
      }).toThrow('Error al firmar token');
    });

    test('debería propagar errores de jwt.sign en generateRefreshToken', async () => {
      const { generateRefreshToken } = await import('../../utils/jwt.utils.js');

      const mockError = new Error('Error al firmar refresh token');
      jwt.sign.mockImplementation(() => {
        throw mockError;
      });

      expect(() => {
        generateRefreshToken({ id_usuario: 1 });
      }).toThrow('Error al firmar refresh token');
    });
  });

  describe('casos edge', () => {
    test('debería manejar payload null o undefined', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      jwt.sign.mockReturnValue('token-for-null');

      const result = generateAccessToken(null);

      expect(jwt.sign).toHaveBeenCalledWith(null, process.env.JWT_SECRET, {
        expiresIn: '3h',
      });
      expect(result).toBe('token-for-null');
    });

    test('debería usar secretos de variables de entorno', async () => {
      const { generateAccessToken, generateRefreshToken } = await import(
        '../../utils/jwt.utils.js'
      );

      const payload = { test: true };

      generateAccessToken(payload);
      generateRefreshToken(payload);

      expect(jwt.sign.mock.calls[0][1]).toBe(process.env.JWT_SECRET);
      expect(jwt.sign.mock.calls[1][1]).toBe(process.env.REFRESH_SECRET);
    });
  });

  describe('configuración de tiempo', () => {
    test('debería respetar la configuración de tiempo de acceso', async () => {
      const { generateAccessToken } = await import('../../utils/jwt.utils.js');

      generateAccessToken({ id_usuario: 1 });

      expect(jwt.sign.mock.calls[0][2]).toEqual({
        expiresIn: '3h',
      });
    });

    test('debería respetar la configuración de tiempo de refresh', async () => {
      const { generateRefreshToken } = await import('../../utils/jwt.utils.js');

      generateRefreshToken({ id_usuario: 1 });

      expect(jwt.sign.mock.calls[0][2]).toEqual({
        expiresIn: '7d',
      });
    });
  });
});
