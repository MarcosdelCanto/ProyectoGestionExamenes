import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message) => {
  console.error(message, ':', error);
  res.status(500).json({ error: message, details: error.message });
};

export const getReporteDetalladoExamenes = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const {
      sedeId,
      escuelaId,
      carreraId,
      asignaturaId,
      jornadaId,
      fechaDesde,
      fechaHasta,
      estadoExamenId,
      docenteId,
    } = req.query;

    // Asegúrate de que este ID sea el correcto de tu tabla ROL
    const ID_ROL_DOCENTE_REAL = 2; // EJEMPLO: Reemplaza con el ID real del rol "Docente"

    let sql = `
      SELECT
        E.ID_EXAMEN,
        E.NOMBRE_EXAMEN,
        R.ID_RESERVA,
        TO_CHAR(R.FECHA_RESERVA, 'YYYY-MM-DD') AS FECHA_EXAMEN,
        MIN(M.INICIO_MODULO) AS HORA_INICIO,
        MAX(M.FIN_MODULO) AS HORA_FIN,
        S.NOMBRE_SALA,
        ED.NOMBRE_EDIFICIO,
        SE.NOMBRE_SEDE,
        ESC.NOMBRE_ESCUELA,
        CAR.NOMBRE_CARRERA,
        A.NOMBRE_ASIGNATURA,
        J.NOMBRE_JORNADA,
        EST_EX.NOMBRE_ESTADO AS ESTADO_EXAMEN,
        E.INSCRITOS_EXAMEN,
        E.TIPO_PROCESAMIENTO_EXAMEN,
        E.PLATAFORMA_PROSE_EXAMEN,
        E.SITUACION_EVALUATIVA_EXAMEN,
        E.CANTIDAD_MODULOS_EXAMEN
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN CARRERA CAR ON A.CARRERA_ID_CARRERA = CAR.ID_CARRERA
      JOIN ESCUELA ESC ON CAR.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
      JOIN SEDE SE ON ESC.SEDE_ID_SEDE = SE.ID_SEDE
      JOIN SALA S ON R.SALA_ID_SALA = S.ID_SALA
      JOIN EDIFICIO ED ON S.EDIFICIO_ID_EDIFICIO = ED.ID_EDIFICIO
      JOIN JORNADA J ON SEC.JORNADA_ID_JORNADA = J.ID_JORNADA
      JOIN ESTADO EST_EX ON E.ESTADO_ID_ESTADO = EST_EX.ID_ESTADO
      JOIN RESERVAMODULO RM ON R.ID_RESERVA = RM.RESERVA_ID_RESERVA
      JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO
      JOIN USUARIOSECCION US ON SEC.ID_SECCION = US.SECCION_ID_SECCION
      JOIN USUARIO U ON US.USUARIO_ID_USUARIO = U.ID_USUARIO
      WHERE 1=1
    `;

    const params = {};

    if (sedeId) {
      const sedeIdNum = parseInt(sedeId);
      if (!isNaN(sedeIdNum)) {
        sql += ` AND SE.ID_SEDE = :sedeId`;
        params.sedeId = sedeIdNum;
      }
    }
    if (escuelaId) {
      const escuelaIdNum = parseInt(escuelaId);
      if (!isNaN(escuelaIdNum)) {
        sql += ` AND ESC.ID_ESCUELA = :escuelaId`;
        params.escuelaId = escuelaIdNum;
      }
    }
    if (carreraId) {
      const carreraIdNum = parseInt(carreraId);
      if (!isNaN(carreraIdNum)) {
        sql += ` AND CAR.ID_CARRERA = :carreraId`;
        params.carreraId = carreraIdNum;
      }
    }
    if (asignaturaId) {
      const asignaturaIdNum = parseInt(asignaturaId);
      if (!isNaN(asignaturaIdNum)) {
        sql += ` AND A.ID_ASIGNATURA = :asignaturaId`;
        params.asignaturaId = asignaturaIdNum;
      }
    }
    if (jornadaId) {
      const jornadaIdNum = parseInt(jornadaId);
      if (!isNaN(jornadaIdNum)) {
        sql += ` AND J.ID_JORNADA = :jornadaId`;
        params.jornadaId = jornadaIdNum;
      }
    }
    if (estadoExamenId) {
      const estadoExamenIdNum = parseInt(estadoExamenId);
      if (!isNaN(estadoExamenIdNum)) {
        sql += ` AND E.ESTADO_ID_ESTADO = :estadoExamenId`;
        params.estadoExamenId = estadoExamenIdNum;
      }
    }
    if (docenteId) {
      const docenteIdNum = parseInt(docenteId);
      // Asegurarse que ID_ROL_DOCENTE_REAL es un número
      if (
        !isNaN(docenteIdNum) &&
        typeof ID_ROL_DOCENTE_REAL === 'number' &&
        !isNaN(ID_ROL_DOCENTE_REAL)
      ) {
        sql += ` AND U.ID_USUARIO = :docenteId AND U.ROL_ID_ROL = :rolDocente`;
        params.docenteId = docenteIdNum;
        params.rolDocente = ID_ROL_DOCENTE_REAL;
      }
    }

    if (fechaDesde) {
      // Aquí se asume que fechaDesde es una cadena en formato YYYY-MM-DD
      // No se necesita parseInt, pero sí validación de formato si es necesario.
      sql += ` AND R.FECHA_RESERVA >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`;
      params.fechaDesde = fechaDesde;
    }
    if (fechaHasta) {
      sql += ` AND R.FECHA_RESERVA <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`;
      params.fechaHasta = fechaHasta;
    }

    sql += `
      GROUP BY
        E.ID_EXAMEN, E.NOMBRE_EXAMEN, R.ID_RESERVA, R.FECHA_RESERVA,
        S.NOMBRE_SALA, ED.NOMBRE_EDIFICIO, SE.NOMBRE_SEDE,
        ESC.NOMBRE_ESCUELA, CAR.NOMBRE_CARRERA, A.NOMBRE_ASIGNATURA,
        J.NOMBRE_JORNADA, EST_EX.NOMBRE_ESTADO,
        E.INSCRITOS_EXAMEN, E.TIPO_PROCESAMIENTO_EXAMEN,
        E.PLATAFORMA_PROSE_EXAMEN, E.SITUACION_EVALUATIVA_EXAMEN,
        E.CANTIDAD_MODULOS_EXAMEN
      ORDER BY R.FECHA_RESERVA DESC, E.NOMBRE_EXAMEN
    `;

    console.log('Executing SQL for detailed report:', sql);
    console.log('With params:', params);

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    res.json(result.rows);
  } catch (error) {
    handleError(
      res,
      error,
      'Error al generar el reporte detallado de exámenes'
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection', err);
      }
    }
  }
};
