import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getAllSecciones,
  getSeccionById,
  createSeccion,
  updateSeccion,
  deleteSeccion,
  getSeccionesByAsignatura,
  getDocentesBySeccion,
} from '../../controllers/seccion.controller.js';

// Mocks
const mockExecute = vi.fn();
const mockExecuteMany = vi.fn();
const mockClose = vi.fn();
const mockCommit = vi.fn();
const mockRollback = vi.fn();

const mockConnection = {
  execute: mockExecute,
  executeMany: mockExecuteMany,
  close: mockClose,
  commit: mockCommit,
  rollback: mockRollback,
};

vi.mock('../../db.js', () => ({
  getConnection: vi.fn(() => Promise.resolve(mockConnection)),
}));

describe('Controlador de Secciones', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {
      json: vi.fn(() => res),
      status: vi.fn(() => res),
    };
  });

  describe('getAllSecciones', () => {
    it('debería retornar todas las secciones exitosamente', async () => {
      const mockSecciones = [
        {
          ID_SECCION: 1,
          NOMBRE_SECCION: 'Sección A',
          ASIGNATURA_ID_ASIGNATURA: 1,
          NOMBRE_ASIGNATURA: 'Matemática',
          NOMBRE_JORNADA: 'Diurna',
          ID_CARRERA: 1,
          NOMBRE_CARRERA: 'Ingeniería',
          NOMBRE_PROFESOR: 'Juan Pérez',
          PROFESOR_ID_PROFESOR: 5,
        },
        {
          ID_SECCION: 2,
          NOMBRE_SECCION: 'Sección B',
          ASIGNATURA_ID_ASIGNATURA: 2,
          NOMBRE_ASIGNATURA: 'Física',
          NOMBRE_JORNADA: 'Vespertina',
          ID_CARRERA: 1,
          NOMBRE_CARRERA: 'Ingeniería',
          NOMBRE_PROFESOR: 'María López',
          PROFESOR_ID_PROFESOR: 6,
        },
      ];

      mockExecute.mockResolvedValue({
        rows: mockSecciones,
      });

      await getAllSecciones(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockSecciones);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getAllSecciones', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getAllSecciones(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener secciones:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener secciones',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSeccionById', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería retornar una sección específica exitosamente', async () => {
      const mockSeccion = {
        ID_SECCION: 1,
        NOMBRE_SECCION: 'Sección A',
        NOMBRE_ASIGNATURA: 'Matemática',
      };

      mockExecute.mockResolvedValue({
        rows: [mockSeccion],
      });

      await getSeccionById(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.*, a.nombre_asignatura'),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockSeccion);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la sección no existe', async () => {
      mockExecute.mockResolvedValue({
        rows: [],
      });

      await getSeccionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Seccion no encontrada' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos en getSeccionById', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getSeccionById(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener seccion:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener seccion',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createSeccion', () => {
    it('debería crear una sección exitosamente', async () => {
      req.body = {
        nombre_seccion: 'Nueva Sección',
        asignatura_id_asignatura: 1,
        jornada_id_jornada: 1,
      };

      mockExecute.mockResolvedValue({
        outBinds: { newId: [123] },
      });

      await createSeccion(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO SECCION'),
        expect.objectContaining({
          nombre: 'Nueva Sección',
          asignatura: 1,
          jornada: 1,
        })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id_seccion: 123 });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al crear sección', async () => {
      req.body = {
        nombre_seccion: 'Nueva Sección',
        asignatura_id_asignatura: 1,
        jornada_id_jornada: 1,
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al insertar'));

      await createSeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al crear seccion:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear seccion',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateSeccion', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería actualizar una sección exitosamente', async () => {
      req.body = {
        nombre_seccion: 'Sección Actualizada',
        asignatura_id_asignatura: 2,
      };

      mockExecute.mockResolvedValue({
        rowsAffected: 1,
      });

      await updateSeccion(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE SECCION'),
        expect.objectContaining({
          id: '1',
          nombre: 'Sección Actualizada',
          asignatura_id: 2,
        })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Seccion actualizada' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería retornar 404 cuando la sección no existe', async () => {
      req.body = {
        nombre_seccion: 'Sección Actualizada',
        asignatura_id_asignatura: 2,
      };

      mockExecute.mockResolvedValue({
        rowsAffected: 0,
      });

      await updateSeccion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Seccion no encontrada' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al actualizar sección', async () => {
      req.body = {
        nombre_seccion: 'Sección Actualizada',
        asignatura_id_asignatura: 2,
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al actualizar'));

      await updateSeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al actualizar seccion:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar seccion',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteSeccion', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería eliminar una sección y sus dependencias exitosamente', async () => {
      // Mock de exámenes asociados
      mockExecute
        .mockResolvedValueOnce({ rows: [{ ID_EXAMEN: 1 }, { ID_EXAMEN: 2 }] }) // Buscar exámenes
        .mockResolvedValueOnce({ rowsAffected: 2 }) // Eliminar exámenes
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar usuarioseccion
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Eliminar sección

      mockExecuteMany
        .mockResolvedValueOnce() // Eliminar reserva_docentes
        .mockResolvedValueOnce() // Eliminar reservamodulo
        .mockResolvedValueOnce(); // Eliminar reservas

      await deleteSeccion(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ID_EXAMEN FROM EXAMEN'),
        ['1'],
        expect.any(Object)
      );
      expect(mockExecuteMany).toHaveBeenCalledTimes(3); // Tres executeMany calls
      expect(mockCommit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Sección y todos sus registros asociados eliminados correctamente.',
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería eliminar una sección sin exámenes asociados', async () => {
      // Mock sin exámenes asociados
      mockExecute
        .mockResolvedValueOnce({ rows: [] }) // Sin exámenes
        .mockResolvedValueOnce({ rowsAffected: 0 }) // Sin exámenes que eliminar
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Eliminar usuarioseccion
        .mockResolvedValueOnce({ rowsAffected: 1 }); // Eliminar sección

      await deleteSeccion(req, res);

      expect(mockExecuteMany).not.toHaveBeenCalled(); // No debe llamar executeMany si no hay exámenes
      expect(mockCommit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Sección y todos sus registros asociados eliminados correctamente.',
      });
    });

    it('debería retornar 404 cuando la sección no existe', async () => {
      mockExecute
        .mockResolvedValueOnce({ rows: [] }) // Sin exámenes
        .mockResolvedValueOnce({ rowsAffected: 0 }) // Sin exámenes que eliminar
        .mockResolvedValueOnce({ rowsAffected: 0 }) // Sin usuarioseccion que eliminar
        .mockResolvedValueOnce({ rowsAffected: 0 }); // Sección no existe

      await deleteSeccion(req, res);

      expect(mockRollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Seccion no encontrada' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al eliminar sección', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al eliminar'));

      await deleteSeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al eliminar seccion y sus dependencias:',
        expect.any(Error)
      );
      expect(mockRollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar la sección y sus dependencias.',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar errores en rollback', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error al eliminar'));
      mockRollback.mockRejectedValue(new Error('Error en rollback'));

      await deleteSeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al eliminar seccion y sus dependencias:',
        expect.any(Error)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error en rollback:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar errores al cerrar conexión', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Reset del mock para que no interfiera con otros tests
      mockClose.mockReset();

      mockExecute.mockRejectedValue(new Error('Error al eliminar'));
      mockClose.mockRejectedValue(new Error('Error al cerrar conexión'));

      await deleteSeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al cerrar la conexión:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      // Restaurar el mock close para otros tests
      mockClose.mockResolvedValue();
    });
  });

  describe('getSeccionesByAsignatura', () => {
    beforeEach(() => {
      req.params = { asignaturaId: '1' };
    });

    it('debería retornar secciones por asignatura exitosamente', async () => {
      const mockSecciones = [
        { ID_SECCION: 1, NOMBRE_SECCION: 'Sección A' },
        { ID_SECCION: 2, NOMBRE_SECCION: 'Sección B' },
      ];

      mockExecute.mockResolvedValue({
        rows: mockSecciones,
      });

      await getSeccionesByAsignatura(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT ID_SECCION, NOMBRE_SECCION FROM SECCION'
        ),
        ['1'],
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockSecciones);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al obtener secciones por asignatura', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getSeccionesByAsignatura(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al eliminar seccion:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener secciones por asignatura',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getDocentesBySeccion', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('debería retornar docentes por sección exitosamente', async () => {
      const mockDocentes = [
        { ID_USUARIO: 1, NOMBRE_USUARIO: 'Juan Pérez' },
        { ID_USUARIO: 2, NOMBRE_USUARIO: 'María López' },
      ];

      mockExecute.mockResolvedValue({
        rows: mockDocentes,
      });

      await getDocentesBySeccion(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.ID_USUARIO, u.NOMBRE_USUARIO'),
        { seccionId: '1' },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(mockDocentes);
      expect(mockClose).toHaveBeenCalled();
    });

    it('debería manejar errores al obtener docentes por sección', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockRejectedValue(new Error('Error de BD'));

      await getDocentesBySeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener docentes por seccion:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener docentes por seccion',
      });
      expect(mockClose).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería manejar errores al cerrar conexión en getDocentesBySeccion', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExecute.mockResolvedValue({ rows: [] });
      mockClose.mockRejectedValue(new Error('Error al cerrar'));

      await getDocentesBySeccion(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
