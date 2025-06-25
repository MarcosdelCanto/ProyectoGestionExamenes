// controllers/reserva.controller.js
import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  const details =
    error && error.message // Si hay un objeto error con mensaje
      ? error.message
      : error // Si hay un objeto error pero sin mensaje (raro, pero por si acaso)
        ? String(error)
        : message; // Si no hay objeto error, el 'message' principal es el detalle.
  res.status(statusCode).json({ error: message, details }); // 'details' ahora puede ser igual a 'message'
};

// Función helper para obtener una reserva completa por ID y emitirla por socket
// Función helper para obtener una reserva completa por ID y emitirla por socket
// --- INICIO DE LA CORRECCIÓN ---
// Esta función ahora es mucho más robusta y trae todos los datos necesarios.
const emitReservaActualizada = async (
  req,
  connection,
  reservaIdNum,
  actionOrigin = 'unknown'
) => {
  if (req.app.get('io') && reservaIdNum) {
    // Consulta SQL enriquecida que trae toda la información necesaria para el frontend.
    const sql = `
      SELECT
        r.ID_RESERVA, r.FECHA_RESERVA, r.ESTADO_CONFIRMACION_DOCENTE, r.OBSERVACIONES_DOCENTE, r.FECHA_CONFIRMACION_DOCENTE,
        e.ID_EXAMEN, e.NOMBRE_EXAMEN, e.CANTIDAD_MODULOS_EXAMEN,
        s.ID_SALA, s.NOMBRE_SALA,
        est.NOMBRE_ESTADO AS ESTADO_RESERVA,
        sec.NOMBRE_SECCION,
        a.NOMBRE_ASIGNATURA, -- <--- CAMPO CLAVE QUE FALTABA
        c.NOMBRE_CARRERA,
        (SELECT LISTAGG(u.NOMBRE_USUARIO, ', ') WITHIN GROUP (ORDER BY u.NOMBRE_USUARIO)
           FROM RESERVA_DOCENTES rd
           JOIN USUARIO u ON rd.USUARIO_ID_USUARIO = u.ID_USUARIO
           WHERE rd.RESERVA_ID_RESERVA = r.ID_RESERVA) AS NOMBRE_DOCENTE_ASIGNADO
      FROM RESERVA r
      JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
      JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
      JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
      JOIN SECCION sec ON e.SECCION_ID_SECCION = sec.ID_SECCION
      JOIN ASIGNATURA a ON sec.ASIGNATURA_ID_ASIGNATURA = a.ID_ASIGNATURA
      JOIN CARRERA c ON a.CARRERA_ID_CARRERA = c.ID_CARRERA
      WHERE r.ID_RESERVA = :id_param
    `;

    const result = await connection.execute(
      sql,
      { id_param: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      const reservaParaEmitir = result.rows[0];

      const modulosResult = await connection.execute(
        `SELECT m.ID_MODULO, m.NOMBRE_MODULO, m.INICIO_MODULO, m.FIN_MODULO, m.ORDEN
         FROM RESERVAMODULO rm
         JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO
         WHERE rm.RESERVA_ID_RESERVA = :reservaId_param
         ORDER BY m.ORDEN`,
        { reservaId_param: reservaIdNum },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      reservaParaEmitir.MODULOS = modulosResult.rows;
      // Añadimos MODULOS_IDS para consistencia con otras partes de la app
      reservaParaEmitir.MODULOS_IDS = modulosResult.rows
        .map((m) => m.ID_MODULO)
        .join(',');

      req.app
        .get('io')
        .emit('reservaActualizadaDesdeServidor', reservaParaEmitir);
      console.log(
        `[Socket.IO] Evento 'reservaActualizadaDesdeServidor' emitido para reserva #${reservaIdNum} desde ${actionOrigin}.`
      );
    }
  }
};
// --- FIN DE LA CORRECCIÓN ---

export const getAllReservas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se añade la subconsulta para obtener el nombre del docente asignado
    const result = await conn.execute(
      `SELECT r.ID_RESERVA, r.FECHA_RESERVA,
              e.ID_EXAMEN, e.NOMBRE_EXAMEN,
              s.ID_SALA, s.NOMBRE_SALA,
              est.ID_ESTADO, est.NOMBRE_ESTADO AS ESTADO_RESERVA,
              r.ESTADO_CONFIRMACION_DOCENTE, r.OBSERVACIONES_DOCENTE,
              (SELECT u.NOMBRE_USUARIO
               FROM RESERVA_DOCENTES rd
               JOIN USUARIO u ON rd.USUARIO_ID_USUARIO = u.ID_USUARIO
               WHERE rd.RESERVA_ID_RESERVA = r.ID_RESERVA AND ROWNUM = 1
              ) AS NOMBRE_DOCENTE_ASIGNADO
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       ORDER BY r.FECHA_RESERVA DESC, r.ID_RESERVA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // --- FIN DE LA MODIFICACIÓN ---
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
              r.ESTADO_CONFIRMACION_DOCENTE, r.OBSERVACIONES_DOCENTE, r.FECHA_CONFIRMACION_DOCENTE,
              (SELECT u.NOMBRE_USUARIO
                 FROM RESERVA_DOCENTES rd
                 JOIN USUARIO u ON rd.USUARIO_ID_USUARIO = u.ID_USUARIO
                 WHERE rd.RESERVA_ID_RESERVA = r.ID_RESERVA AND ROWNUM = 1
              ) AS NOMBRE_DOCENTE_ASIGNADO -- <-- CAMPO AÑADIDO
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       WHERE r.ID_RESERVA = :id_param`,
      { id_param: reservaIdNum },
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
    const {
      examen_id_examen,
      fecha_reserva,
      sala_id_sala,
      modulos_ids,
      docente_ids,
    } = req.body;

    // 1. Validación de campos obligatorios (se mantiene igual)
    if (
      !examen_id_examen ||
      !fecha_reserva ||
      !sala_id_sala ||
      !modulos_ids ||
      !Array.isArray(modulos_ids) || // CORREGIDO: Agregado operador lógico || que faltaba
      modulos_ids.length === 0 ||
      !docente_ids ||
      !Array.isArray(docente_ids) || // CORREGIDO: Agregado operador lógico || que faltaba
      docente_ids.length === 0
    ) {
      return handleError(
        res,
        null,
        'Faltan campos obligatorios: examen, fecha, sala, al menos un módulo y al menos un docente.',
        400
      );
    }

    connection = await getConnection();

    // 2. Obtener el ID del estado 'PROGRAMADO' (se mantiene igual)
    const estadoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'PROGRAMADO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const idEstadoProgramado = estadoResult.rows[0]?.ID_ESTADO;
    if (!idEstadoProgramado) {
      return handleError(
        res,
        null,
        "El estado 'PROGRAMADO' no se encuentra configurado.",
        500
      );
    }

    // --- Inicia la transacción ---

    // 3. Insertar en RESERVA (se mantiene igual)
    const fechaReservaCompleta = `${fecha_reserva} 00:00:00`;
    const reservaSql = `
      INSERT INTO RESERVA (ID_RESERVA, FECHA_RESERVA, SALA_ID_SALA, EXAMEN_ID_EXAMEN, ESTADO_ID_ESTADO, ESTADO_CONFIRMACION_DOCENTE)
      VALUES (RESERVA_SEQ.NEXTVAL, TO_TIMESTAMP(:fecha_reserva, 'YYYY-MM-DD HH24:MI:SS'), :sala_id, :examen_id, :estado_id, 'PENDIENTE')
      RETURNING ID_RESERVA INTO :new_reserva_id
    `;
    const resultReserva = await connection.execute(reservaSql, {
      fecha_reserva: fechaReservaCompleta,
      sala_id: parseInt(sala_id_sala),
      examen_id: parseInt(examen_id_examen),
      estado_id: idEstadoProgramado,
      new_reserva_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });
    const generatedReservaId = resultReserva.outBinds.new_reserva_id[0];
    if (!generatedReservaId)
      throw new Error('No se pudo generar el ID de la reserva.');

    // 4. Insertar en RESERVAMODULO (se mantiene igual)
    const reservamoduloSql = `INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA) VALUES (:modulo_id, :reserva_id)`;
    await connection.executeMany(
      reservamoduloSql,
      modulos_ids.map((moduloId) => ({
        modulo_id: parseInt(moduloId),
        reserva_id: generatedReservaId,
      }))
    );

    // 5. Insertar en RESERVA_DOCENTES , se mantiene igual)
    const reservaDocentesSql = `INSERT INTO RESERVA_DOCENTES (RESERVA_ID_RESERVA, USUARIO_ID_USUARIO) VALUES (:reserva_id, :docente_id)`;
    await connection.executeMany(
      reservaDocentesSql,
      docente_ids.map((docenteId) => ({
        reserva_id: generatedReservaId,
        docente_id: parseInt(docenteId),
      }))
    );

    // --- 6. (AÑADIDO) ACTUALIZAR EL ESTADO DEL EXAMEN A 'PROGRAMADO' ---
    console.log(
      `[reservaController] Actualizando estado del examen ${examen_id_examen} a PROGRAMADO.`
    );
    const updateExamenSql = `
        UPDATE EXAMEN
        SET ESTADO_ID_ESTADO = :estadoId
        WHERE ID_EXAMEN = :examenId
    `;
    await connection.execute(updateExamenSql, {
      estadoId: idEstadoProgramado, // Reutilizamos el ID que ya obtuvimos
      examenId: parseInt(examen_id_examen),
    });
    // --- FIN DEL BLOQUE AÑADIDO ---

    // 7. Confirmar toda la transacción
    await connection.commit();

    // Emitir evento de socket después del commit
    await emitReservaActualizada(
      req,
      connection,
      generatedReservaId,
      'crearReservaParaExamenExistente'
    );
    res.status(201).json({
      message: 'Reserva creada y examen programado exitosamente.',
      id_reserva: generatedReservaId,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    handleError(res, error, 'Error al crear la reserva completa');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
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
    // --- VALIDACIÓN: Verificar si el examen ya tiene una reserva ---
    conn = await getConnection(); // Obtener conexión antes de la validación
    const checkReservaExistenteSql = `
      SELECT COUNT(*) AS count FROM RESERVA WHERE EXAMEN_ID_EXAMEN = :examen_id_param
    `;
    const checkReservaExistenteResult = await conn.execute(
      checkReservaExistenteSql,
      { examen_id_param: parseInt(examen_id_examen) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (checkReservaExistenteResult.rows[0].COUNT > 0) {
      return handleError(
        res,
        null,
        'Este examen ya se encuentra asociado a una reserva.',
        400
      );
    }
    // --- FIN VALIDACIÓN ---
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
    // Emitir evento de socket después del commit
    await emitReservaActualizada(req, conn, newReservaId, 'createReserva');
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
  console.log('[actualizarConfirmacionDocente] Iniciando proceso.');
  try {
    const { idReserva } = req.params;
    console.log(
      `[actualizarConfirmacionDocente] idReserva del param: ${idReserva}`
    );

    const reservaIdNum = parseInt(idReserva, 10);
    if (isNaN(reservaIdNum)) {
      console.log(
        '[actualizarConfirmacionDocente] Error: ID de reserva no es un número.'
      );
      return handleError(
        res,
        null,
        'El ID de la reserva para confirmar no es válido.',
        400
      );
    }

    const { nuevoEstado, observaciones: nuevaObservacion } = req.body;
    console.log(
      `[actualizarConfirmacionDocente] Request body: nuevoEstado=${nuevoEstado}, nuevaObservacion (actual)=${nuevaObservacion}`
    );

    const idDocenteAutenticado = req.user.id_usuario;
    const nombreDocenteAutenticado = req.user.nombre_usuario; // Asumir que req.user tiene nombre_usuario
    const ROL_ID_DOCENTE = 2; // Asegúrate que este ID de rol sea el correcto

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
      console.log(
        `[actualizarConfirmacionDocente] Error: Rol de usuario no es DOCENTE. Rol ID: ${req.user.rol_id_rol}`
      );
      return handleError(
        res,
        null,
        'Acceso denegado. Se requiere rol de docente.',
        403
      );
    }

    console.log('[actualizarConfirmacionDocente] Obteniendo conexión a BD...');
    connection = await getConnection();
    // No es necesario BEGIN explícito
    console.log(
      '[actualizarConfirmacionDocente] Conexión obtenida. Ejecutando checkSql...'
    );
    const checkSql = `
      SELECT COUNT(*) AS COUNT
      FROM RESERVA_DOCENTES RD
      WHERE RD.RESERVA_ID_RESERVA = :idReserva_param
        AND RD.USUARIO_ID_USUARIO = :idDocenteAutenticado_param
    `;
    const checkResult = await connection.execute(
      checkSql,
      {
        idReserva_param: reservaIdNum,
        idDocenteAutenticado_param: idDocenteAutenticado,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(
      '[actualizarConfirmacionDocente] Resultado de checkSql:',
      checkResult.rows
    );

    if (!checkResult.rows[0] || checkResult.rows[0].COUNT === 0) {
      return handleError(
        res,
        null,
        'No autorizado para modificar esta reserva o la reserva no existe.',
        403
      );
    }

    // Obtener observaciones existentes para construir el historial
    console.log(
      '[actualizarConfirmacionDocente] Obteniendo observaciones existentes...'
    );
    const reservaActualResult = await connection.execute(
      `SELECT OBSERVACIONES_DOCENTE FROM RESERVA WHERE ID_RESERVA = :idReserva_param`,
      { idReserva_param: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(
      '[actualizarConfirmacionDocente] Resultado de observaciones existentes:',
      reservaActualResult.rows
    );
    let observacionesExistentes = // Cambiado a let para poder modificarlo
      reservaActualResult.rows[0]?.OBSERVACIONES_DOCENTE || '';

    let observacionesParaGuardar = observacionesExistentes;
    if (nuevaObservacion && nuevaObservacion.trim() !== '') {
      const fechaActual = new Date().toLocaleString('es-CL', {
        // Formato de fecha localizado
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const autorObservacion =
        nombreDocenteAutenticado || `Docente ID ${idDocenteAutenticado}`;
      const entradaHistorial = `[${fechaActual} - ${autorObservacion}]: ${nuevaObservacion.trim()}`;
      observacionesParaGuardar = observacionesExistentes
        ? `${entradaHistorial}\n${observacionesExistentes}` // Nueva observación al principio para fácil lectura
        : entradaHistorial;
    }
    console.log(
      '[actualizarConfirmacionDocente] Observaciones finales para guardar (historial):',
      observacionesParaGuardar
    );

    let idEstadoGeneralReservaParaUpdate = null;
    if (nuevoEstado.trim() === 'CONFIRMADO') {
      // Usar trim()
      console.log(
        "[actualizarConfirmacionDocente] nuevoEstado es CONFIRMADO, buscando ID de estado general 'CONFIRMADO'..."
      );
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
          "[actualizarConfirmacionDocente] ADVERTENCIA: Estado general 'CONFIRMADO' no encontrado en tabla ESTADO."
        );
        console.warn(
          "Estado general 'CONFIRMADO' no encontrado en tabla ESTADO. ESTADO_ID_ESTADO de la reserva no se cambiará."
        );
      }
    }

    let setClauseEstadoGeneral = '';
    const updateParams = {
      nuevoEstado_param: nuevoEstado.trim(), // Usar trim()
      observaciones_param: observacionesParaGuardar, // Guardar el historial concatenado
      idReserva_param: reservaIdNum,
    };

    if (idEstadoGeneralReservaParaUpdate !== null) {
      setClauseEstadoGeneral = ', ESTADO_ID_ESTADO = :idEstadoGeneral_param';
      updateParams.idEstadoGeneral_param = idEstadoGeneralReservaParaUpdate;
    }

    console.log(
      '[actualizarConfirmacionDocente] Ejecutando UPDATE en RESERVA con params:',
      updateParams
    );
    const updateSql = `
      UPDATE RESERVA SET
        ESTADO_CONFIRMACION_DOCENTE = :nuevoEstado_param,
        OBSERVACIONES_DOCENTE = :observaciones_param,
        FECHA_CONFIRMACION_DOCENTE = SYSTIMESTAMP
        ${setClauseEstadoGeneral}
      WHERE ID_RESERVA = :idReserva_param
    `;

    const result = await connection.execute(updateSql, updateParams);
    console.log(
      '[actualizarConfirmacionDocente] Resultado del UPDATE:',
      result
    );

    if (result.rowsAffected === 0) {
      console.log(
        '[actualizarConfirmacionDocente] Error: No se afectaron filas en el UPDATE.'
      );
      // No se necesita rollback aquí si no hubo otras DML en esta transacción antes que esta falle
      return handleError(
        res,
        null,
        'No se pudo actualizar la reserva (no se afectaron filas).',
        404
      );
    }

    console.log('[actualizarConfirmacionDocente] Haciendo commit...');
    await connection.commit();
    console.log(
      '[actualizarConfirmacionDocente] Commit exitoso. Enviando respuesta JSON...'
    );

    // Emitir evento de Socket.IO a todos los clientes
    // La llamada a emitReservaActualizada ya estaba correctamente aquí en el código proporcionado.
    // Solo me aseguro de que esté después del commit y antes de la respuesta.
    await emitReservaActualizada(
      req,
      connection,
      reservaIdNum,
      'actualizarConfirmacionDocente'
    );

    res.json({
      message: `Reserva ${reservaIdNum} actualizada a estado ${nuevoEstado.trim()} por el docente.`,
    });
  } catch (error) {
    if (connection) {
      console.error(
        '[actualizarConfirmacionDocente] Error en try-catch, intentando rollback...',
        error
      );
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
        console.log(
          '[actualizarConfirmacionDocente] Cerrando conexión en finally...'
        );
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

/**
 * Obtiene las asignaciones de reservas para el usuario logueado.
 * La lógica ahora se basa en el ID del rol para mostrar la información pertinente.
 */
export const getMisAsignacionesDeReservas = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id_usuario;
    const userRolId = req.user.rol_id_rol; // Se usa el ID del rol desde el token

    // Definición de los IDs de los roles
    const ID_ROL_ALUMNO = 3;
    const ID_ROL_DOCENTE = 2;
    const ID_ROL_COORDINADOR_CARRERA = 17;
    const ID_ROL_JEFE_CARRERA = 16;
    const ID_ROL_COORDINADOR_DOCENTE = 18;
    const ID_ROL_ADMIN = 1;

    const ROLES_POR_CARRERA = [
      ID_ROL_COORDINADOR_CARRERA,
      ID_ROL_JEFE_CARRERA,
      ID_ROL_COORDINADOR_DOCENTE,
    ];

    let sqlQuery;
    const params = { userId_param: userId };

    // --- Consulta Base Enriquecida ---
    let baseSelect = `
      SELECT DISTINCT
        R.ID_RESERVA, R.FECHA_RESERVA,
        R.ESTADO_CONFIRMACION_DOCENTE, R.OBSERVACIONES_DOCENTE, R.FECHA_CONFIRMACION_DOCENTE,
        E.ID_EXAMEN, E.NOMBRE_EXAMEN, E.CANTIDAD_MODULOS_EXAMEN, /* <-- Añadido para el formulario de edición */
        SEC.ID_SECCION, SEC.NOMBRE_SECCION,
        A.ID_ASIGNATURA, A.NOMBRE_ASIGNATURA,
        C.ID_CARRERA, C.NOMBRE_CARRERA,
        ESC.ID_ESCUELA, ESC.NOMBRE_ESCUELA,
        SE.ID_SEDE, SE.NOMBRE_SEDE,
        J.ID_JORNADA, J.NOMBRE_JORNADA,
        SL.ID_SALA, SL.NOMBRE_SALA,
        ED.NOMBRE_EDIFICIO,
        EST_R.NOMBRE_ESTADO AS ESTADO_RESERVA,
        (SELECT USR.ID_USUARIO FROM RESERVA_DOCENTES RD JOIN USUARIO USR ON RD.USUARIO_ID_USUARIO = USR.ID_USUARIO WHERE RD.RESERVA_ID_RESERVA = R.ID_RESERVA AND ROWNUM = 1) AS ID_DOCENTE_PRINCIPAL,
        (SELECT USR.NOMBRE_USUARIO FROM RESERVA_DOCENTES RD JOIN USUARIO USR ON RD.USUARIO_ID_USUARIO = USR.ID_USUARIO WHERE RD.RESERVA_ID_RESERVA = R.ID_RESERVA AND ROWNUM = 1) AS NOMBRE_DOCENTE_PRINCIPAL,
        (SELECT MIN(M.INICIO_MODULO) FROM RESERVAMODULO RM_MIN JOIN MODULO M ON RM_MIN.MODULO_ID_MODULO = M.ID_MODULO WHERE RM_MIN.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_INICIO,
        (SELECT MAX(M.FIN_MODULO) FROM RESERVAMODULO RM_MAX JOIN MODULO M ON RM_MAX.MODULO_ID_MODULO = M.ID_MODULO WHERE RM_MAX.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_FIN,
        (SELECT LISTAGG(RM_LIST.MODULO_ID_MODULO, ',') WITHIN GROUP (ORDER BY RM_LIST.MODULO_ID_MODULO) FROM RESERVAMODULO RM_LIST WHERE RM_LIST.RESERVA_ID_RESERVA = R.ID_RESERVA) AS MODULOS_IDS_STRING,
        (SELECT LISTAGG(M.NOMBRE_MODULO || ' (' || M.INICIO_MODULO || ' - ' || M.FIN_MODULO || ')', '; ')
           WITHIN GROUP (ORDER BY M.ORDEN)
         FROM RESERVAMODULO RM_DET
         JOIN MODULO M ON RM_DET.MODULO_ID_MODULO = M.ID_MODULO
         WHERE RM_DET.RESERVA_ID_RESERVA = R.ID_RESERVA) AS MODULOS_DETALLES_STRING /* <-- Añadido para nombres y horarios de módulos */
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN CARRERA C ON A.CARRERA_ID_CARRERA = C.ID_CARRERA
      JOIN ESCUELA ESC ON C.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
      JOIN SEDE SE ON ESC.SEDE_ID_SEDE = SE.ID_SEDE
      JOIN JORNADA J ON SEC.JORNADA_ID_JORNADA = J.ID_JORNADA
      JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA
      JOIN EDIFICIO ED ON SL.EDIFICIO_ID_EDIFICIO = ED.ID_EDIFICIO
      JOIN ESTADO EST_R ON R.ESTADO_ID_ESTADO = EST_R.ID_ESTADO
    `;

    // Lógica de filtrado por rol
    if (userRolId === ID_ROL_ALUMNO) {
      sqlQuery = `
        ${baseSelect}
        JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
        WHERE US.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'
              AND EST_R.NOMBRE_ESTADO != 'DESCARTADO'
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')
        ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (userRolId === ID_ROL_DOCENTE) {
      // Se une con RESERVA_DOCENTES para asegurar que el docente esté asignado a la reserva
      sqlQuery = `
        ${baseSelect}
        JOIN RESERVA_DOCENTES RD ON R.ID_RESERVA = RD.RESERVA_ID_RESERVA
        WHERE RD.USUARIO_ID_USUARIO = :userId_param
            AND EST_R.NOMBRE_ESTADO != 'DESCARTADO'
        ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (ROLES_POR_CARRERA.includes(userRolId)) {
      sqlQuery = `
        ${baseSelect}
        JOIN USUARIOCARRERA UC ON C.ID_CARRERA = UC.CARRERA_ID_CARRERA
        WHERE UC.USUARIO_ID_USUARIO = :userId_param
            AND EST_R.NOMBRE_ESTADO != 'DESCARTADO'
        ORDER BY C.NOMBRE_CARRERA, R.FECHA_RESERVA DESC, HORA_INICIO ASC
      `;
    } else if (userRolId === ID_ROL_ADMIN) {
      sqlQuery = `${baseSelect} WHERE EST_R.NOMBRE_ESTADO != 'DESCARTADO' ORDER BY R.FECHA_RESERVA DESC, HORA_INICIO ASC`;
      delete params.userId_param; // Admin ve todo
    } else {
      return res.json([]); // Otros roles no ven nada
    }

    connection = await getConnection();
    const result = await connection.execute(sqlQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    // Procesar las filas para convertir MODULOS_IDS_STRING y MODULOS_DETALLES_STRING
    const reservasConDetalles = result.rows.map((row) => ({
      ...row,
      MODULOS_IDS_ARRAY: row.MODULOS_IDS_STRING
        ? row.MODULOS_IDS_STRING.split(',').map(Number)
        : [],
      MODULOS_NOMBRES_ARRAY: row.MODULOS_DETALLES_STRING // Para el frontend MisReservasAsignadasPage
        ? row.MODULOS_DETALLES_STRING.split('; ')
        : [],
    }));

    res.json(reservasConDetalles);
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
/**
 * Actualiza una reserva existente.
 * Primero elimina las asociaciones de módulos antiguos y luego inserta los nuevos.
 */
export const updateReserva = async (req, res) => {
  const { id } = req.params; // El ID de la reserva a editar

  console.log(
    `[Backend updateReserva] Received update request for reserva ID: ${id}`
  );
  console.log('[Backend updateReserva] Request body:', req.body);

  const reservaIdNum = parseInt(id, 10); // Convertir a número aquí

  // Datos que vienen del formulario
  const { fecha_reserva, sala_id_sala, modulos_ids, docente_ids } = req.body;
  if (isNaN(reservaIdNum)) {
    // Usar reservaIdNum para la validación
    return handleError(
      res,
      new Error('ID de reserva no válido'),
      'ID de reserva inválido',
      400
    );
  }

  // Validaciones
  if (
    !fecha_reserva ||
    !sala_id_sala ||
    !modulos_ids ||
    !Array.isArray(modulos_ids) || // CORREGIDO: Agregado operador lógico || que faltaba
    modulos_ids.length === 0 ||
    !docente_ids || // Check if docente_ids is provided
    !Array.isArray(docente_ids) || // CORREGIDO: Agregado operador lógico || que faltaba
    docente_ids.length === 0
  ) {
    return handleError(
      res,
      new Error('Datos incompletos'),
      'Faltan campos obligatorios: fecha, sala, módulos o docente.', // Corrected message
      400
    );
  }

  let connection;
  try {
    connection = await getConnection();

    // --- Inicia la transacción ---

    // 1. Actualiza la tabla principal RESERVA con la nueva fecha y sala
    const updateReservaSql = `
      UPDATE RESERVA SET
        FECHA_RESERVA = TO_DATE(:fecha_reserva, 'YYYY-MM-DD'),
        SALA_ID_SALA = :sala_id_sala,
        ESTADO_CONFIRMACION_DOCENTE = 'PENDIENTE', -- Resetear estado para revisión del docente. Las observaciones del docente se mantienen.
        FECHA_CONFIRMACION_DOCENTE = NULL -- Limpiar fecha de confirmación previa
      WHERE ID_RESERVA = :reservaId
    `;
    await connection.execute(updateReservaSql, {
      fecha_reserva: fecha_reserva,
      sala_id_sala: parseInt(sala_id_sala),
      reservaId: reservaIdNum, // Usar el ID numérico
    });

    // 2. Libera/Borra TODOS los módulos asociados anteriormente a esta reserva
    console.log(
      `[updateReserva] Liberando módulos antiguos para la reserva #${reservaIdNum}`
    );
    const deleteModulosSql = `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reservaId`;
    await connection.execute(deleteModulosSql, { reservaId: reservaIdNum }); // Usar el ID numérico

    // 3. Inserta las NUEVAS asociaciones de módulos
    console.log(
      `[updateReserva] Insertando ${modulos_ids.length} nuevos módulos para la reserva #${reservaIdNum}`
    );
    const insertModulosSql = `
      INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
      VALUES (:modulo_id, :reserva_id)
    `;
    const binds = modulos_ids.map((moduloId) => ({
      modulo_id: parseInt(moduloId), // Asegurar que el ID del módulo también sea número
      reserva_id: reservaIdNum, // Usar el ID numérico de la reserva
    }));

    if (binds.length > 0) {
      await connection.executeMany(insertModulosSql, binds);
    }
    // --- AÑADE ESTA LÓGICA PARA ACTUALIZAR EL DOCENTE ---
    // 1. Borra la asociación de docente(s) anterior(es)
    await connection.execute(
      `DELETE FROM RESERVA_DOCENTES WHERE RESERVA_ID_RESERVA = :reservaId`,
      { reservaId: reservaIdNum } // Usar el ID numérico
    );
    // 2. Inserta la nueva asociación de docente
    if (docente_ids && docente_ids.length > 0) {
      await connection.execute(
        `INSERT INTO RESERVA_DOCENTES (RESERVA_ID_RESERVA, USUARIO_ID_USUARIO) VALUES (:reservaId, :docenteId)`,
        { reservaId: reservaIdNum, docenteId: parseInt(docente_ids[0]) } // Usar ID numérico y parsear docenteId
      );
    }
    // --- FIN DE LA LÓGICA DE DOCENTE ---

    // 4. Confirma toda la transacción
    await connection.commit();

    // Emitir evento de socket después del commit
    await emitReservaActualizada(
      req,
      connection,
      reservaIdNum,
      'updateReserva'
    );
    res.status(200).json({ message: 'Reserva actualizada exitosamente.' });
  } catch (err) {
    if (connection) await connection.rollback();
    handleError(res, err, 'Error al actualizar la reserva');
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
export const descartarReserva = async (req, res) => {
  const { idReserva } = req.params;
  const reservaIdNum = parseInt(idReserva, 10);

  console.log(
    `[descartarReserva] Solicitud para descartar reserva ID: ${reservaIdNum}`
  );

  if (isNaN(reservaIdNum)) {
    return handleError(res, null, 'ID de reserva inválido.', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // 1. Obtener información de la reserva y su examen asociado
    const reservaInfo = await connection.execute(
      `SELECT
        R.ID_RESERVA,
        R.EXAMEN_ID_EXAMEN,
        R.ESTADO_CONFIRMACION_DOCENTE,
        E.ESTADO_ID_ESTADO AS EXAMEN_ESTADO
       FROM
        RESERVA R
       JOIN
        EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
       WHERE
        R.ID_RESERVA = :reservaId`,
      { reservaId: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (reservaInfo.rows.length === 0) {
      return handleError(res, null, 'Reserva no encontrada.', 404);
    }

    const examenId = reservaInfo.rows[0].EXAMEN_ID_EXAMEN;
    console.log(
      `[descartarReserva] Examen asociado: ${examenId}, Estado actual: ${reservaInfo.rows[0].ESTADO_CONFIRMACION_DOCENTE}`
    );

    // 2. Obtener IDs de estados necesarios
    const estadoDescartadoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'DESCARTADO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const idEstadoDescartado = estadoDescartadoResult.rows[0]?.ID_ESTADO;

    const estadoActivoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'ACTIVO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const idEstadoActivo = estadoActivoResult.rows[0]?.ID_ESTADO;

    if (!idEstadoDescartado || !idEstadoActivo) {
      return handleError(
        res,
        null,
        'Estados no configurados correctamente.',
        500
      );
    }

    // 3. Iniciar transacción
    console.log(
      `[descartarReserva] Eliminando módulos asociados a la reserva ${reservaIdNum}`
    );

    // 3.1. Eliminar registros en RESERVAMODULO
    await connection.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reservaId`,
      { reservaId: reservaIdNum }
    );

    // 3.2. Actualizar la reserva a DESCARTADO (AMBOS campos)
    console.log(
      `[descartarReserva] Actualizando RESERVA ${reservaIdNum} a estado DESCARTADO`
    );
    await connection.execute(
      `UPDATE RESERVA SET
       ESTADO_ID_ESTADO = :idEstadoDescartado,
       ESTADO_CONFIRMACION_DOCENTE = 'DESCARTADO'
       WHERE ID_RESERVA = :reservaId`,
      { idEstadoDescartado, reservaId: reservaIdNum }
    );

    // 3.3. IMPORTANTE: Actualizar el examen a ACTIVO
    console.log(
      `[descartarReserva] Actualizando EXAMEN ${examenId} a estado ACTIVO (${idEstadoActivo})`
    );
    await connection.execute(
      `UPDATE EXAMEN
       SET ESTADO_ID_ESTADO = :idEstadoActivo
       WHERE ID_EXAMEN = :examenId`,
      { idEstadoActivo, examenId }
    );

    // 4. Confirmar transacción
    await connection.commit();

    // Emitir evento de socket después del commit
    await emitReservaActualizada(
      req,
      connection,
      reservaIdNum,
      'descartarReserva'
    );
    console.log(
      `[descartarReserva] Reserva ${reservaIdNum} descartada y examen ${examenId} reactivado exitosamente`
    );

    // 5. Responder con éxito y datos útiles
    res.json({
      message: 'Reserva descartada y examen reactivado exitosamente.',
      reserva_id: reservaIdNum,
      examen_id: examenId,
      estado_reserva: 'DESCARTADO',
      estado_examen: 'ACTIVO',
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    console.error('Error descartando reserva:', error);
    return handleError(res, error, 'Error al descartar la reserva.');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error cerrando conexión:', closeError);
      }
    }
  }
};

/**
 * Crea una reserva completa (Reserva + ReservaModulos + ReservaDocentes) para un examen existente
 * con estado inicial 'PROGRAMADO' y ESTADO_CONFIRMACION_DOCENTE = 'EN_CURSO'.
 * Este flujo está centrado en el estado de confirmación docente como indicador principal.
 * @param {Object} req - Request object con { examen_id_examen, fecha_reserva, sala_id_sala, modulos_ids, docente_ids }
 * @param {Object} res - Response object
 */
export const crearReservaEnCurso = async (req, res) => {
  let connection;
  try {
    const {
      examen_id_examen,
      fecha_reserva,
      sala_id_sala,
      modulos_ids,
      docente_ids,
    } = req.body;

    console.log(`[crearReservaEnCurso] Creando reserva con flujo EN_CURSO`);

    // 1. Validación de campos obligatorios
    if (
      !examen_id_examen ||
      !fecha_reserva ||
      !sala_id_sala ||
      !modulos_ids ||
      modulos_ids.length === 0 ||
      !docente_ids ||
      docente_ids.length === 0
    ) {
      return handleError(
        res,
        null,
        'Faltan campos obligatorios: examen, fecha, sala, al menos un módulo y al menos un docente.',
        400
      );
    }

    connection = await getConnection();

    // 2. Obtener el ID del estado 'PROGRAMADO' para la reserva y el examen
    const estadoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'PROGRAMADO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const idEstadoProgramado = estadoResult.rows[0]?.ID_ESTADO;
    if (!idEstadoProgramado) {
      return handleError(
        res,
        null,
        'El estado PROGRAMADO no se encuentra configurado en la base de datos.',
        500
      );
    }

    console.log(
      `[crearReservaEnCurso] ID del estado PROGRAMADO: ${idEstadoProgramado}`
    );

    // 3. Verificar que el examen no tenga ya una reserva activa
    const reservaExistenteResult = await connection.execute(
      `SELECT COUNT(*) AS COUNT
       FROM RESERVA R
       JOIN ESTADO E ON R.ESTADO_ID_ESTADO = E.ID_ESTADO
       WHERE R.EXAMEN_ID_EXAMEN = :examen_id
       AND E.NOMBRE_ESTADO NOT IN ('DESCARTADO', 'CANCELADO')`,
      { examen_id: parseInt(examen_id_examen) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (reservaExistenteResult.rows[0].COUNT > 0) {
      return handleError(
        res,
        null,
        'Este examen ya tiene una reserva activa. No se puede crear otra reserva.',
        400
      );
    }

    // --- Inicia la transacción ---

    // 4. Insertar en RESERVA con estado PROGRAMADO y confirmación EN_CURSO
    const fechaReservaCompleta = `${fecha_reserva} 00:00:00`;
    const reservaSql = `
      INSERT INTO RESERVA (
        ID_RESERVA,
        FECHA_RESERVA,
        SALA_ID_SALA,
        EXAMEN_ID_EXAMEN,
        ESTADO_ID_ESTADO,
        ESTADO_CONFIRMACION_DOCENTE
      )
      VALUES (
        RESERVA_SEQ.NEXTVAL,
        TO_TIMESTAMP(:fecha_reserva, 'YYYY-MM-DD HH24:MI:SS'),
        :sala_id,
        :examen_id,
        :estado_id,
        'EN_CURSO'
      )
      RETURNING ID_RESERVA INTO :new_reserva_id
    `;

    const resultReserva = await connection.execute(reservaSql, {
      fecha_reserva: fechaReservaCompleta,
      sala_id: parseInt(sala_id_sala),
      examen_id: parseInt(examen_id_examen),
      estado_id: idEstadoProgramado,
      new_reserva_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });

    const generatedReservaId = resultReserva.outBinds.new_reserva_id[0];
    if (!generatedReservaId) {
      throw new Error('No se pudo generar el ID de la reserva.');
    }

    console.log(
      `[crearReservaEnCurso] Reserva creada con ID: ${generatedReservaId}`
    );
    console.log(
      `[crearReservaEnCurso] Estado reserva: PROGRAMADO, Confirmación docente: EN_CURSO`
    );

    // 5. Insertar módulos en RESERVAMODULO
    const reservamoduloSql = `
      INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
      VALUES (:modulo_id, :reserva_id)
    `;
    await connection.executeMany(
      reservamoduloSql,
      modulos_ids.map((moduloId) => ({
        modulo_id: parseInt(moduloId),
        reserva_id: generatedReservaId,
      }))
    );

    console.log(
      `[crearReservaEnCurso] ${modulos_ids.length} módulos insertados`
    );

    // 6. Insertar docentes en RESERVA_DOCENTES
    const reservaDocentesSql = `
      INSERT INTO RESERVA_DOCENTES (RESERVA_ID_RESERVA, USUARIO_ID_USUARIO)
      VALUES (:reserva_id, :docente_id)
    `;
    await connection.executeMany(
      reservaDocentesSql,
      docente_ids.map((docenteId) => ({
        reserva_id: generatedReservaId,
        docente_id: parseInt(docenteId),
      }))
    );

    console.log(
      `[crearReservaEnCurso] ${docente_ids.length} docentes asignados`
    );

    // 7. Actualizar estado del examen a PROGRAMADO
    const updateExamenSql = `
      UPDATE EXAMEN
      SET ESTADO_ID_ESTADO = :estadoId
      WHERE ID_EXAMEN = :examenId
    `;
    await connection.execute(updateExamenSql, {
      estadoId: idEstadoProgramado,
      examenId: parseInt(examen_id_examen),
    });

    console.log(
      `[crearReservaEnCurso] Estado del examen actualizado a PROGRAMADO`
    );

    // 8. Confirmar transacción
    await connection.commit();

    console.log(`[crearReservaEnCurso] Transacción completada exitosamente`);
    // Emitir evento de socket después del commit
    await emitReservaActualizada(
      req,
      connection,
      generatedReservaId,
      'crearReservaEnCurso'
    );

    res.status(201).json({
      message: 'Reserva creada exitosamente con flujo EN_CURSO.',
      id_reserva: generatedReservaId,
      estado_reserva: 'PROGRAMADO',
      estado_confirmacion_docente: 'EN_CURSO',
      estado_examen: 'PROGRAMADO',
      detalles: {
        examen_id: parseInt(examen_id_examen),
        fecha_reserva: fecha_reserva,
        sala_id: parseInt(sala_id_sala),
        modulos_count: modulos_ids.length,
        docentes_count: docente_ids.length,
      },
      flujo_info: {
        descripcion: 'Reserva en flujo centrado en confirmación docente',
        estado_inicial: 'EN_CURSO',
        siguientes_estados: ['PENDIENTE', 'DESCARTADO'],
      },
    });
  } catch (error) {
    if (connection) {
      console.error(`[crearReservaEnCurso] Error, haciendo rollback:`, error);
      await connection.rollback();
    }
    handleError(res, error, 'Error al crear la reserva en curso');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
      }
    }
  }
};

/**
 * Cambia el estado de confirmación docente de EN_CURSO a PENDIENTE
 * Esto envía la reserva a la bandeja del docente para confirmación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const enviarReservaADocente = async (req, res) => {
  let connection;
  try {
    const { idReserva } = req.params;
    const { nuevaCantidadModulos, docente_id } = req.body; // ← AGREGAR docente_id

    console.log(
      `[Backend Ctrl: enviarReservaADocente] Solicitud para reserva ${idReserva}. Payload: módulos=${nuevaCantidadModulos}, docente=${docente_id}`
    );

    const reservaIdNum = parseInt(idReserva, 10);

    if (isNaN(reservaIdNum)) {
      return handleError(res, null, 'ID de reserva inválido.', 400);
    }

    console.log(
      `[enviarReservaADocente] Enviando reserva ${reservaIdNum} a docente`
    );

    connection = await getConnection();

    // Verificar que la reserva existe y está en estado EN_CURSO
    const reservaActualResult = await connection.execute(
      `SELECT r.ESTADO_CONFIRMACION_DOCENTE, r.EXAMEN_ID_EXAMEN, COUNT(rm.MODULO_ID_MODULO) AS MODULOS_ACTUALES
       FROM RESERVA r
       LEFT JOIN RESERVAMODULO rm ON r.ID_RESERVA = rm.RESERVA_ID_RESERVA
       WHERE r.ID_RESERVA = :reserva_id
       GROUP BY r.ESTADO_CONFIRMACION_DOCENTE, r.EXAMEN_ID_EXAMEN, r.ID_RESERVA`,
      { reserva_id: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (reservaActualResult.rows.length === 0) {
      return handleError(res, null, 'Reserva no encontrada', 404);
    }

    const estadoActual =
      reservaActualResult.rows[0].ESTADO_CONFIRMACION_DOCENTE;
    const modulosActualesCount = reservaActualResult.rows[0].MODULOS_ACTUALES;

    if (estadoActual !== 'EN_CURSO') {
      return handleError(
        res,
        null,
        `No se puede enviar a docente. Estado actual: ${estadoActual}`,
        400
      );
    }

    // **NUEVA LÓGICA: Actualizar docente asignado**
    if (docente_id) {
      console.log(
        `[enviarReservaADocente] Asignando docente ${docente_id} a reserva ${reservaIdNum}`
      );

      // 1. Eliminar docente anterior (si existe)
      await connection.execute(
        `DELETE FROM RESERVA_DOCENTES WHERE RESERVA_ID_RESERVA = :reserva_id`,
        { reserva_id: reservaIdNum }
      );

      // 2. Insertar nuevo docente
      await connection.execute(
        `INSERT INTO RESERVA_DOCENTES (RESERVA_ID_RESERVA, USUARIO_ID_USUARIO) VALUES (:reserva_id, :docente_id)`,
        {
          reserva_id: reservaIdNum,
          docente_id: parseInt(docente_id),
        }
      );

      console.log(
        `[enviarReservaADocente] Docente ${docente_id} asignado exitosamente`
      );
    }

    // **LÓGICA EXISTENTE DE ACTUALIZACIÓN DE MÓDULOS - RESTAURADA COMPLETA**
    if (
      nuevaCantidadModulos !== undefined &&
      nuevaCantidadModulos !== modulosActualesCount
    ) {
      console.log(
        `[enviarReservaADocente] Actualizando módulos de ${modulosActualesCount} a ${nuevaCantidadModulos}`
      );

      // Validar que la nueva cantidad sea válida
      if (nuevaCantidadModulos < 1 || nuevaCantidadModulos > 12) {
        return handleError(
          res,
          null,
          'La cantidad de módulos debe estar entre 1 y 12',
          400
        );
      }

      // Obtener información de la reserva para generar la nueva secuencia de módulos
      const infoReservaResult = await connection.execute(
        `SELECT r.FECHA_RESERVA, r.SALA_ID_SALA,
                MIN(rm.MODULO_ID_MODULO) as PRIMER_MODULO_ID
         FROM RESERVA r
         LEFT JOIN RESERVAMODULO rm ON r.ID_RESERVA = rm.RESERVA_ID_RESERVA
         WHERE r.ID_RESERVA = :reserva_id
         GROUP BY r.FECHA_RESERVA, r.SALA_ID_SALA`,
        { reserva_id: reservaIdNum },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (infoReservaResult.rows.length === 0) {
        return handleError(
          res,
          null,
          'No se encontró información de la reserva',
          404
        );
      }

      const { FECHA_RESERVA, SALA_ID_SALA, PRIMER_MODULO_ID } =
        infoReservaResult.rows[0];

      // Obtener el orden del primer módulo actual
      const ordenPrimerModuloResult = await connection.execute(
        `SELECT ORDEN FROM MODULO WHERE ID_MODULO = :modulo_id`,
        { modulo_id: PRIMER_MODULO_ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (ordenPrimerModuloResult.rows.length === 0) {
        return handleError(res, null, 'No se encontró el módulo inicial', 404);
      }

      const ordenInicial = ordenPrimerModuloResult.rows[0].ORDEN;

      // Generar IDs de los nuevos módulos
      const nuevosModulosResult = await connection.execute(
        `SELECT ID_MODULO, ORDEN, NOMBRE_MODULO
         FROM MODULO
         WHERE ORDEN >= :orden_inicial
         AND ORDEN < :orden_final
         ORDER BY ORDEN`,
        {
          orden_inicial: ordenInicial,
          orden_final: ordenInicial + nuevaCantidadModulos,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (nuevosModulosResult.rows.length !== nuevaCantidadModulos) {
        return handleError(
          res,
          null,
          `No hay suficientes módulos consecutivos disponibles. Se encontraron ${nuevosModulosResult.rows.length} de ${nuevaCantidadModulos} requeridos`,
          400
        );
      }

      const nuevosModulosIds = nuevosModulosResult.rows.map(
        (row) => row.ID_MODULO
      );

      // Verificar conflictos con otras reservas
      const conflictosResult = await connection.execute(
        `SELECT COUNT(*) as CONFLICTOS
         FROM RESERVAMODULO rm
         JOIN RESERVA r ON rm.RESERVA_ID_RESERVA = r.ID_RESERVA
         WHERE rm.MODULO_ID_MODULO IN (${nuevosModulosIds.map((_, index) => `:modulo_id_${index}`).join(',')})
         AND r.FECHA_RESERVA = :fecha_reserva
         AND r.SALA_ID_SALA = :sala_id
         AND r.ID_RESERVA != :reserva_id
         AND r.ESTADO_CONFIRMACION_DOCENTE != 'DESCARTADO'`,
        {
          ...nuevosModulosIds.reduce((acc, id, index) => {
            acc[`modulo_id_${index}`] = id;
            return acc;
          }, {}),
          fecha_reserva: FECHA_RESERVA,
          sala_id: SALA_ID_SALA,
          reserva_id: reservaIdNum,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (conflictosResult.rows[0].CONFLICTOS > 0) {
        return handleError(
          res,
          null,
          'Conflicto detectado: Los nuevos módulos ya están ocupados por otra reserva',
          409
        );
      }

      // Eliminar módulos actuales
      await connection.execute(
        `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reserva_id`,
        { reserva_id: reservaIdNum }
      );

      // Insertar nuevos módulos
      const insertModulosSql = `
        INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA)
        VALUES (:modulo_id, :reserva_id)
      `;

      for (const moduloId of nuevosModulosIds) {
        await connection.execute(insertModulosSql, {
          modulo_id: moduloId,
          reserva_id: reservaIdNum,
        });
      }

      console.log(
        `[enviarReservaADocente] Módulos actualizados exitosamente. Nuevos módulos: ${nuevosModulosIds.join(', ')}`
      );
    }

    // Actualizar estado a PENDIENTE
    const updateSql = `
      UPDATE RESERVA
      SET ESTADO_CONFIRMACION_DOCENTE = 'PENDIENTE'
      WHERE ID_RESERVA = :reserva_id
    `;

    const result = await connection.execute(updateSql, {
      reserva_id: reservaIdNum,
    });

    if (result.rowsAffected === 0) {
      return handleError(res, null, 'No se pudo actualizar la reserva', 404);
    }

    await connection.commit();

    console.log(
      `[enviarReservaADocente] Reserva ${reservaIdNum} enviada a docente exitosamente`
    );

    // Emitir evento de socket después del commit
    await emitReservaActualizada(
      req,
      connection,
      reservaIdNum,
      'enviarReservaADocente'
    );

    res.status(200).json({
      message: 'Reserva enviada a docente para confirmación',
      id_reserva: reservaIdNum,
      nuevo_estado: 'PENDIENTE',
      modulos_actualizados:
        nuevaCantidadModulos !== undefined &&
        nuevaCantidadModulos !== modulosActualesCount,
      nueva_cantidad_modulos: nuevaCantidadModulos || modulosActualesCount,
      docente_asignado: docente_id || null,
    });
  } catch (error) {
    if (connection) {
      console.error(`[enviarReservaADocente] Error, haciendo rollback:`, error);
      await connection.rollback();
    }
    handleError(res, error, 'Error al enviar reserva a docente');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
      }
    }
  }
};

/**
 * Cancela una reserva completa, vuelve el examen a estado ACTIVO
 * y emite un evento de socket para notificar a los clientes.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const cancelarReservaCompleta = async (req, res) => {
  let connection;
  try {
    const { idReserva } = req.params;
    const reservaIdNum = parseInt(idReserva, 10);

    if (isNaN(reservaIdNum)) {
      return handleError(res, null, 'ID de reserva inválido.', 400);
    }

    console.log(`[cancelarReservaCompleta] Cancelando reserva ${reservaIdNum}`);

    connection = await getConnection();

    const examenResult = await connection.execute(
      `SELECT EXAMEN_ID_EXAMEN FROM RESERVA WHERE ID_RESERVA = :reserva_id`,
      { reserva_id: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (examenResult.rows.length === 0) {
      return handleError(res, null, 'Reserva no encontrada', 404);
    }

    const examenId = examenResult.rows[0].EXAMEN_ID_EXAMEN;

    const estadoActivoResult = await connection.execute(
      `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'ACTIVO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const idEstadoActivo = estadoActivoResult.rows[0]?.ID_ESTADO;
    if (!idEstadoActivo) {
      return handleError(res, null, "Estado 'ACTIVO' no configurado.", 500);
    }

    // --- Inicia la transacción ---
    await connection.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reserva_id`,
      { reserva_id: reservaIdNum }
    );
    await connection.execute(
      `DELETE FROM RESERVA_DOCENTES WHERE RESERVA_ID_RESERVA = :reserva_id`,
      { reserva_id: reservaIdNum }
    );
    await connection.execute(
      `DELETE FROM RESERVA WHERE ID_RESERVA = :reserva_id`,
      { reserva_id: reservaIdNum }
    );
    await connection.execute(
      `UPDATE EXAMEN SET ESTADO_ID_ESTADO = :estado_activo WHERE ID_EXAMEN = :examen_id`,
      {
        estado_activo: idEstadoActivo,
        examen_id: examenId,
      }
    );

    await connection.commit();

    // --- INICIO DE LA CORRECCIÓN CLAVE ---
    // Después de confirmar la transacción, emitimos un evento de Socket.IO
    if (req.app.get('io')) {
      req.app
        .get('io')
        .emit('reservaEliminadaDesdeServidor', { id_reserva: reservaIdNum });
      console.log(
        `[Socket.IO] Evento 'reservaEliminadaDesdeServidor' emitido para reserva #${reservaIdNum}.`
      );
    }
    // --- FIN DE LA CORRECCIÓN CLAVE ---

    console.log(
      `[cancelarReservaCompleta] Reserva ${reservaIdNum} cancelada y examen ${examenId} reactivado`
    );

    res.status(200).json({
      message: 'Reserva cancelada y examen reactivado exitosamente',
      id_reserva: reservaIdNum,
      examen_id: examenId,
      estado_examen: 'ACTIVO',
    });
  } catch (error) {
    if (connection) {
      console.error(
        `[cancelarReservaCompleta] Error, haciendo rollback:`,
        error
      );
      await connection.rollback();
    }
    handleError(res, error, 'Error al cancelar reserva');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
      }
    }
  }
};

export const getMisReservasConfirmadas = async (req, res) => {
  let connection;
  const { id_usuario: userId } = req.user;

  try {
    connection = await getConnection();
    const sql = `
      SELECT
        R.ID_RESERVA, R.FECHA_RESERVA,
        S.ID_SALA, S.NOMBRE_SALA,
        EX.ID_EXAMEN, EX.NOMBRE_EXAMEN,
        SEC.ID_SECCION, SEC.NOMBRE_SECCION,
        A.NOMBRE_ASIGNATURA,
        (SELECT LISTAGG(U.NOMBRE_USUARIO, ', ') WITHIN GROUP (ORDER BY U.NOMBRE_USUARIO)
           FROM USUARIOSECCION US_DOC
           JOIN USUARIO U ON US_DOC.USUARIO_ID_USUARIO = U.ID_USUARIO
           JOIN ROL RL ON U.ROL_ID_ROL = RL.ID_ROL
           WHERE US_DOC.SECCION_ID_SECCION = SEC.ID_SECCION AND RL.NOMBRE_ROL = 'DOCENTE'
        ) AS NOMBRE_DOCENTE,
        (SELECT LISTAGG(M.ID_MODULO, ',') WITHIN GROUP (ORDER BY M.ORDEN) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS MODULOS_IDS
      FROM RESERVA R
      JOIN EXAMEN EX ON R.EXAMEN_ID_EXAMEN = EX.ID_EXAMEN
      JOIN SECCION SEC ON EX.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN SALA S ON R.SALA_ID_SALA = S.ID_SALA
      JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION -- Unimos con las secciones del usuario
      WHERE R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO' -- Solo las confirmadas
      AND US.USUARIO_ID_USUARIO = :userId -- Solo las del usuario logueado
      ORDER BY R.FECHA_RESERVA
    `;

    const result = await connection.execute(
      sql,
      { userId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    // Usamos un Set para obtener resultados únicos por ID_RESERVA
    const uniqueReservas = [
      ...new Map(result.rows.map((item) => [item.ID_RESERVA, item])).values(),
    ];

    res.json(uniqueReservas);
  } catch (error) {
    handleError(res, error, 'Error al obtener mis reservas confirmadas');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};
