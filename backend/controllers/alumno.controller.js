import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Asumo que tienes una función handleError similar a esta
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  res
    .status(statusCode)
    .json({ error: message, details: error.message || error });
};

export const getMisReservas = async (req, res) => {
  let connection;
  try {
    const idAlumnoAutenticado = req.user.id_usuario; // ID del alumno logueado
    const ROL_ID_ALUMNO = 3; // Confirmamos que es un alumno

    if (req.user.rol_id_rol !== ROL_ID_ALUMNO) {
      return handleError(
        res,
        null,
        'Acceso denegado. Funcionalidad solo para alumnos.',
        403
      );
    }

    connection = await getConnection();

    // Consultamos la vista que ya tiene casi toda la información
    // y filtramos por el ID del alumno y el estado de confirmación del docente.
    const sql = `
      SELECT
        ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO,
        ID_EXAMEN, NOMBRE_EXAMEN,
        ID_RESERVA, FECHA_RESERVA, HORA_INICIO, HORA_FIN,
        NOMBRE_SALA,
        ESTADO_EXAMEN,
        ESTADO_RESERVA,
        ESTADO_CONFIRMACION_DOCENTE, -- Lo incluimos para verificar, pero ya está filtrado
        NOMBRE_ASIGNATURA,
        NOMBRE_SECCION,
        NOMBRE_CARRERA,
        NOMBRE_JORNADA
      FROM V_REPORTE_ALUMNOS_RESERVAS
      WHERE ID_USUARIO = :idAlumnoAutenticado
        AND ESTADO_CONFIRMACION_DOCENTE = ' CONFIRMADO'
      ORDER BY FECHA_RESERVA ASC, HORA_INICIO ASC
    `;
    // Corregido: AND ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO' (sin espacio inicial)
    // La vista V_REPORTE_ALUMNOS_RESERVAS ya debería filtrar por estados de reserva activos (PROGRAMADO, CONFIRMADO)
    const params = { idAlumnoAutenticado };

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener las reservas del alumno');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection for getMisReservas', err);
      }
    }
  }
};
