import { getConnection } from '../db.js';

const handleError = (res, error, message) => {
  console.error(message, error);
  res.status(500).json({ message: `${message}. Error: ${error.message}` });
};

export const getDashboardSummary = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const queries = [
      connection.execute(`SELECT COUNT(*) AS TOTAL FROM SEDE`),
      connection.execute(`SELECT COUNT(*) AS TOTAL FROM ESCUELA`),
      connection.execute(`SELECT COUNT(*) AS TOTAL FROM CARRERA`),
      connection.execute(`SELECT COUNT(*) AS TOTAL FROM ASIGNATURA`),
      connection.execute(`SELECT COUNT(*) AS TOTAL FROM USUARIO`),
      connection.execute(
        `SELECT COUNT(U.ID_USUARIO) AS TOTAL
         FROM USUARIO U
         JOIN ROL R ON U.ROL_ID_ROL = R.ID_ROL
         WHERE R.NOMBRE_ROL = :rolNombre`, // Asumiendo que tienes un rol 'Docente'
        { rolNombre: 'DOCENTE' } // es con mayusculas
      ),
      connection.execute(
        `SELECT COUNT(E.ID_EXAMEN) AS TOTAL
         FROM EXAMEN E
         JOIN ESTADO ES ON E.ESTADO_ID_ESTADO = ES.ID_ESTADO
         WHERE ES.NOMBRE_ESTADO = :nombreEstado`, // Asumiendo que tienes un estado 'Activo'
        { nombreEstado: 'ACTIVO' } // es con mayusculas
      ),
    ];

    const results = await Promise.all(queries);

    const summary = {
      totalSedes: results[0].rows[0].TOTAL || 0,
      totalEscuelas: results[1].rows[0].TOTAL || 0,
      totalCarreras: results[2].rows[0].TOTAL || 0,
      totalAsignaturas: results[3].rows[0].TOTAL || 0,
      totalUsuarios: results[4].rows[0].TOTAL || 0,
      totalDocentes: results[5].rows[0].TOTAL || 0,
      examenesActivos: results[6].rows[0].TOTAL || 0,
    };

    res.json(summary);
  } catch (error) {
    handleError(res, error, 'Error al obtener el resumen del dashboard');
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

export const getExamenesPorCarreraChartData = async (req, res) => {
  let connection;
  const { sedeId, escuelaId, carreraId, fechaDesde, fechaHasta } = req.query;
  try {
    connection = await getConnection();
    let params = {};
    let baseSql = `
       SELECT CRR.NOMBRE_CARRERA as "name", COUNT(DISTINCT E.ID_EXAMEN) as "value"
       FROM EXAMEN E
       JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
       JOIN ASIGNATURA A ON S.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
       JOIN CARRERA CRR ON A.CARRERA_ID_CARRERA = CRR.ID_CARRERA
       JOIN ESCUELA ESC ON CRR.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
       JOIN SEDE SED ON ESC.SEDE_ID_SEDE = SED.ID_SEDE
    `;

    let whereClauses = [];
    let joins = [];

    if (sedeId) {
      whereClauses.push(`SED.ID_SEDE = :sedeId`);
      params.sedeId = parseInt(sedeId);
    }
    if (escuelaId) {
      whereClauses.push(`ESC.ID_ESCUELA = :escuelaId`);
      params.escuelaId = parseInt(escuelaId);
    }
    if (carreraId) {
      whereClauses.push(`CRR.ID_CARRERA = :carreraId`);
      params.carreraId = parseInt(carreraId);
    }
    if (fechaDesde || fechaHasta) {
      joins.push(`JOIN RESERVA R ON E.ID_EXAMEN = R.EXAMEN_ID_EXAMEN`);
      if (fechaDesde) {
        whereClauses.push(
          `R.FECHA_RESERVA >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`
        );
        params.fechaDesde = fechaDesde;
      }
      if (fechaHasta) {
        whereClauses.push(
          `R.FECHA_RESERVA <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`
        );
        params.fechaHasta = fechaHasta;
      }
    }

    let finalSql = baseSql + joins.join(' ');
    if (whereClauses.length > 0) {
      finalSql += ` WHERE ` + whereClauses.join(' AND ');
    }
    finalSql += ` GROUP BY CRR.NOMBRE_CARRERA ORDER BY "value" DESC`;
    const result = await connection.execute(finalSql, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de exámenes por carrera');
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

export const getModulosAgendadosChartData = async (req, res) => {
  let connection;
  const { jornadaId, fechaDesde, fechaHasta, estadoModuloId } = req.query;
  try {
    connection = await getConnection();
    let params = {};
    let baseSql = `
       SELECT M.NOMBRE_MODULO as "hora", COUNT(RM.MODULO_ID_MODULO) as "cantidad"
       FROM RESERVAMODULO RM
       JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO
    `;
    let whereClauses = [];
    let joins = [`JOIN RESERVA R ON RM.RESERVA_ID_RESERVA = R.ID_RESERVA`]; // Necesario para fecha y potencialmente jornada

    if (jornadaId) {
      // Asumiendo que la jornada se puede inferir a través de la sección del examen de la reserva
      joins.push(`JOIN EXAMEN EX ON R.EXAMEN_ID_EXAMEN = EX.ID_EXAMEN`);
      joins.push(`JOIN SECCION S ON EX.SECCION_ID_SECCION = S.ID_SECCION`);
      whereClauses.push(`S.JORNADA_ID_JORNADA = :jornadaId`);
      params.jornadaId = parseInt(jornadaId);
    }
    if (fechaDesde) {
      whereClauses.push(
        `R.FECHA_RESERVA >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`
      );
      params.fechaDesde = fechaDesde;
    }
    if (fechaHasta) {
      whereClauses.push(
        `R.FECHA_RESERVA <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`
      );
      params.fechaHasta = fechaHasta;
    }
    if (estadoModuloId) {
      whereClauses.push(`M.ESTADO_ID_ESTADO = :estadoModuloId`);
      params.estadoModuloId = parseInt(estadoModuloId);
    }
    let finalSql =
      baseSql +
      joins.join(' ') +
      (whereClauses.length > 0 ? ` WHERE ` + whereClauses.join(' AND ') : '') +
      ` GROUP BY M.NOMBRE_MODULO, M.ORDEN ORDER BY M.ORDEN`;

    const result = await connection.execute(finalSql, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de módulos agendados');
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

export const getUsoSalasChartData = async (req, res) => {
  let connection;
  const { sedeId, edificioId, fecha } = req.query;
  try {
    connection = await getConnection();
    let paramsOcupadas = {};
    let paramsTotal = {};

    let ocupadasSqlWhere = [];
    if (fecha) {
      ocupadasSqlWhere.push(
        `TRUNC(R.FECHA_RESERVA) = TO_DATE(:fecha, 'YYYY-MM-DD')`
      );
      paramsOcupadas.fecha = fecha;
    } else {
      // Por defecto, hoy y futuro si no se especifica fecha
      ocupadasSqlWhere.push(`R.FECHA_RESERVA >= TRUNC(SYSDATE)`);
    }

    let totalSalasSqlWhere = [];
    if (sedeId) {
      totalSalasSqlWhere.push(`E.SEDE_ID_SEDE = :sedeId`);
      paramsTotal.sedeId = parseInt(sedeId);
      // Para contar ocupadas en esa sede, también se necesita el join con edificio y sala
    }
    if (edificioId) {
      totalSalasSqlWhere.push(`S.EDIFICIO_ID_EDIFICIO = :edificioId`);
      paramsTotal.edificioId = parseInt(edificioId);
    }
    // Capacidad y otros filtros para totalSalasSqlWhere y ocupadasSqlWhere necesitarían joins con SALA

    // Esta lógica se vuelve compleja para mantenerla simple aquí.
    // Simplificación: Filtros de sede/edificio aplicados al total, fecha al conteo de ocupadas.
    const ocupadasQuery = `SELECT COUNT(DISTINCT R.SALA_ID_SALA) as OCUPADAS FROM RESERVA R JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA JOIN EDIFICIO ED ON SL.EDIFICIO_ID_EDIFICIO = ED.ID_EDIFICIO ${sedeId ? 'WHERE ED.SEDE_ID_SEDE = :sedeId' : ''} ${sedeId && edificioId ? 'AND ED.ID_EDIFICIO = :edificioId' : edificioId ? 'WHERE ED.ID_EDIFICIO = :edificioId' : ''} ${(sedeId || edificioId) && ocupadasSqlWhere.length > 0 ? 'AND' : ocupadasSqlWhere.length > 0 ? 'WHERE' : ''} ${ocupadasSqlWhere.join(' AND ')}`;
    if (sedeId) paramsOcupadas.sedeId = parseInt(sedeId);
    if (edificioId) paramsOcupadas.edificioId = parseInt(edificioId);
    const ocupadasResult = await connection.execute(
      ocupadasQuery,
      paramsOcupadas
    );
    const totalResult = await connection.execute(
      `SELECT COUNT(S.ID_SALA) as TOTAL FROM SALA S JOIN EDIFICIO E ON S.EDIFICIO_ID_EDIFICIO = E.ID_EDIFICIO ${totalSalasSqlWhere.length > 0 ? 'WHERE ' + totalSalasSqlWhere.join(' AND ') : ''}`,
      paramsTotal
    );
    const ocupadas = ocupadasResult.rows[0]?.OCUPADAS || 0;
    const total = totalResult.rows[0]?.TOTAL || 0;
    const disponibles = total - ocupadas;

    res.json([
      { name: 'Ocupadas', value: ocupadas },
      { name: 'Disponibles', value: disponibles < 0 ? 0 : disponibles },
    ]);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de uso de salas');
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

export const getExamenesPorDiaChartData = async (req, res) => {
  let connection;
  const {
    sedeId,
    escuelaId,
    carreraId,
    asignaturaId,
    jornadaId,
    fechaDesde,
    fechaHasta,
    estadoReservaId, // Nuevo filtro para el estado de la reserva
  } = req.query;
  try {
    connection = await getConnection();
    // Asegúrate que NLS_DATE_LANGUAGE esté configurado para español en tu sesión/DB
    // o ajusta los nombres de los días ('MON', 'TUE', etc.)
    let params = {};
    let baseSql = `SELECT
           TO_CHAR(R.FECHA_RESERVA, 'YYYY-MM-DD') as "fecha_completa",
           CASE TO_CHAR(R.FECHA_RESERVA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH')
               WHEN 'LUN' THEN 'Lunes'
               WHEN 'MAR' THEN 'Martes'
               WHEN 'MIÉ' THEN 'Miércoles'
               WHEN 'JUE' THEN 'Jueves'
               WHEN 'VIE' THEN 'Viernes'
               WHEN 'SÁB' THEN 'Sábado'
               WHEN 'DOM' THEN 'Domingo'
               ELSE TO_CHAR(R.FECHA_RESERVA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH')
           END as "dia_semana",
           ES_EX.NOMBRE_ESTADO as "estado_examen",
           COUNT(E.ID_EXAMEN) as "cantidad_examenes"
       FROM EXAMEN E
        JOIN RESERVA R ON E.ID_EXAMEN = R.EXAMEN_ID_EXAMEN
        JOIN ESTADO ES_EX ON E.ESTADO_ID_ESTADO = ES_EX.ID_ESTADO -- Estado del Examen
        JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
        JOIN ASIGNATURA A ON S.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
        JOIN CARRERA CRR ON A.CARRERA_ID_CARRERA = CRR.ID_CARRERA
        JOIN ESCUELA ESC ON CRR.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
        JOIN SEDE SED ON ESC.SEDE_ID_SEDE = SED.ID_SEDE
    `;
    let whereClauses = [];

    if (sedeId) {
      whereClauses.push(`SED.ID_SEDE = :sedeId`);
      params.sedeId = parseInt(sedeId);
    }
    if (escuelaId) {
      whereClauses.push(`ESC.ID_ESCUELA = :escuelaId`);
      params.escuelaId = parseInt(escuelaId);
    }
    if (carreraId) {
      whereClauses.push(`CRR.ID_CARRERA = :carreraId`);
      params.carreraId = parseInt(carreraId);
    }
    if (asignaturaId) {
      whereClauses.push(`A.ID_ASIGNATURA = :asignaturaId`);
      params.asignaturaId = parseInt(asignaturaId);
    }
    if (jornadaId) {
      whereClauses.push(`S.JORNADA_ID_JORNADA = :jornadaId`);
      params.jornadaId = parseInt(jornadaId);
    }
    if (fechaDesde) {
      whereClauses.push(
        `R.FECHA_RESERVA >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`
      );
      params.fechaDesde = fechaDesde;
    }
    if (fechaHasta) {
      whereClauses.push(
        `R.FECHA_RESERVA <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`
      );
      params.fechaHasta = fechaHasta;
    } else if (!fechaDesde) {
      // Default to current week if no date range specified
      whereClauses.push(
        `R.FECHA_RESERVA BETWEEN TRUNC(SYSDATE, 'IW') AND TRUNC(SYSDATE, 'IW') + 6`
      );
    }
    if (estadoReservaId) {
      // Cambiado para filtrar por el estado del EXAMEN (tabla E)
      whereClauses.push(`E.ESTADO_ID_ESTADO = :estadoReservaId`);
      params.estadoReservaId = parseInt(estadoReservaId);
    }

    let finalSql = baseSql;
    if (whereClauses.length > 0) {
      finalSql += ` WHERE ` + whereClauses.join(' AND ');
    }
    finalSql += ` GROUP BY TO_CHAR(R.FECHA_RESERVA, 'YYYY-MM-DD'), TO_CHAR(R.FECHA_RESERVA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH'), ES_EX.NOMBRE_ESTADO, TO_CHAR(R.FECHA_RESERVA, 'D')
                  ORDER BY TO_CHAR(R.FECHA_RESERVA, 'YYYY-MM-DD'), TO_CHAR(R.FECHA_RESERVA, 'D'), ES_EX.NOMBRE_ESTADO`;

    const result = await connection.execute(finalSql, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de exámenes por día');
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

// Nota: Para las consultas que usan `NOMBRE_ROL = 'Docente'` o `NOMBRE_ESTADO = 'Activo'`,
// considera usar los IDs si son más estables y menos propensos a cambios (ej. por traducción o renombrado).
// Si usas IDs, deberás conocerlos de antemano o hacer una subconsulta para obtenerlos.
// Ejemplo con ID para rol Docente (si ID_ROL de Docente es, por ejemplo, 2):
// `WHERE U.ROL_ID_ROL = 2`

// Ejemplo con ID para estado Activo (si ID_ESTADO de Activo es, por ejemplo, 1):
// `WHERE ES.ID_ESTADO = 1`
