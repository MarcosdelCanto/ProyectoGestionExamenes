/**
 * @fileoverview Pruebas unitarias para el controlador de exámenes
 * @description Valida el comportamiento CRUD y funciones específicas de exámenes
 * @author Sistema de Pruebas
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Configuración de mocks para dependencias externas
vi.mock('../../db.js', () => ({
  getConnection: vi.fn(),
}));

/**
 * Suite de pruebas para el Controlador de Exámenes
 * Cubre todas las funciones principales: CRUD y funciones específicas
 */
describe('Controlador de Exámenes', () => {
  let mockConnection;
  let getConnection;

  beforeEach(async () => {
    const dbModule = await import('../../db.js');
    getConnection = dbModule.getConnection;

    mockConnection = {
      execute: vi.fn(),
      close: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };

    getConnection.mockResolvedValue(mockConnection);
    vi.clearAllMocks();
  });

  describe('getAllExamenes', () => {
    test('debería retornar todos los exámenes exitosamente', async () => {
      const { getAllExamenes } = await import(
        '../../controllers/examen.controller.js'
      );

      const mockExamenes = [
        {
          ID_EXAMEN: 1,
          NOMBRE_EXAMEN: 'Examen Final Matemáticas',
          INSCRITOS_EXAMEN: 30,
          NOMBRE_SECCION: 'MAT-001',
          NOMBRE_ASIGNATURA: 'Matemáticas I',
          NOMBRE_ESTADO: 'ACTIVO',
        },
        {
          ID_EXAMEN: 2,
          NOMBRE_EXAMEN: 'Examen Parcial Física',
          INSCRITOS_EXAMEN: 25,
          NOMBRE_SECCION: 'FIS-001',
          NOMBRE_ASIGNATURA: 'Física I',
          NOMBRE_ESTADO: 'ACTIVO',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockExamenes });

      const req = {};
      const res = {
        json: vi.fn(),
      };

      await getAllExamenes(req, res);

      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockExamenes);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería manejar errores de base de datos', async () => {
      const { getAllExamenes } = await import(
        '../../controllers/examen.controller.js'
      );

      mockConnection.execute.mockRejectedValue(new Error('Error de BD'));

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getAllExamenes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al obtener los exámenes',
        })
      );
    });
  });

  describe('getExamenById', () => {
    test('debería retornar un examen específico cuando el ID es válido', async () => {
      const { getExamenById } = await import(
        '../../controllers/examen.controller.js'
      );

      const mockExamen = {
        ID_EXAMEN: 1,
        NOMBRE_EXAMEN: 'Examen Final Matemáticas',
        INSCRITOS_EXAMEN: 30,
        NOMBRE_SECCION: 'MAT-001',
        NOMBRE_ASIGNATURA: 'Matemáticas I',
        NOMBRE_ESTADO: 'ACTIVO',
      };

      mockConnection.execute.mockResolvedValue({ rows: [mockExamen] });

      const req = { params: { id: '1' } };
      const res = {
        json: vi.fn(),
      };

      await getExamenById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockExamen);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería retornar 400 cuando el ID no es un número válido', async () => {
      const { getExamenById } = await import(
        '../../controllers/examen.controller.js'
      );

      const req = { params: { id: 'abc' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getExamenById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'El ID del examen proporcionado es inválido.',
        })
      );
    });

    test('debería retornar 404 cuando el examen no existe', async () => {
      const { getExamenById } = await import(
        '../../controllers/examen.controller.js'
      );

      mockConnection.execute.mockResolvedValue({ rows: [] });

      const req = { params: { id: '999' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getExamenById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Examen no encontrado',
        })
      );
    });
  });

  describe('createExamen', () => {
    test('debería crear un examen exitosamente', async () => {
      const { createExamen } = await import(
        '../../controllers/examen.controller.js'
      );

      const newExamenId = 123;
      mockConnection.execute.mockResolvedValue({
        outBinds: { newId: [newExamenId] },
      });

      const req = {
        body: {
          nombre_examen: 'Nuevo Examen',
          inscritos_examen: 30,
          tipo_procesamiento_examen: 'AUTOMATICO',
          plataforma_prose_examen: 'MOODLE',
          situacion_evaluativa_examen: 'FINAL',
          cantidad_modulos_examen: 2,
          seccion_id_seccion: 1,
          estado_id_estado: 1,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await createExamen(req, res);

      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_examen: newExamenId });
    });

    test('debería manejar errores de validación', async () => {
      const { createExamen } = await import(
        '../../controllers/examen.controller.js'
      );

      const dbError = new Error('Constraint violation');
      dbError.errorNum = 1400; // Oracle error for NOT NULL constraint
      mockConnection.execute.mockRejectedValue(dbError);

      const req = {
        body: {
          nombre_examen: '',
          // Faltan campos obligatorios
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await createExamen(req, res);

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación: verifique los datos ingresados',
        })
      );
    });
  });

  describe('deleteExamen', () => {
    test('debería eliminar un examen exitosamente', async () => {
      const { deleteExamen } = await import(
        '../../controllers/examen.controller.js'
      );

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      const req = { params: { id: '1' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await deleteExamen(req, res);

      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Examen eliminado correctamente',
      });
    });

    test('debería manejar errores de integridad referencial', async () => {
      const { deleteExamen } = await import(
        '../../controllers/examen.controller.js'
      );

      const dbError = new Error('Foreign key constraint');
      dbError.errorNum = 2292; // Oracle error for foreign key constraint
      mockConnection.execute.mockRejectedValue(dbError);

      const req = { params: { id: '1' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await deleteExamen(req, res);

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error:
            'No se puede eliminar el examen porque tiene registros asociados.',
        })
      );
    });
  });

  describe('getAvailableExamsForUser', () => {
    test('debería retornar exámenes disponibles para usuario administrador', async () => {
      const { getAvailableExamsForUser } = await import(
        '../../controllers/examen.controller.js'
      );

      const mockExamenes = [
        {
          ID_EXAMEN: 1,
          NOMBRE_EXAMEN: 'Examen Disponible',
          ID_SECCION: 1,
          NOMBRE_SECCION: 'SEC-001',
          NOMBRE_ASIGNATURA: 'Matemáticas I',
        },
      ];

      mockConnection.execute.mockResolvedValue({ rows: mockExamenes });

      const req = {
        user: {
          id_usuario: 1,
          rol_id_rol: 1, // ADMIN
        },
      };
      const res = {
        json: vi.fn(),
      };

      await getAvailableExamsForUser(req, res);

      expect(res.json).toHaveBeenCalledWith(mockExamenes);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    test('debería retornar 401 cuando el usuario no está autenticado', async () => {
      const { getAvailableExamsForUser } = await import(
        '../../controllers/examen.controller.js'
      );

      const req = { user: null };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getAvailableExamsForUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso no autorizado.',
        })
      );
    });

    test('debería retornar lista vacía para roles no configurados', async () => {
      const { getAvailableExamsForUser } = await import(
        '../../controllers/examen.controller.js'
      );

      const req = {
        user: {
          id_usuario: 1,
          rol_id_rol: 999, // Rol no configurado
        },
      };
      const res = {
        json: vi.fn(),
      };

      await getAvailableExamsForUser(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
