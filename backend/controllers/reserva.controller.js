// controllers/reserva.controller.js
import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  const details =
    error && error.message
      ? error.message
      : error
        ? String(error)
        : 'No hay detalles adicionales del error.';
  res.status(statusCode).json({ error: message, details: details });
};

export const getAllReservas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.ID_RESERVA, r.FECHA_RESERVA,
              e.ID_EXAMEN, e.NOMBRE_EXAMEN,
              s.ID_SALA, s.NOMBRE_SALA,
              est.ID_ESTADO, est.NOMBRE_ESTADO AS ESTADO_RESERVA,
              r.ESTADO_CONFIRMACION_DOCENTE, r.OBSERVACIONES_DOCENTE
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       ORDER BY r.FECHA_RESERVA DESC, r.ID_RESERVA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'Error al obtener reservas');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en getAllReservas:', closeErr);
      }
    }
  }
};

export const getReservaById = async (req, res) => {
  const { id } = req.params;
  const reservaIdNum = parseInt(id, 10);
  if (isNaN(reservaIdNum)) {
    return handleError(res, null, 'El ID de la reserva no es válido.', 400);
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.ID_RESERVA, r.FECHA_RESERVA,
              e.ID_EXAMEN, e.NOMBRE_EXAMEN,
              s.ID_SALA, s.NOMBRE_SALA,
              est.ID_ESTADO, est.NOMBRE_ESTADO AS ESTADO_RESERVA,
              r.ESTADO_CONFIRMACION_DOCENTE, r.OBSERVACIONES_DOCENTE, r.FECHA_CONFIRMACION_DOCENTE
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       WHERE r.ID_RESERVA = :id_param`, // Cambiado a id_param para consistencia con el bind
      { id_param: reservaIdNum }, // Usar el mismo nombre de bind variable
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return handleError(res, null, 'Reserva no encontrada', 404);

    const modulosResult = await conn.execute(
      `SELECT m.ID_MODULO, m.NOMBRE_MODULO, m.INICIO_MODULO, m.FIN_MODULO
         FROM RESERVAMODULO rm
         JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO
         WHERE rm.RESERVA_ID_RESERVA = :reservaId_param`,
      { reservaId_param: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const reservaConModulos = {
      ...result.rows[0],
      MODULOS: modulosResult.rows,
    };
    res.json(reservaConModulos);
  } catch (err) {
    handleError(res, err, 'Error al obtener reserva');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en getReservaById:', closeErr);
      }
    }
  }
};

export const crearReservaParaExamenExistente = async (req, res) => {
  let connection;
  try {
    const { examen_id_examen, fecha_reserva, sala_id_sala, modulos_ids } =
      req.body;

    if (
      !examen_id_examen ||
      !fecha_reserva ||
      !sala_id_sala ||
      !modulos_ids ||
      modulos_ids.length === 0
    ) {
      return handleError(
        res,
        null,
        'Faltan campos obligatorios o no se seleccionaron módulos.',
        400
      );
    }

    connection = await getConnection();
    // Transacción implícita (autoCommit=false)

    let idEstadoProgramado;
    const estadoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'PROGRAMADO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (estadoResult.rows.length === 0) {
      return handleError(
        res,
        null,
        "El estado 'PROGRAMADO' no se encuentra configurado en la tabla ESTADO.",
        500
      );
    }
    idEstadoProgramado = estadoResult.rows[0].ID_ESTADO;

    const fechaReservaCompleta = `${fecha_reserva} 00:00:00`;

    const reservaSql = `
      INSERT INTO RESERVA (
        ID_RESERVA, FECHA_RESERVA, SALA_ID_SALA, EXAMEN_ID_EXAMEN, ESTADO_ID_ESTADO,
        ESTADO_CONFIRMACION_DOCENTE
      ) VALUES (
        RESERVA_SEQ.NEXTVAL,
        TO_TIMESTAMP(:fecha_reserva_param, 'YYYY-MM-DD HH24:MI:SS'),
        :sala_id_sala_param, :examen_id_examen_param, :estado_id_param, 'PENDIENTE'
      ) RETURNING ID_RESERVA INTO :new_reserva_id_param
    `;
    const out_newReservaId = { type: oracledb.NUMBER, dir: oracledb.BIND_OUT };
    const bindReserva = {
      fecha_reserva_param: fechaReservaCompleta,
      sala_id_sala_param: parseInt(sala_id_sala),
      examen_id_examen_param: parseInt(examen_id_examen),
      estado_id_param: idEstadoProgramado,
      new_reserva_id_param: out_newReservaId,
    };

    const resultReserva = await connection.execute(reservaSql, bindReserva);
    const generatedReservaId = resultReserva.outBinds.new_reserva_id_param[0];

    if (generatedReservaId && modulos_ids && modulos_ids.length > 0) {
      const reservamoduloSql = `
        INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
        VALUES (:modulo_id_param, :reserva_id_param)
      `;
      const bindDefsReservamodulo = modulos_ids.map((moduloId) => ({
        modulo_id_param: parseInt(moduloId),
        reserva_id_param: generatedReservaId,
      }));
      await connection.executeMany(reservamoduloSql, bindDefsReservamodulo);
    } else {
      throw new Error(
        'No se generó ID de reserva o no se especificaron módulos tras inserción.'
      );
    }

    await connection.commit();
    res.status(201).json({
      message:
        'Reserva creada y programada exitosamente. Queda pendiente de confirmación por el docente.',
      id_reserva: generatedReservaId,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          'Error ejecutando rollback en crearReservaParaExamenExistente:',
          rollbackError
        );
      }
    }
    handleError(res, error, 'Error al crear la reserva');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error cerrando la conexión en crearReservaParaExamenExistente:',
          err
        );
      }
    }
  }
};

export const createReserva = async (req, res) => {
  const {
    fecha_reserva,
    examen_id_examen,
    sala_id_sala,
    estado_id_estado,
    modulos,
  } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const resultReserva = await conn.execute(
      `INSERT INTO RESERVA (ID_RESERVA, FECHA_RESERVA, EXAMEN_ID_EXAMEN, SALA_ID_SALA, ESTADO_ID_ESTADO, ESTADO_CONFIRMACION_DOCENTE)
       VALUES (RESERVA_SEQ.NEXTVAL, TO_DATE(:fecha_reserva_param, 'YYYY-MM-DD'), :examen_id_param, :sala_id_param, :estado_id_param, 'PENDIENTE')
       RETURNING ID_RESERVA INTO :newId_param`,
      {
        fecha_reserva_param: fecha_reserva,
        examen_id_param: parseInt(examen_id_examen),
        sala_id_param: parseInt(sala_id_sala),
        estado_id_param: parseInt(estado_id_estado),
        newId_param: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false }
    );
    const newReservaId = resultReserva.outBinds.newId_param[0];
    if (modulos && Array.isArray(modulos) && modulos.length > 0) {
      const reservamoduloSql = `
        INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
        VALUES (:modulo_id_param, :reserva_id_param)
      `;
      const bindDefsReservamodulo = modulos.map((moduloId) => ({
        modulo_id_param: parseInt(moduloId),
        reserva_id_param: newReservaId,
      }));
      await conn.executeMany(reservamoduloSql, bindDefsReservamodulo, {
        autoCommit: false,
      });
    }
    await conn.commit();
    res.status(201).json({
      message: 'Reserva (original) creada con éxito',
      id_reserva: newReservaId,
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error('Error en rollback de createReserva original:', rbErr);
      }
    }
    handleError(res, err, 'Error al crear reserva (método original)');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error(
          'Error cerrando conexión en createReserva original:',
          closeErr
        );
      }
    }
  }
};

export const updateReserva = async (req, res) => {
  const { id } = req.params;
  const reservaIdNum = parseInt(id, 10);
  if (isNaN(reservaIdNum)) {
    return handleError(res, null, 'El ID de la reserva no es válido.', 400);
  }
  const { fecha_reserva, examen_id_examen, sala_id_sala, modulos } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const resultUpdateReserva = await conn.execute(
      `UPDATE RESERVA
         SET FECHA_RESERVA = TO_TIMESTAMP(:fecha_reserva_param, 'YYYY-MM-DD HH24:MI:SS'),
             EXAMEN_ID_EXAMEN = :examen_id_param,
             SALA_ID_SALA = :sala_id_param,
             ESTADO_ID_ESTADO = :estado_id_param
         WHERE ID_RESERVA = :id_param`,
      {
        id_param: reservaIdNum,
        fecha_reserva_param: `${fecha_reserva} 00:00:00`,
        examen_id_param: parseInt(examen_id_examen),
        sala_id_param: parseInt(sala_id_sala),
        estado_id_param: 6, // Asumiendo que 6 es el ID de 'PENDIENTE'
      },
      { autoCommit: false } // Asegurar que es parte de la transacción
    );
    if (resultUpdateReserva.rowsAffected === 0) {
      return handleError(
        res,
        null,
        'Reserva no encontrada para actualizar',
        404
      );
    }
    await conn.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reserva_id_param`,
      { reserva_id_param: reservaIdNum },
      { autoCommit: false } // Parte de la transacción
    );
    if (modulos && Array.isArray(modulos) && modulos.length > 0) {
      const reservamoduloSql = `
        INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
        VALUES (:modulo_id_param, :reserva_id_param)
      `;
      const bindDefsReservamodulo = modulos.map((moduloId) => ({
        modulo_id_param: parseInt(moduloId),
        reserva_id_param: reservaIdNum,
      }));
      await conn.executeMany(reservamoduloSql, bindDefsReservamodulo, {
        autoCommit: false,
      });
    }
    await conn.commit();
    res.json({ message: 'Reserva actualizada con éxito' });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error('Error en rollback de updateReserva:', rbErr);
      }
    }
    handleError(res, err, 'Error al actualizar reserva');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en updateReserva:', closeErr);
      }
    }
  }
};

