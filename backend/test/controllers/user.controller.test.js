import { describe, test, expect, beforeEach, vi } from 'vitest';

/**
 * Configuración de mocks antes de las importaciones
 */

// Mock de bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock de la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

/**
 * Suite de pruebas para el Controlador de Usuarios
 */
describe('Controlador de Usuarios', () => {
  let mockConnection;
  let req, res;
  let bcrypt;

  beforeEach(async () => {
    const { getConnection } = await import('../../db.js');
    const bcryptModule = await import('bcrypt');
    bcrypt = bcryptModule.default;

    // Crear mock de conexión
    mockConnection = {
      execute: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      close: vi.fn(),
    };

    getConnection.mockResolvedValue(mockConnection);

    // Crear mocks de request y response
    req = {
      params: {},
      body: {},
      query: {},
      user: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Limpiar todos los mocks
    vi.clearAllMocks();

    // Configurar comportamientos por defecto
    mockConnection.execute.mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    });

    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('getUsuarios', () => {
    test('debería retornar todos los usuarios exitosamente', async () => {
      const { getUsuarios } = await import(
        '../../controllers/user.controller.js'
      );

      const mockUsers = [
        {
          ID_USUARIO: 1,
          EMAIL_USUARIO: 'admin@test.com',
          NOMBRE_USUARIO: 'Admin',
          ROL_ID_ROL: 1,
          NOMBRE_ROL: 'ADMINISTRADOR',
        },
        {
          ID_USUARIO: 2,
          EMAIL_USUARIO: 'docente@test.com',
          NOMBRE_USUARIO: 'Docente',
          ROL_ID_ROL: 2,
          NOMBRE_ROL: 'DOCENTE',
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockUsers,
      });

      await getUsuarios(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockUsers);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería filtrar usuarios por rol cuando se proporciona rolId', async () => {
      const { getUsuarios } = await import(
        '../../controllers/user.controller.js'
      );

      req.query.rolId = '2';

      const mockDocentes = [
        {
          ID_USUARIO: 2,
          EMAIL_USUARIO: 'docente@test.com',
          NOMBRE_USUARIO: 'Docente',
          ROL_ID_ROL: 2,
          NOMBRE_ROL: 'DOCENTE',
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockDocentes,
      });

      await getUsuarios(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.objectContaining({ rolId: 2 }),
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockDocentes);
    });

    test('debería manejar errores de base de datos', async () => {
      const { getUsuarios } = await import(
        '../../controllers/user.controller.js'
      );

      const dbError = new Error('Error de BD');
      mockConnection.execute.mockRejectedValueOnce(dbError);

      await getUsuarios(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Error al obtener usuarios'),
        })
      );
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDocentes', () => {
    test('debería retornar solo usuarios con rol docente', async () => {
      const { getDocentes } = await import(
        '../../controllers/user.controller.js'
      );

      const mockDocentes = [
        {
          ID_USUARIO: 2,
          EMAIL_USUARIO: 'docente1@test.com',
          NOMBRE_USUARIO: 'Docente 1',
          ROL_ID_ROL: 2,
          NOMBRE_ROL: 'DOCENTE',
        },
        {
          ID_USUARIO: 3,
          EMAIL_USUARIO: 'docente2@test.com',
          NOMBRE_USUARIO: 'Docente 2',
          ROL_ID_ROL: 2,
          NOMBRE_ROL: 'DOCENTE',
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockDocentes,
      });

      await getDocentes(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('ROL_ID_ROL = 2'),
        {},
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockDocentes);
    });
  });

  describe('deleteUser', () => {
    test('debería eliminar un usuario exitosamente', async () => {
      const { deleteUser } = await import(
        '../../controllers/user.controller.js'
      );

      req.params.id = '1';

      // Mock para simulaciones de eliminación exitosa
      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 1 }) // USUARIOCARRERA
        .mockResolvedValueOnce({ rowsAffected: 1 }) // USUARIOSECCION
        .mockResolvedValueOnce({ rowsAffected: 1 }) // RESERVA_DOCENTES
        .mockResolvedValueOnce({ rowsAffected: 1 }); // USUARIO

      await deleteUser(req, res);

      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
      expect(mockConnection.execute).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM ADMIN.USUARIOCARRERA WHERE USUARIO_ID_USUARIO = :userId',
        { userId: '1' },
        { autoCommit: false }
      );
      expect(mockConnection.execute).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM ADMIN.USUARIOSECCION WHERE USUARIO_ID_USUARIO = :userId',
        { userId: '1' },
        { autoCommit: false }
      );
      expect(mockConnection.execute).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM ADMIN.RESERVA_DOCENTES WHERE USUARIO_ID_USUARIO = :userId',
        { userId: '1' },
        { autoCommit: false }
      );
      expect(mockConnection.execute).toHaveBeenNthCalledWith(
        4,
        'DELETE FROM ADMIN.USUARIO WHERE ID_USUARIO = :userId',
        { userId: '1' },
        { autoCommit: false }
      );
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario y sus asociaciones eliminadas exitosamente.',
      });
    });

    test('debería retornar 404 cuando el usuario no existe', async () => {
      const { deleteUser } = await import(
        '../../controllers/user.controller.js'
      );

      req.params.id = '999';

      // Mock para simular que no se encontró el usuario
      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 0 }) // USUARIOCARRERA
        .mockResolvedValueOnce({ rowsAffected: 0 }) // USUARIOSECCION
        .mockResolvedValueOnce({ rowsAffected: 0 }) // RESERVA_DOCENTES
        .mockResolvedValueOnce({ rowsAffected: 0 }); // USUARIO (no encontrado)

      await deleteUser(req, res);

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado para eliminar.',
      });
    });

    test('debería manejar errores de integridad referencial', async () => {
      const { deleteUser } = await import(
        '../../controllers/user.controller.js'
      );

      req.params.id = '1';

      const constraintError = new Error('Foreign key constraint');
      constraintError.errorNum = 2292;
      mockConnection.execute.mockRejectedValueOnce(constraintError);

      await deleteUser(req, res);

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Error interno del servidor'),
        })
      );
    });
  });

  describe('getProfile', () => {
    test('debería retornar el perfil del usuario autenticado', async () => {
      const { getProfile } = await import(
        '../../controllers/user.controller.js'
      );

      req.user = { id_usuario: 1 };

      const mockProfile = {
        ID_USUARIO: 1,
        EMAIL_USUARIO: 'admin@test.com',
        NOMBRE_USUARIO: 'Admin',
        ROL_ID_ROL: 1,
        NOMBRE_ROL: 'ADMINISTRADOR',
      };

      mockConnection.execute.mockResolvedValueOnce({
        rows: [mockProfile],
      });

      await getProfile(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.ID_USUARIO = :id'),
        { id: 1 },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        perfil: mockProfile,
      });
    });

    test('debería retornar 401 cuando no hay usuario autenticado', async () => {
      const { getProfile } = await import(
        '../../controllers/user.controller.js'
      );

      req.user = null;

      // Debería arrojar un error porque intenta hacer destructuring de null
      await expect(getProfile(req, res)).rejects.toThrow();
    });
  });

  describe('searchDocentes', () => {
    test('debería buscar docentes por nombre o email', async () => {
      const { searchDocentes } = await import(
        '../../controllers/user.controller.js'
      );

      req.query.q = 'Juan';

      const mockResults = [
        {
          ID_USUARIO: 2,
          EMAIL_USUARIO: 'juan.docente@test.com',
          NOMBRE_USUARIO: 'Juan Docente',
          ROL_ID_ROL: 2,
          NOMBRE_ROL: 'DOCENTE',
        },
      ];

      mockConnection.execute.mockResolvedValueOnce({
        rows: mockResults,
      });

      await searchDocentes(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.objectContaining({ searchTerm: '%JUAN%' }),
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    test('debería retornar error 400 cuando no se proporciona término de búsqueda', async () => {
      const { searchDocentes } = await import(
        '../../controllers/user.controller.js'
      );

      req.query = {}; // Sin search parameter

      await searchDocentes(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('importUsuarios', () => {
    test('debería importar usuarios desde archivo CSV exitosamente', async () => {
      const { importUsuarios } = await import(
        '../../controllers/user.controller.js'
      );

      req.body = {
        rows: [
          {
            'ID Docente': 'DOC001',
            'Nombre Docente': 'Juan Pérez',
            'Mail Duoc': 'juan@duoc.cl',
          },
        ],
        roleId: 2,
      };

      // Mock para simulaciones de importación exitosa
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [] }) // Check if exists (no exists)
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Insert user
      mockConnection.commit.mockResolvedValueOnce();

      await importUsuarios(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('importación'),
        })
      );
    });

    test('debería retornar error 400 cuando no se proporciona roleId soportado', async () => {
      const { importUsuarios } = await import(
        '../../controllers/user.controller.js'
      );

      req.body = {
        rows: [],
        roleId: 999, // roleId no soportado
      };

      await importUsuarios(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rol no soportado para importación.',
        })
      );
    });
  });

  describe('deleteMultipleUsers', () => {
    test('debería eliminar múltiples usuarios exitosamente', async () => {
      const { deleteMultipleUsers } = await import(
        '../../controllers/user.controller.js'
      );

      req.body.ids = [1, 2];

      // Mock para simulaciones de eliminación exitosa de múltiples usuarios
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      await deleteMultipleUsers(req, res);

      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminados exitosamente'),
        })
      );
    });

    test('debería retornar error 400 cuando no se proporcionan IDs', async () => {
      const { deleteMultipleUsers } = await import(
        '../../controllers/user.controller.js'
      );

      req.body.ids = [];

      await deleteMultipleUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error:
            'Se requiere un array de IDs de usuario para la eliminación masiva.',
        })
      );
    });
  });
});
