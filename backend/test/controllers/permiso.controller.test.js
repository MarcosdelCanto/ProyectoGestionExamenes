import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAllPermisos,
  fetchPermisosByRol,
  updatePermisosRol,
} from '../../controllers/permiso.controller.js';

// Mock de la conexión a la base de datos
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

import { getConnection } from '../../db.js';

describe('Controlador de Permisos', () => {
  let mockConnection;
  let req;
  let res;

  beforeEach(() => {
    mockConnection = {
      execute: vi.fn(),
      close: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };
    getConnection.mockResolvedValue(mockConnection);

    req = {
      params: {},
      body: {},
      query: {},
    };

    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('fetchAllPermisos', () => {
    it('debería retornar todos los permisos exitosamente', async () => {
      const mockPermisos = [
        {
          ID_PERMISO: 1,
          NOMBRE_PERMISO: 'ADMIN_GENERAL',
          DESCRIPCION_PERMISO: 'Acceso completo al sistema',
          GRUPO_PERMISO: 'ADMINISTRACION',
        },
        {
          ID_PERMISO: 2,
          NOMBRE_PERMISO: 'LEER_EXAMENES',
          DESCRIPCION_PERMISO: 'Ver exámenes',
          GRUPO_PERMISO: 'EXAMENES',
        },
        {
          ID_PERMISO: 3,
          NOMBRE_PERMISO: 'CREAR_RESERVAS',
          DESCRIPCION_PERMISO: 'Crear reservas de salas',
          GRUPO_PERMISO: 'RESERVAS',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockPermisos });

      await fetchAllPermisos(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT ID_PERMISO, NOMBRE_PERMISO, DESCRIPCION_PERMISO, GRUPO_PERMISO FROM ADMIN.PERMISOS'
        ),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockPermisos);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en fetchAllPermisos', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await fetchAllPermisos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudieron obtener los permisos.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('fetchPermisosByRol', () => {
    it('debería retornar permisos de un rol específico exitosamente', async () => {
      const mockPermisos = [
        {
          ID_PERMISO: 1,
          NOMBRE_PERMISO: 'ADMIN_GENERAL',
          DESCRIPCION_PERMISO: 'Acceso completo al sistema',
          GRUPO_PERMISO: 'ADMINISTRACION',
        },
        {
          ID_PERMISO: 2,
          NOMBRE_PERMISO: 'LEER_EXAMENES',
          DESCRIPCION_PERMISO: 'Ver exámenes',
          GRUPO_PERMISO: 'EXAMENES',
        },
      ];

      req.params.idRol = '1';
      mockConnection.execute.mockResolvedValue({ rows: mockPermisos });

      await fetchPermisosByRol(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM ADMIN.PERMISOS P'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockPermisos);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar array vacío cuando el rol no tiene permisos', async () => {
      req.params.idRol = '999';
      mockConnection.execute.mockResolvedValue({ rows: [] });

      await fetchPermisosByRol(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en fetchPermisosByRol', async () => {
      req.params.idRol = '1';
      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      await fetchPermisosByRol(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudieron obtener los permisos.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores al cerrar la conexión', async () => {
      const mockPermisos = [
        {
          ID_PERMISO: 1,
          NOMBRE_PERMISO: 'ADMIN_GENERAL',
          DESCRIPCION_PERMISO: 'Acceso completo',
          GRUPO_PERMISO: 'ADMIN',
        },
      ];

      req.params.idRol = '1';
      mockConnection.execute.mockResolvedValue({ rows: mockPermisos });
      mockConnection.close.mockRejectedValue(
        new Error('Error cerrando conexión')
      );

      await fetchPermisosByRol(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPermisos);
      // El error de cierre no debe afectar la respuesta principal
    });
  });

  describe('updatePermisosRol', () => {
    it('debería actualizar permisos de un rol exitosamente', async () => {
      req.params.idRol = '1';
      req.body = {
        permisos: [1, 2, 3], // IDs de permisos
      };

      // Mock para eliminar permisos actuales y insertar nuevos
      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 2 }) // delete
        .mockResolvedValueOnce({ rowsAffected: 1 }) // insert permiso 1
        .mockResolvedValueOnce({ rowsAffected: 1 }) // insert permiso 2
        .mockResolvedValueOnce({ rowsAffected: 1 }); // insert permiso 3

      await updatePermisosRol(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ADMIN.PERMISOSROL'),
        ['1']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ADMIN.PERMISOSROL'),
        expect.objectContaining({ idRol: '1', idPermiso: 1 })
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ADMIN.PERMISOSROL'),
        expect.objectContaining({ idRol: '1', idPermiso: 2 })
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ADMIN.PERMISOSROL'),
        expect.objectContaining({ idRol: '1', idPermiso: 3 })
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permisos actualizados correctamente.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería actualizar permisos con array vacío (eliminar todos)', async () => {
      req.params.idRol = '1';
      req.body = {
        permisos: [], // Sin permisos
      };

      mockConnection.execute.mockResolvedValue({ rowsAffected: 2 }); // delete

      await updatePermisosRol(req, res);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ADMIN.PERMISOSROL'),
        ['1']
      );
      // No debe haber inserts
      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permisos actualizados correctamente.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería retornar 400 cuando permisos no es un array', async () => {
      req.params.idRol = '1';
      req.body = {
        permisos: 'invalid', // No es array
      };

      await updatePermisosRol(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El formato de permisos debe ser un array.',
      });
    });

    it('debería retornar 400 cuando permisos es undefined', async () => {
      req.params.idRol = '1';
      req.body = {
        // Sin permisos
      };

      await updatePermisosRol(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El formato de permisos debe ser un array.',
      });
    });

    it('debería manejar errores durante la transacción', async () => {
      req.params.idRol = '1';
      req.body = {
        permisos: [1, 2],
      };

      mockConnection.execute
        .mockResolvedValueOnce({ rowsAffected: 1 }) // delete exitoso
        .mockRejectedValueOnce(new Error('Error al insertar')); // insert falla

      await updatePermisosRol(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudieron actualizar los permisos del rol.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('debería manejar errores en el delete inicial', async () => {
      req.params.idRol = '1';
      req.body = {
        permisos: [1, 2],
      };

      mockConnection.execute.mockRejectedValue(new Error('Error al eliminar'));

      await updatePermisosRol(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudieron actualizar los permisos del rol.',
      });
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
