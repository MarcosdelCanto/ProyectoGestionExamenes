import { getConnection } from '../db.js';

const handleError = (res, error, message) => {
  console.error(message, error);
  res.status(500).json({ message: `${message}. Error: ${error.message}` });
};

export const getDashboardSummary = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { rol_id_rol: userRoleId, id_usuario: userId } = req.user;
    const ID_ROL_ADMIN = 1; // Asumiendo que el ID del rol de Administrador es 1

    let summary = {};

    if (userRoleId === ID_ROL_ADMIN) {
      // --- Lógica para Administrador (sin cambios, ve todo) ---
      const queries = [
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM SEDE`),
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM ESCUELA`),
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM CARRERA`),
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM ASIGNATURA`),
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM USUARIO`),
        connection.execute(
          `SELECT COUNT(*) AS TOTAL FROM USUARIO WHERE ROL_ID_ROL = 2`
        ), // Rol Docente
        connection.execute(
          `SELECT COUNT(*) AS TOTAL FROM EXAMEN WHERE ESTADO_ID_ESTADO = 1`
        ), // Estado Activo
      ];
      const results = await Promise.all(queries);
      summary = {
        totalSedes: results[0].rows[0].TOTAL || 0,
        totalEscuelas: results[1].rows[0].TOTAL || 0,
        totalCarreras: results[2].rows[0].TOTAL || 0,
        totalAsignaturas: results[3].rows[0].TOTAL || 0,
        totalUsuarios: results[4].rows[0].TOTAL || 0,
        totalDocentes: results[5].rows[0].TOTAL || 0,
        examenesActivos: results[6].rows[0].TOTAL || 0,
      };
    } else {
      // --- Lógica para Roles Restringidos (Jefe de Carrera, Coordinadores) ---
      const baseJoin = `FROM USUARIOCARRERA uc WHERE uc.USUARIO_ID_USUARIO = :userId`;
      const params = { userId };

      const queries = [
        // Total de Carreras asociadas al usuario
        connection.execute(
          `SELECT COUNT(DISTINCT uc.CARRERA_ID_CARRERA) AS TOTAL ${baseJoin}`,
          params
        ),
        // Total de Asignaturas de esas carreras
        connection.execute(
          `SELECT COUNT(DISTINCT a.ID_ASIGNATURA) AS TOTAL FROM ASIGNATURA a JOIN USUARIOCARRERA uc ON a.CARRERA_ID_CARRERA = uc.CARRERA_ID_CARRERA WHERE uc.USUARIO_ID_USUARIO = :userId`,
          params
        ),
        // Total de Escuelas de esas carreras
        connection.execute(
          `SELECT COUNT(DISTINCT c.ESCUELA_ID_ESCUELA) AS TOTAL FROM CARRERA c JOIN USUARIOCARRERA uc ON c.ID_CARRERA = uc.CARRERA_ID_CARRERA WHERE uc.USUARIO_ID_USUARIO = :userId`,
          params
        ),
        // Total de Sedes de esas escuelas
        connection.execute(
          `SELECT COUNT(DISTINCT e.SEDE_ID_SEDE) AS TOTAL FROM ESCUELA e JOIN CARRERA c ON e.ID_ESCUELA = c.ESCUELA_ID_ESCUELA JOIN USUARIOCARRERA uc ON c.ID_CARRERA = uc.CARRERA_ID_CARRERA WHERE uc.USUARIO_ID_USUARIO = :userId`,
          params
        ),
        // Exámenes Activos de esas carreras
        connection.execute(
          `SELECT COUNT(DISTINCT ex.ID_EXAMEN) AS TOTAL FROM EXAMEN ex JOIN SECCION s ON ex.SECCION_ID_SECCION = s.ID_SECCION JOIN ASIGNATURA a ON s.ASIGNATURA_ID_ASIGNATURA = a.ID_ASIGNATURA JOIN USUARIOCARRERA uc ON a.CARRERA_ID_CARRERA = uc.CARRERA_ID_CARRERA WHERE ex.ESTADO_ID_ESTADO = 1 AND uc.USUARIO_ID_USUARIO = :userId`,
          params
        ),
        // Docentes y Usuarios totales no se filtran por carrera, se mantienen globales
        connection.execute(`SELECT COUNT(*) AS TOTAL FROM USUARIO`),
        connection.execute(
          `SELECT COUNT(*) AS TOTAL FROM USUARIO WHERE ROL_ID_ROL = 2`
        ),
      ];

      const results = await Promise.all(queries);
      summary = {
        totalCarreras: results[0].rows[0].TOTAL || 0,
        totalAsignaturas: results[1].rows[0].TOTAL || 0,
        totalEscuelas: results[2].rows[0].TOTAL || 0,
        totalSedes: results[3].rows[0].TOTAL || 0,
        examenesActivos: results[4].rows[0].TOTAL || 0,
        totalUsuarios: results[5].rows[0].TOTAL || 0,
        totalDocentes: results[6].rows[0].TOTAL || 0,
      };
    }

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
  const { rol_id_rol: userRoleId, id_usuario: userId } = req.user; // <-- OBTENER DATOS DEL USUARIO
  const ID_ROL_ADMIN = 1;

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
    let joins = [];
    let whereClauses = [];

    // --- NUEVA LÓGICA DE FILTRADO POR ROL ---
    if (userRoleId !== ID_ROL_ADMIN) {
      joins.push(
        `JOIN USUARIOCARRERA UC ON CRR.ID_CARRERA = UC.CARRERA_ID_CARRERA`
      );
      whereClauses.push(`UC.USUARIO_ID_USUARIO = :userId`);
      params.userId = userId;
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    // El resto de los filtros se mantiene igual
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

    let finalSql = baseSql + ' ' + joins.join(' ');
    if (whereClauses.length > 0) {
      finalSql += ` WHERE ` + whereClauses.join(' AND ');
    }
    finalSql += ` GROUP BY CRR.NOMBRE_CARRERA ORDER BY "value" DESC`;

    const result = await connection.execute(finalSql, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de exámenes por carrera');
  } finally {
    if (connection) await connection.close().catch((e) => console.error(e));
  }
};

export const getModulosAgendadosChartData = async (req, res) => {
  let connection;
  const { jornadaId, fechaDesde, fechaHasta, estadoModuloId } = req.query;
  const { rol_id_rol: userRoleId, id_usuario: userId } = req.user; // <-- OBTENER DATOS DEL USUARIO
  const ID_ROL_ADMIN = 1;

  try {
    connection = await getConnection();
    let params = {};
    let baseSql = `
       SELECT M.NOMBRE_MODULO as "hora", COUNT(RM.MODULO_ID_MODULO) as "cantidad"
       FROM RESERVAMODULO RM
       JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO
    `;
    let joins = [`JOIN RESERVA R ON RM.RESERVA_ID_RESERVA = R.ID_RESERVA`];
    let whereClauses = [];

    // --- NUEVA LÓGICA DE FILTRADO POR ROL ---
    if (userRoleId !== ID_ROL_ADMIN) {
      joins.push(`
        JOIN EXAMEN EX_FILTER ON R.EXAMEN_ID_EXAMEN = EX_FILTER.ID_EXAMEN
        JOIN SECCION S_FILTER ON EX_FILTER.SECCION_ID_SECCION = S_FILTER.ID_SECCION
        JOIN ASIGNATURA A_FILTER ON S_FILTER.ASIGNATURA_ID_ASIGNATURA = A_FILTER.ID_ASIGNATURA
        JOIN USUARIOCARRERA UC ON A_FILTER.CARRERA_ID_CARRERA = UC.CARRERA_ID_CARRERA
      `);
      whereClauses.push(`UC.USUARIO_ID_USUARIO = :userId`);
      params.userId = userId;
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    if (jornadaId) {
      if (!joins.some((j) => j.includes('JOIN SECCION S ON'))) {
        joins.push(`JOIN EXAMEN EX ON R.EXAMEN_ID_EXAMEN = EX.ID_EXAMEN`);
        joins.push(`JOIN SECCION S ON EX.SECCION_ID_SECCION = S.ID_SECCION`);
      }
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
      ' ' +
      joins.join(' ') +
      (whereClauses.length > 0 ? ` WHERE ` + whereClauses.join(' AND ') : '') +
      ` GROUP BY M.NOMBRE_MODULO, M.ORDEN ORDER BY M.ORDEN`;

    const result = await connection.execute(finalSql, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener datos de módulos agendados');
  } finally {
    if (connection) await connection.close().catch((e) => console.error(e));
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
  // Filtros que vienen desde el frontend
  const {
    sedeId,
    escuelaId,
    carreraId,
    asignaturaId,
    jornadaId,
    fechaDesde,
    fechaHasta,
    estadoReservaId,
  } = req.query;

  // 1. OBTENER DATOS DEL USUARIO LOGUEADO
  const { rol_id_rol: userRoleId, id_usuario: userId } = req.user;
  const ID_ROL_ADMIN = 1;

  try {
    connection = await getConnection();
    let params = {};

    // La consulta base se mantiene igual
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
        JOIN ESTADO ES_EX ON E.ESTADO_ID_ESTADO = ES_EX.ID_ESTADO
        JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
        JOIN ASIGNATURA A ON S.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
        JOIN CARRERA CRR ON A.CARRERA_ID_CARRERA = CRR.ID_CARRERA
        JOIN ESCUELA ESC ON CRR.ESCUELA_ID_ESCUELA = ESC.ID_ESCUELA
        JOIN SEDE SED ON ESC.SEDE_ID_SEDE = SED.ID_SEDE
    `;
    let joins = [];
    let whereClauses = [];

    // 2. AÑADIR FILTRADO POR ROL SI NO ES ADMIN
    if (userRoleId !== ID_ROL_ADMIN) {
      // Unimos la cadena de tablas hasta USUARIOCARRERA
      joins.push(
        `JOIN USUARIOCARRERA UC ON CRR.ID_CARRERA = UC.CARRERA_ID_CARRERA`
      );
      // Y añadimos la condición para que solo traiga datos de las carreras asociadas a este usuario
      whereClauses.push(`UC.USUARIO_ID_USUARIO = :userId`);
      params.userId = userId;
    }

    // 3. APLICAR EL RESTO DE LOS FILTROS (sin cambios aquí)
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
      whereClauses.push(
        `R.FECHA_RESERVA BETWEEN TRUNC(SYSDATE, 'IW') AND TRUNC(SYSDATE, 'IW') + 6`
      );
    }
    if (estadoReservaId) {
      whereClauses.push(`E.ESTADO_ID_ESTADO = :estadoReservaId`);
      params.estadoReservaId = parseInt(estadoReservaId);
    }

    // 4. CONSTRUIR Y EJECUTAR LA CONSULTA FINAL (sin cambios aquí)
    let finalSql = baseSql + ' ' + joins.join(' ');
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