export const deleteReserva = async (req, res) => {
  const { id } = req.params;
  const reservaIdNum = parseInt(id, 10);
  if (isNaN(reservaIdNum)) {
    return handleError(res, null, 'El ID de la reserva no es válido.', 400);
  }
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :id_param`,
      { id_param: reservaIdNum },
      { autoCommit: false }
    );
    const result = await conn.execute(
      `DELETE FROM RESERVA WHERE ID_RESERVA = :id_param`,
      { id_param: reservaIdNum },
      { autoCommit: false }
    );
    if (result.rowsAffected === 0) {
      if (conn) {
        try {
          await conn.rollback();
        } catch (e) {
          console.error('Error en rollback de deleteReserva (no rows):', e);
        }
      }
      return handleError(res, null, 'Reserva no encontrada para eliminar', 404);
    }
    await conn.commit();
    res.json({ message: 'Reserva eliminada/cancelada con éxito' });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        console.error('Error en rollback de deleteReserva (catch):', e);
      }
    }
    handleError(res, err, 'Error al eliminar reserva');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error('Error cerrando conexión en deleteReserva:', e);
      }
    }
  }
};

export const getMisReservasPendientes = async (req, res) => {
  let connection;
  try {
    const idDocenteAutenticado = req.user.id_usuario;
    const ROL_ID_DOCENTE = 2;
    if (req.user.rol_id_rol !== ROL_ID_DOCENTE) {
      return handleError(
        res,
        null,
        'Acceso denegado. Se requiere rol de docente.',
        403
      );
    }
    connection = await getConnection();
    const sql = `
      SELECT
          R.ID_RESERVA, R.FECHA_RESERVA, R.ESTADO_CONFIRMACION_DOCENTE, R.OBSERVACIONES_DOCENTE,
          R.FECHA_CONFIRMACION_DOCENTE, /* Añadido por si es útil en el frontend */
          E.ID_EXAMEN, E.NOMBRE_EXAMEN,
          SEC.ID_SECCION, SEC.NOMBRE_SECCION,
          A.ID_ASIGNATURA, A.NOMBRE_ASIGNATURA,
          J.NOMBRE_JORNADA,
          SL.NOMBRE_SALA,
          ED.NOMBRE_EDIFICIO,
          SED.NOMBRE_SEDE,
          (SELECT MIN(M.INICIO_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_INICIO,
          (SELECT MAX(M.FIN_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_FIN,
          EST_RES.NOMBRE_ESTADO AS ESTADO_GENERAL_RESERVA
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN JORNADA J ON SEC.JORNADA_ID_JORNADA = J.ID_JORNADA
      JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
      JOIN USUARIO U ON US.USUARIO_ID_USUARIO = U.ID_USUARIO
      JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA
      JOIN EDIFICIO ED ON SL.EDIFICIO_ID_EDIFICIO = ED.ID_EDIFICIO
      JOIN SEDE SED ON ED.SEDE_ID_SEDE = SED.ID_SEDE
      JOIN ESTADO EST_RES ON R.ESTADO_ID_ESTADO = EST_RES.ID_ESTADO
      WHERE US.USUARIO_ID_USUARIO = :idDocenteAutenticado_param
        AND U.ROL_ID_ROL = :rolDocente_param
        AND R.ESTADO_CONFIRMACION_DOCENTE = 'PENDIENTE'
      ORDER BY R.FECHA_RESERVA ASC
    `;
    const params = {
      idDocenteAutenticado_param: idDocenteAutenticado,
      rolDocente_param: ROL_ID_DOCENTE,
    };
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener reservas pendientes del docente');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error closing connection for getMisReservasPendientes',
          err
        );
      }
    }
  }
};

export const actualizarConfirmacionDocente = async (req, res) => {
  let connection;
  try {
    const { idReserva } = req.params;
    const reservaIdNum = parseInt(idReserva, 10);
    if (isNaN(reservaIdNum)) {
      return handleError(
        res,
        null,
        'El ID de la reserva para confirmar no es válido.',
        400
      );
    }
    const { nuevoEstado, observaciones } = req.body; // nuevoEstado es 'CONFIRMADA' o 'REQUIERE_REVISION'
    const idDocenteAutenticado = req.user.id_usuario;
    const ROL_ID_DOCENTE = 2;

    // CORRECCIÓN: Quitar espacios extra en los strings de estado
    if (!['CONFIRMADO', 'REQUIERE_REVISION'].includes(nuevoEstado.trim())) {
      return handleError(
        res,
        null,
        'Estado de confirmación docente no válido.',
        400
      );
    }
    if (req.user.rol_id_rol !== ROL_ID_DOCENTE) {
      return handleError(
        res,
        null,
        'Acceso denegado. Se requiere rol de docente.',
        403
      );
    }
    connection = await getConnection();
    // No es necesario BEGIN explícito

    const checkSql = `
      SELECT E.ID_EXAMEN
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
      JOIN USUARIOSECCION US ON S.ID_SECCION = US.SECCION_ID_SECCION
      WHERE R.ID_RESERVA = :idReserva_param
        AND US.USUARIO_ID_USUARIO = :idDocenteAutenticado_param
    `;
    const checkResult = await connection.execute(
      checkSql,
      {
        idReserva_param: reservaIdNum,
        idDocenteAutenticado_param: idDocenteAutenticado,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (checkResult.rows.length === 0) {
      return handleError(
        res,
        null,
        'No autorizado para modificar esta reserva o la reserva no existe.',
        403
      );
    }

    let idEstadoGeneralReservaParaUpdate = null;
    if (nuevoEstado.trim() === 'CONFIRMADO') {
      // Usar trim()
      const estadoConfirmadoGeneralResult = await connection.execute(
        `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'CONFIRMADO'`, // O 'CONFIRMADA'
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (estadoConfirmadoGeneralResult.rows.length > 0) {
        idEstadoGeneralReservaParaUpdate =
          estadoConfirmadoGeneralResult.rows[0].ID_ESTADO;
      } else {
        console.warn(
          "Estado general 'CONFIRMADO' no encontrado en tabla ESTADO. ESTADO_ID_ESTADO de la reserva no se cambiará."
        );
      }
    }

    let setClauseEstadoGeneral = '';
    const updateParams = {
      nuevoEstado_param: nuevoEstado.trim(), // Usar trim()
      observaciones_param: observaciones || null,
      idReserva_param: reservaIdNum,
    };

    if (idEstadoGeneralReservaParaUpdate !== null) {
      setClauseEstadoGeneral = ', ESTADO_ID_ESTADO = :idEstadoGeneral_param';
      updateParams.idEstadoGeneral_param = idEstadoGeneralReservaParaUpdate;
    }

    const updateSql = `
      UPDATE RESERVA SET
        ESTADO_CONFIRMACION_DOCENTE = :nuevoEstado_param,
        OBSERVACIONES_DOCENTE = :observaciones_param,
        FECHA_CONFIRMACION_DOCENTE = SYSTIMESTAMP
        ${setClauseEstadoGeneral}
      WHERE ID_RESERVA = :idReserva_param
    `;

    const result = await connection.execute(updateSql, updateParams);

    if (result.rowsAffected === 0) {
      // No se necesita rollback aquí si no hubo otras DML en esta transacción antes que esta falle
      return handleError(
        res,
        null,
        'No se pudo actualizar la reserva (no se afectaron filas).',
        404
      );
    }

    await connection.commit();
    res.json({
      message: `Reserva ${reservaIdNum} actualizada a estado ${nuevoEstado.trim()} por el docente.`,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbError) {
        console.error(
          'Error en rollback de actualizarConfirmacionDocente:',
          rbError
        );
      }
    }
    handleError(
      res,
      error,
      'Error al actualizar la confirmación de la reserva'
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error closing connection for actualizarConfirmacionDocente',
          err
        );
      }
    }
  }
};

export const getMisAsignacionesDeReservas = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id_usuario;
    const userRolId = req.user.rol_id_rol;

    const ID_ROL_ALUMNO = 3;
    const ID_ROL_DOCENTE = 2;
    const ID_ROL_COORDINADOR_CARRERA = 17;
    const ID_ROL_JEFE_CARRERA = 16;
    const ID_ROL_COORDINADOR_DOCENTE = 18;
    const ID_ROL_ADMIN = 1; // Asumiendo que ADMIN tiene ID 1

    const ROLES_POR_CARRERA = [
      ID_ROL_COORDINADOR_CARRERA,
      ID_ROL_JEFE_CARRERA,
      ID_ROL_COORDINADOR_DOCENTE,
    ];

    let sqlQuery;
    const params = { userId_param: userId };

    let baseSelect = `
      SELECT
        R.ID_RESERVA, R.FECHA_RESERVA,
        R.ESTADO_CONFIRMACION_DOCENTE, R.OBSERVACIONES_DOCENTE, R.FECHA_CONFIRMACION_DOCENTE,
        E.ID_EXAMEN, E.NOMBRE_EXAMEN,
        SEC.ID_SECCION, SEC.NOMBRE_SECCION,
        A.ID_ASIGNATURA, A.NOMBRE_ASIGNATURA,
        C.ID_CARRERA, C.NOMBRE_CARRERA,
        ESC.ID_ESCUELA, ESC.NOMBRE_ESCUELA,
        SE.ID_SEDE, SE.NOMBRE_SEDE,
        J.ID_JORNADA, J.NOMBRE_JORNADA,
        SL.ID_SALA, SL.NOMBRE_SALA,
        EST_R.NOMBRE_ESTADO AS ESTADO_RESERVA,
        EST_E.NOMBRE_ESTADO AS ESTADO_EXAMEN,
        (SELECT MIN(M.INICIO_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_INICIO,
        (SELECT MAX(M.FIN_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_FIN
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN CARRERA C ON A.CARRERA_ID_CARRERA = C.ID_CARRERA
      JOIN ESCUELA ESC ON C.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
      JOIN SEDE SE ON ESC.SEDE_ID_SEDE = SE.ID_SEDE
      JOIN JORNADA J ON SEC.JORNADA_ID_JORNADA = J.ID_JORNADA
      JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA
      JOIN ESTADO EST_R ON R.ESTADO_ID_ESTADO = EST_R.ID_ESTADO
      JOIN ESTADO EST_E ON E.ESTADO_ID_ESTADO = EST_E.ID_ESTADO
    `;

    if (userRolId === ID_ROL_ALUMNO) {
      sqlQuery = `
        ${baseSelect}
        JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
        WHERE US.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')
        ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (userRolId === ID_ROL_DOCENTE) {
      sqlQuery = `
        ${baseSelect}
        JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
        WHERE US.USUARIO_ID_USUARIO = :userId_param
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO', 'PENDIENTE')
        ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (ROLES_POR_CARRERA.includes(userRolId)) {
      sqlQuery = `
        ${baseSelect}
        JOIN USUARIOCARRERA UC ON C.ID_CARRERA = UC.CARRERA_ID_CARRERA
        WHERE UC.USUARIO_ID_USUARIO = :userId_param
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO', 'PENDIENTE')
        ORDER BY C.NOMBRE_CARRERA, R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (userRolId === ID_ROL_ADMIN) {
      // Lógica para ADMIN
      sqlQuery = `${baseSelect} ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC`;
      delete params.userId_param; // Admin ve todo, no se filtra por su ID
    } else {
      console.log(
        `Rol ID ${userRolId} no tiene una vista de 'mis asignaciones' definida, devolviendo vacío.`
      );
      return res.json([]);
    }

    connection = await getConnection();
    const result = await connection.execute(sqlQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener asignaciones de reservas');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error cerrando conexión en getMisAsignacionesDeReservas',
          err
        );
      }
    }
  }
};
