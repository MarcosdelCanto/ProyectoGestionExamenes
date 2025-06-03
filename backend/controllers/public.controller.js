// backend/controllers/public.controller.js
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

export const consultarReservasPublico = async (req, res) => {
  let connection;
  const { identificador, tipoUsuario } = req.body; // tipoUsuario será 'alumno' o 'docente'

  if (!identificador || !tipoUsuario) {
    return handleError(
      res,
      null,
      'Identificador y tipo de usuario son requeridos.',
      400
    );
  }

  const ID_ROL_ALUMNO = 3;
  const ID_ROL_DOCENTE = 2;
  let targetRolId;

  if (tipoUsuario.toLowerCase() === 'alumno') {
    targetRolId = ID_ROL_ALUMNO;
  } else if (tipoUsuario.toLowerCase() === 'docente') {
    targetRolId = ID_ROL_DOCENTE;
  } else {
    return handleError(res, null, 'Tipo de usuario no válido.', 400);
  }

  try {
    connection = await getConnection();

    // 1. Buscar al usuario y verificar su rol
    const userSql = `
      SELECT ID_USUARIO, ROL_ID_ROL
      FROM USUARIO
      WHERE EMAIL_USUARIO = :identificador_param
      -- Si tienes RUT_USUARIO: OR RUT_USUARIO = :identificador_param
    `;
    const userResult = await connection.execute(
      userSql,
      { identificador_param: identificador.toLowerCase() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      return handleError(
        res,
        null,
        'Usuario no encontrado con el identificador proporcionado.',
        404
      );
    }

    const usuario = userResult.rows[0];
    if (usuario.ROL_ID_ROL !== targetRolId) {
      return handleError(
        res,
        null,
        `El identificador no corresponde a un ${tipoUsuario}.`,
        403
      );
    }

    // 2. Construir la consulta de reservas basada en el rol
    let sqlReservas;
    const paramsReservas = { userId_param: usuario.ID_USUARIO };

    let baseSelectReservas = `
      SELECT
        R.ID_RESERVA, R.FECHA_RESERVA,
        E.NOMBRE_EXAMEN,
        SEC.NOMBRE_SECCION, A.NOMBRE_ASIGNATURA,
        SL.NOMBRE_SALA,
        EST_R.NOMBRE_ESTADO AS ESTADO_RESERVA,
        R.ESTADO_CONFIRMACION_DOCENTE,
        (SELECT MIN(M.INICIO_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_INICIO,
        (SELECT MAX(M.FIN_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_FIN
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA
      JOIN ESTADO EST_R ON R.ESTADO_ID_ESTADO = EST_R.ID_ESTADO
    `;

    if (usuario.ROL_ID_ROL === ID_ROL_ALUMNO) {
      sqlReservas = `
        ${baseSelectReservas}
        JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
        WHERE US.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')
        ORDER BY R.FECHA_RESERVA ASC, HORA_INICIO ASC
      `;
    } else if (usuario.ROL_ID_ROL === ID_ROL_DOCENTE) {
      sqlReservas = `
        ${baseSelectReservas}
        JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
        WHERE US.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE != 'REQUIERE_REVISION' -- Docentes ven PENDIENTE y CONFIRMADA
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO', 'PENDIENTE')
        ORDER BY R.FECHA_RESERVA ASC, HORA_INICIO ASC
      `;
    } else {
      // Este caso no debería darse si la validación de rol inicial es correcta
      return res.json([]);
    }

    const reservasResult = await connection.execute(
      sqlReservas,
      paramsReservas,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(reservasResult.rows);
  } catch (error) {
    handleError(res, error, 'Error al consultar reservas');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error cerrando conexión en consultarReservasPublico',
          err
        );
      }
    }
  }
};
