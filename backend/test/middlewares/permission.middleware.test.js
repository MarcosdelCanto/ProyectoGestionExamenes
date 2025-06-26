// test/middlewares/permission.middleware.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { checkPermission } from '../../middlewares/permission.middleware.js';

// Mock de la base de datos
const mockConnection = {
  execute: vi.fn(),
  close: vi.fn(),
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Middleware de Permisos', () => {
  let req, res, next;

  beforeEach(() => {
    // Setup para cada test
    req = {
      user: { rol_id_rol: 1 },
      originalUrl: '/test-route',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Limpiar mocks
    vi.clearAllMocks();
  });

  describe('checkPermission', () => {
    test('debería permitir acceso cuando el usuario tiene el permiso requerido', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      mockConnection.execute.mockResolvedValue({
        rows: [
          { NOMBRE_PERMISO: 'LEER_EXAMENES' },
          { NOMBRE_PERMISO: 'CREAR_RESERVAS' },
        ],
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT P.NOMBRE_PERMISO'),
        { rolIdBind: 1 },
        expect.any(Object)
      );
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería permitir acceso cuando el usuario tiene uno de múltiples permisos requeridos', async () => {
      // Arrange
      const middleware = checkPermission(['LEER_EXAMENES', 'ADMIN_GENERAL']);
      mockConnection.execute.mockResolvedValue({
        rows: [
          { NOMBRE_PERMISO: 'LEER_EXAMENES' },
          { NOMBRE_PERMISO: 'CREAR_RESERVAS' },
        ],
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debería denegar acceso cuando el usuario no tiene el permiso requerido', async () => {
      // Arrange
      const middleware = checkPermission('ADMIN_GENERAL');
      mockConnection.execute.mockResolvedValue({
        rows: [
          { NOMBRE_PERMISO: 'LEER_EXAMENES' },
          { NOMBRE_PERMISO: 'CREAR_RESERVAS' },
        ],
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Acceso denegado. No tienes los permisos necesarios para esta acción.',
      });
    });

    test('debería denegar acceso cuando el usuario no está autenticado', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      req.user = null;

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Middleware de Permisos: Usuario no autenticado o rol no disponible.',
      });
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });

    test('debería denegar acceso cuando req.user.rol_id_rol no está definido', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      req.user = { id_usuario: 1 }; // Sin rol_id_rol

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Middleware de Permisos: Usuario no autenticado o rol no disponible.',
      });
    });

    test('debería permitir acceso cuando no se requieren permisos específicos', async () => {
      // Arrange - permisos vacíos o null
      const middleware = checkPermission([]);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });

    test('debería filtrar permisos vacíos y permitir acceso', async () => {
      // Arrange - permisos con strings vacíos
      const middleware = checkPermission(['', '   ', null, undefined]);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });

    test('debería manejar errores de base de datos', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      const dbError = new Error('Error de conexión a BD');
      mockConnection.execute.mockRejectedValue(dbError);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor al verificar permisos.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería cerrar la conexión incluso si hay error al cerrar', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      mockConnection.execute.mockResolvedValue({
        rows: [{ NOMBRE_PERMISO: 'LEER_EXAMENES' }],
      });
      mockConnection.close.mockRejectedValue(
        new Error('Error cerrando conexión')
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('debería manejar usuario sin permisos en BD', async () => {
      // Arrange
      const middleware = checkPermission('LEER_EXAMENES');
      mockConnection.execute.mockResolvedValue({ rows: [] }); // Sin permisos

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Acceso denegado. No tienes los permisos necesarios para esta acción.',
      });
    });

    test('debería trabajar correctamente con permiso único como string', async () => {
      // Arrange
      const middleware = checkPermission('CREAR_RESERVAS');
      mockConnection.execute.mockResolvedValue({
        rows: [{ NOMBRE_PERMISO: 'CREAR_RESERVAS' }],
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debería verificar correctamente múltiples permisos cuando ninguno coincide', async () => {
      // Arrange
      const middleware = checkPermission(['ADMIN_SISTEMA', 'SUPER_USER']);
      mockConnection.execute.mockResolvedValue({
        rows: [
          { NOMBRE_PERMISO: 'LEER_EXAMENES' },
          { NOMBRE_PERMISO: 'CREAR_RESERVAS' },
        ],
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
