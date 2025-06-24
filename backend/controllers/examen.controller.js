// backend/controllers/examen.controller.js

import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Función helper robusta para manejar errores de forma consistente
const handleError = (res, error, defaultMessage, statusCode = 500) => {
  console.error(
    `[handleError] Mensaje: ${defaultMessage}, Error Original:`,
    error
  );
  const errorDetails =
    error && error.message
      ? error.message
      : typeof error === 'string'
        ? error
        : 'No hay detalles del error.';
  if (!res.headersSent) {
    res.status(statusCode).json({
      error: defaultMessage,
      details: errorDetails,
    });
  }
};

// --- CRUD Estándar para Exámenes ---

export const getAllExamenes = async (_req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT e.id_examen, e.nombre_examen, e.inscritos_examen, e.tipo_procesamiento_examen, e.plataforma_prose_examen,
              e.situacion_evaluativa_examen, e.cantidad_modulos_examen, s.nombre_seccion, a.nombre_asignatura, es.nombre_estado,
              -- INICIO DE LA CORRECCIÓN --
              (SELECT LISTAGG(U.NOMBRE_USUARIO, ', ') WITHIN GROUP (ORDER BY U.NOMBRE_USUARIO)
                 FROM USUARIOSECCION US
                 JOIN USUARIO U ON US.USUARIO_ID_USUARIO = U.ID_USUARIO
                 JOIN ROL R ON U.ROL_ID_ROL = R.ID_ROL
                 WHERE US.SECCION_ID_SECCION = s.id_seccion AND R.NOMBRE_ROL = 'DOCENTE'  -- <-- SE ASEGURA DE FILTRAR POR DOCENTE
              ) AS NOMBRE_DOCENTE
              -- FIN DE LA CORRECIÓN --
       FROM EXAMEN e
       JOIN SECCION s ON e.seccion_id_seccion = s.id_seccion
       JOIN ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
       JOIN ESTADO es ON e.estado_id_estado = es.id_estado
       ORDER BY e.id_examen DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'Error al obtener los exámenes');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

