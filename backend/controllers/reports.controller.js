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

    let sql = `SELECT * FROM V_REPORTE_EXAMENES_DETALLADO WHERE 1=1`;
    const params = {};

    // La función genérica se mantiene para los filtros simples
    const addCondition = (field, paramName, value) => {
      if (value && !isNaN(parseInt(value))) {
        sql += ` AND ${field} = :${paramName}`;
        params[paramName] = parseInt(value);
      }
    };

    // Usamos la función genérica para todos los filtros numéricos simples
    addCondition('ID_SEDE', 'sedeId', sedeId);
    addCondition('ID_ESCUELA', 'escuelaId', escuelaId);
    addCondition('ID_CARRERA', 'carreraId', carreraId);
    addCondition('ID_ASIGNATURA', 'asignaturaId', asignaturaId);
    addCondition('ID_JORNADA', 'jornadaId', jornadaId);
    addCondition('ID_ESTADO', 'estadoExamenId', estadoExamenId);
    // --- CAMBIO IMPORTANTE AQUÍ ---
    // Manejamos el filtro de 'docenteId' de forma especial
    if (docenteId) {
      const docenteIdNum = parseInt(docenteId);
      if (!isNaN(docenteIdNum)) {
        // Usamos INSTR para buscar el ID dentro de la lista de texto
        sql += ` AND INSTR(',' || ID_DOCENTE || ',', ',' || :docenteId || ',') > 0`;
        // Pasamos el parámetro como un STRING para evitar errores de tipo
        params.docenteId = String(docenteIdNum);
      }
    }
    // --- FIN DEL CAMBIO ---

    if (fechaDesde) {
      sql += ` AND FECHA_RESERVA >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`;
      params.fechaDesde = fechaDesde;
    }
    if (fechaHasta) {
      sql += ` AND FECHA_RESERVA <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`;
      params.fechaHasta = fechaHasta;
    }

    sql += ` ORDER BY FECHA_RESERVA DESC, NOMBRE_EXAMEN`;

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

export const getReporteAlumnosReservas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { sedeId, escuelaId, carreraId, asignaturaId, seccionId, jornadaId } =
      req.query;

    let sql = `SELECT * FROM V_REPORTE_ALUMNOS_RESERVAS WHERE 1=1`;
    const params = {};

    const addCondition = (field, paramName, value) => {
      if (value && !isNaN(parseInt(value))) {
        sql += ` AND ${field} = :${paramName}`;
        params[paramName] = parseInt(value);
      }
    };

    addCondition('ID_SEDE', 'sedeId', sedeId);
    addCondition('ID_ESCUELA', 'escuelaId', escuelaId);
    addCondition('ID_CARRERA', 'carreraId', carreraId);
    addCondition('ID_ASIGNATURA', 'asignaturaId', asignaturaId);
    addCondition('ID_SECCION', 'seccionId', seccionId);
    addCondition('ID_JORNADA', 'jornadaId', jornadaId);

    sql += ` ORDER BY NOMBRE_USUARIO, FECHA_RESERVA DESC`;

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al generar el reporte de alumnos');
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
