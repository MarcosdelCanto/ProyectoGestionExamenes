import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock del módulo jwt
vi.mock('../../utils/jwt.utils.js', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('Middleware de Autenticación', () => {
  let req, res, next, verifyAccessTokenMock;

  beforeEach(async () => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Obtener el mock
    const jwtUtils = await import('../../utils/jwt.utils.js');
    verifyAccessTokenMock = jwtUtils.verifyAccessToken;

    // Limpiar mocks
    vi.clearAllMocks();
  });

  describe('authMiddleware', () => {
    test('debería pasar al siguiente middleware cuando el token es válido', async () => {
      const { authMiddleware } = await import(
        '../../middlewares/auth.middleware.js'
      );

      req.headers.authorization = 'Bearer valid-token';

      // Mock para que retorne un payload válido
      verifyAccessTokenMock.mockReturnValue({ id_usuario: 1, rol_id_rol: 1 });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual({ id_usuario: 1, rol_id_rol: 1 });
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('debería retornar 401 cuando no hay token en el header', async () => {
      const { authMiddleware } = await import(
        '../../middlewares/auth.middleware.js'
      );

      // No se proporciona header de autorización
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Token no proporcionado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería retornar 401 cuando el token es inválido', async () => {
      const { authMiddleware } = await import(
        '../../middlewares/auth.middleware.js'
      );

      req.headers.authorization = 'Bearer invalid-token';

      // Mock que simula error de token inválido
      verifyAccessTokenMock.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Token inválido.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
