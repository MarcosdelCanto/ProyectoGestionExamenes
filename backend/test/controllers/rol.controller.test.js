import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../../controllers/rol.controller.js';

// Mock de la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

describe('Controlador de Roles', () => {
  let mockConnection;
  let req, res;

  beforeEach(async () => {
    // Mock de la conexión a la base de datos
    mockConnection = {
      execute: vi.fn(),
      executeMany: vi.fn(), // Agregar executeMany
      close: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };

    // Mock de getConnection para retornar nuestra conexión mock
    const { getConnection } = await import('../../db.js');
    getConnection.mockResolvedValue(mockConnection);

    // Setup de request y response objects
    req = {
      params: {},
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('fetchAllRoles', () => {
    it('debería retornar todos los roles exitosamente', async () => {
      const mockRoles = [
        { ID_ROL: 1, NOMBRE_ROL: 'ADMIN' },
        { ID_ROL: 2, NOMBRE_ROL: 'DOCENTE' },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockRoles });

      await fetchAllRoles(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT ID_ROL, NOMBRE_ROL FROM ADMIN.ROL ORDER BY NOMBRE_ROL',
        [],
        { outFormat: expect.any(Number) }
      );
      expect(res.json).toHaveBeenCalledWith(mockRoles);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en fetchAllRoles', async () => {
      const errorMessage = 'Error de BD';
      mockConnection.execute.mockRejectedValue(new Error(errorMessage));

      await fetchAllRoles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudieron obtener los roles.',
        details: errorMessage,
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('getRoleById', () => {
    it('debería retornar un rol por ID exitosamente', async () => {
      const mockRole = { ID_ROL: 1, NOMBRE_ROL: 'ADMIN' };
      const mockPermisos = [
        { ID_PERMISO: 1, NOMBRE_PERMISO: 'READ', DESCRIPCION_PERMISO: 'Leer' },
      ];
      req.params.id = '1';

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [mockRole] })
        .mockResolvedValueOnce({ rows: mockPermisos });

      await getRoleById(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT ID_ROL, NOMBRE_ROL FROM ADMIN.ROL WHERE ID_ROL = :roleIdBind',
        { roleIdBind: 1 },
        { outFormat: expect.any(Number) }
      );
      expect(res.json).toHaveBeenCalledWith({
        ...mockRole,
        permisos: mockPermisos,
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el rol no existe', async () => {
      req.params.id = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await getRoleById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rol no encontrado.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getRoleById', async () => {
      req.params.id = '1';
      const errorMessage = 'Error de BD';
      mockConnection.execute.mockRejectedValue(new Error(errorMessage));

      await getRoleById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo obtener el rol.',
        details: errorMessage,
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 400 para ID inválido', async () => {
      req.params.id = 'invalid';

      await getRoleById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID de Rol inválido.',
        details: 'No hay detalles adicionales del error.',
      });
    });
  });

  describe('createRole', () => {
    it('debería crear un rol exitosamente con permisos', async () => {
      req.body = {
        NOMBRE_ROL: 'NUEVO_ROL',
        permisos: [1, 2],
      };

      mockConnection.execute.mockResolvedValueOnce({
        outBinds: { newId_param: [5] }, // ID del nuevo rol
      });
      mockConnection.executeMany.mockResolvedValueOnce({}); // executeMany para permisos

      await createRole(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ADMIN.ROL'),
        expect.objectContaining({
          nombre_rol_param: 'NUEVO_ROL',
          newId_param: expect.objectContaining({
            dir: expect.any(Number),
            type: expect.any(Object),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        ID_ROL: 5,
        NOMBRE_ROL: 'NUEVO_ROL',
        permisos: [{ ID_PERMISO: 1 }, { ID_PERMISO: 2 }],
      });
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería crear un rol sin permisos', async () => {
      req.body = {
        NOMBRE_ROL: 'ROL_SIN_PERMISOS',
        permisos: [],
      };

      mockConnection.execute.mockResolvedValue({
        outBinds: { newId_param: [6] },
      });

      await createRole(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        ID_ROL: 6,
        NOMBRE_ROL: 'ROL_SIN_PERMISOS',
        permisos: [],
      });
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('debería retornar 400 si falta el nombre del rol', async () => {
      req.body = {};

      await createRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El nombre del rol es obligatorio.',
        details: 'No hay detalles adicionales del error.',
      });
    });

    it('debería manejar error de nombre duplicado', async () => {
      req.body = {
        NOMBRE_ROL: 'ROL_EXISTENTE',
        permisos: [],
      };

      const error = new Error('Unique constraint');
      error.errorNum = 1;
      mockConnection.execute.mockRejectedValue(error);

      await createRole(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "El rol con nombre 'ROL_EXISTENTE' ya existe.",
        details: 'Unique constraint',
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('debería manejar otros errores de base de datos', async () => {
      req.body = {
        NOMBRE_ROL: 'NUEVO_ROL',
        permisos: [],
      };

      const errorMessage = 'Error de BD';
      mockConnection.execute.mockRejectedValue(new Error(errorMessage));

      await createRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo crear el rol.',
        details: errorMessage,
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('debería actualizar un rol exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        NOMBRE_ROL: 'ROL_ACTUALIZADO',
        permisos: [2, 3],
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 1 }) // UPDATE ROL
        .mockResolvedValueOnce({}); // DELETE PERMISOSROL
      mockConnection.executeMany.mockResolvedValueOnce({}); // INSERT PERMISOSROL

      await updateRole(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE ADMIN.ROL SET NOMBRE_ROL = :nombre_rol_param WHERE ID_ROL = :roleId_param',
        { roleId_param: 1, nombre_rol_param: 'ROL_ACTUALIZADO' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rol actualizado exitosamente.',
        ID_ROL: 1,
        NOMBRE_ROL: 'ROL_ACTUALIZADO',
        permisos: [{ ID_PERMISO: 2 }, { ID_PERMISO: 3 }],
      });
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el rol no existe', async () => {
      req.params.id = '999';
      req.body = {
        NOMBRE_ROL: 'ROL_ACTUALIZADO',
        permisos: [],
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 });

      await updateRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rol no encontrado para actualizar.',
        details: 'No hay detalles adicionales del error.',
      });
    });

    it('debería retornar 400 para ID inválido', async () => {
      req.params.id = 'invalid';
      req.body = { NOMBRE_ROL: 'TEST' };

      await updateRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID de Rol inválido para actualizar.',
        details: 'No hay detalles adicionales del error.',
      });
    });

    it('debería retornar 400 si falta el nombre del rol', async () => {
      req.params.id = '1';
      req.body = {};

      await updateRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El nombre del rol es obligatorio.',
        details: 'No hay detalles adicionales del error.',
      });
    });

    it('debería manejar error de nombre duplicado', async () => {
      req.params.id = '1';
      req.body = {
        NOMBRE_ROL: 'ROL_EXISTENTE',
        permisos: [],
      };

      const error = new Error('Unique constraint');
      error.errorNum = 1;
      mockConnection.execute.mockRejectedValue(error);

      await updateRole(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "El nombre de rol 'ROL_EXISTENTE' ya está en uso por otro rol.",
        details: 'Unique constraint',
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('debería eliminar un rol exitosamente', async () => {
      req.params.id = '1';

      mockConnection.execute
        .mockResolvedValueOnce({}) // DELETE PERMISOSROL
        .mockResolvedValueOnce({ rowsAffected: 1 }); // DELETE ROL

      await deleteRole(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM ADMIN.PERMISOSROL WHERE ID_ROL = :roleId_param',
        { roleId_param: 1 }
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM ADMIN.ROL WHERE ID_ROL = :roleId_param',
        { roleId_param: 1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rol eliminado exitosamente.',
      });
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando el rol no existe', async () => {
      req.params.id = '999';

      mockConnection.execute
        .mockResolvedValueOnce({}) // DELETE PERMISOSROL
        .mockResolvedValueOnce({ rowsAffected: 0 }); // DELETE ROL - no rows affected

      await deleteRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rol no encontrado para eliminar.',
        details: 'No hay detalles adicionales del error.',
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('debería retornar 400 para ID inválido', async () => {
      req.params.id = 'invalid';

      await deleteRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID de Rol inválido para eliminar.',
        details: 'No hay detalles adicionales del error.',
      });
    });

    it('debería manejar error de constraint de integridad', async () => {
      req.params.id = '1';

      const error = new Error('Integrity constraint');
      error.errorNum = 2292;
      mockConnection.execute.mockRejectedValue(error);

      await deleteRole(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'No se puede eliminar el rol porque está asignado a uno o más usuarios.',
        details: 'Integrity constraint',
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('debería manejar otros errores de base de datos', async () => {
      req.params.id = '1';
      const errorMessage = 'Error de BD';
      mockConnection.execute.mockRejectedValue(new Error(errorMessage));

      await deleteRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo eliminar el rol.',
        details: errorMessage,
      });
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });
});