export const getExamenById = async (req, res) => {
  const { id } = req.params;
  const examenId = parseInt(id, 10);
  if (isNaN(examenId)) {
    return handleError(
      res,
      new Error('ID no es un número válido'),
      'El ID del examen proporcionado es inválido.',
      400
    );
  }

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT e.*, s.nombre_seccion, a.nombre_asignatura, es.nombre_estado
       FROM EXAMEN e
       JOIN SECCION s ON e.seccion_id_seccion = s.id_seccion
       JOIN ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
       JOIN ESTADO es ON e.estado_id_estado = es.id_estado
       WHERE e.id_examen = :id`,
      { id: examenId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) {
      return handleError(res, null, 'Examen no encontrado', 404);
    }
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'Error al obtener el examen');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

export const createExamen = async (req, res) => {
  const { ...fields } = req.body;

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `INSERT INTO EXAMEN (id_examen, nombre_examen, inscritos_examen, tipo_procesamiento_examen, plataforma_prose_examen, situacion_evaluativa_examen, cantidad_modulos_examen, seccion_id_seccion, estado_id_estado)
       VALUES (SEQ_EXAMEN.NEXTVAL, :nombre_examen, :inscritos_examen, :tipo_procesamiento_examen, :plataforma_prose_examen, :situacion_evaluativa_examen, :cantidad_modulos_examen, :seccion_id_seccion, :estado_id_estado)
       RETURNING id_examen INTO :newId`,
      {
        ...fields,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await connection.commit();
    res.status(201).json({ id_examen: result.outBinds.newId[0] });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.errorNum === 1 || err.errorNum === 1400) {
      return handleError(
        res,
        err,
        'Error de validación: verifique los datos ingresados',
        400
      );
    }
    handleError(res, err, 'Error al crear el examen');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

export const updateExamen = async (req, res) => {
  const { id } = req.params;
  const examenId = parseInt(id, 10);
  if (isNaN(examenId)) {
    return handleError(
      res,
      new Error('ID no es un número válido'),
      'El ID del examen es inválido.',
      400
    );
  }

  const { ...fieldsToUpdate } = req.body;

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `UPDATE EXAMEN SET
          nombre_examen = :nombre_examen, inscritos_examen = :inscritos_examen,
          tipo_procesamiento_examen = :tipo_procesamiento_examen, plataforma_prose_examen = :plataforma_prose_examen,
          situacion_evaluativa_examen = :situacion_evaluativa_examen, cantidad_modulos_examen = :cantidad_modulos_examen,
          seccion_id_seccion = :seccion_id_seccion, estado_id_estado = :estado_id_estado
        WHERE id_examen = :id`,
      { id: examenId, ...fieldsToUpdate }
    );
    if (result.rowsAffected === 0) {
      return handleError(res, null, 'Examen no encontrado', 404);
    }
    await connection.commit();
    res.status(200).json({ message: 'Examen actualizado correctamente' });
  } catch (err) {
    if (connection) await connection.rollback();
    handleError(res, err, 'Error al actualizar el examen');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

export const deleteExamen = async (req, res) => {
  const { id } = req.params;
  const examenId = parseInt(id, 10);
  if (isNaN(examenId)) {
    return handleError(
      res,
      new Error('ID no es un número válido'),
      'El ID del examen es inválido.',
      400
    );
  }

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `DELETE FROM EXAMEN WHERE id_examen = :id`,
      { id: examenId }
    );
    if (result.rowsAffected === 0) {
      return handleError(res, null, 'Examen no encontrado', 404);
    }
    await connection.commit();
    res.status(200).json({ message: 'Examen eliminado correctamente' });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.errorNum === 2292) {
      return handleError(
        res,
        err,
        'No se puede eliminar el examen porque tiene registros asociados.',
        409
      );
    }
    handleError(res, err, 'Error al eliminar el examen');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// --- Controladores Específicos para Selectores ---

export const getAllExamenesForSelect = async (_req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT
        E.ID_EXAMEN, E.NOMBRE_EXAMEN, S.NOMBRE_SECCION, A.NOMBRE_ASIGNATURA
      FROM EXAMEN E
      JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
      JOIN ASIGNATURA A ON S.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      ORDER BY E.NOMBRE_EXAMEN, S.NOMBRE_SECCION
    `;
    const result = await connection.execute(
      sql,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    handleError(
      res,
      error,
      'Error al obtener todos los exámenes para selección'
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
};

export const getAvailableExamsForUser = async (req, res) => {
  console.log('[getAvailableExamsForUser] Iniciando. req.user:', req.user);

  // Se comprueba 'id_usuario' que viene del token JWT.
  if (!req.user || !req.user.id_usuario) {
    return handleError(
      res,
      new Error('Usuario no autenticado o ID de usuario no encontrado.'),
      'Acceso no autorizado.',
      401
    );
  }

  const userId = req.user.id_usuario;
  const userRolId = req.user.rol_id_rol;

  // Definición de IDs de roles (ajusta según tu base de datos si es necesario)
  const ID_ROL_ADMIN = 1;
  const ID_ROL_DOCENTE = 2;
  const ID_ROL_ALUMNO = 3; // Añadido para Alumno
  const ROLES_POR_CARRERA = [16, 17, 18]; // Jefe Carrera, Coordinador Carrera, Coordinador Docente

  let connection;
  let sql;
  const params = {};

  const baseSelectFields = `
      SELECT ex.ID_EXAMEN, ex.NOMBRE_EXAMEN, ex.INSCRITOS_EXAMEN, ex.CANTIDAD_MODULOS_EXAMEN,
             sec.ID_SECCION,
             sec.NOMBRE_SECCION, asi.NOMBRE_ASIGNATURA,
            -- INICIO DE LA CORRECCIÓN --
             (SELECT LISTAGG(U.NOMBRE_USUARIO, ', ') WITHIN GROUP (ORDER BY U.NOMBRE_USUARIO)
                FROM USUARIOSECCION US
                JOIN USUARIO U ON US.USUARIO_ID_USUARIO = U.ID_USUARIO
                JOIN ROL R ON U.ROL_ID_ROL = R.ID_ROL
                WHERE US.SECCION_ID_SECCION = sec.ID_SECCION AND R.NOMBRE_ROL = 'DOCENTE'  -- <-- SE ASEGURA DE FILTRAR POR DOCENTE
             ) AS NOMBRE_DOCENTE
             -- FIN DE LA CORRECIÓN --
      FROM EXAMEN ex
      JOIN ESTADO est ON ex.ESTADO_ID_ESTADO = est.ID_ESTADO
      JOIN SECCION sec ON ex.SECCION_ID_SECCION = sec.ID_SECCION
      JOIN ASIGNATURA asi ON sec.ASIGNATURA_ID_ASIGNATURA = asi.ID_ASIGNATURA
  `;

  if (userRolId === ID_ROL_ADMIN) {
    sql = `${baseSelectFields} WHERE est.NOMBRE_ESTADO = 'ACTIVO' ORDER BY ex.NOMBRE_EXAMEN`;
    // No se necesita userId para el admin en este caso
  } else if (userRolId === ID_ROL_DOCENTE || userRolId === ID_ROL_ALUMNO) {
    // Docente y Alumno ven exámenes de sus secciones
    sql = `
      ${baseSelectFields}
      JOIN USUARIOSECCION us ON sec.ID_SECCION = us.SECCION_ID_SECCION
      WHERE us.USUARIO_ID_USUARIO = :userId AND est.NOMBRE_ESTADO = 'ACTIVO'
      ORDER BY ex.NOMBRE_EXAMEN
    `;
    params.userId = userId;
  } else if (ROLES_POR_CARRERA.includes(userRolId)) {
    sql = `
      ${baseSelectFields}
      JOIN CARRERA car ON asi.CARRERA_ID_CARRERA = car.ID_CARRERA
      JOIN USUARIOCARRERA uc ON car.ID_CARRERA = uc.CARRERA_ID_CARRERA
      WHERE uc.USUARIO_ID_USUARIO = :userId AND est.NOMBRE_ESTADO = 'ACTIVO'
      ORDER BY ex.NOMBRE_EXAMEN
    `;
    params.userId = userId;
  } else {
    console.log(
      `[getAvailableExamsForUser] Rol ID ${userRolId} no tiene lógica definida para listar exámenes disponibles.`
    );
    return res.json([]); // Rol no configurado para esta acción, devuelve lista vacía.
  }

  try {
    connection = await getConnection();
    console.log('[getAvailableExamsForUser] SQL a ejecutar:', sql);
    console.log('[getAvailableExamsForUser] Params:', params);

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    console.log(
      `[getAvailableExamsForUser] Exámenes encontrados: ${result.rows.length}`
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener los exámenes disponibles');
  } finally {
    if (connection) {
      try {
        console.log('[getAvailableExamsForUser] Cerrando conexión.');
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
};
