import { getConnection } from '../db.js';
import oracledb from 'oracledb';

/**
 * Función auxiliar para buscar un ID o insertar el registro si no existe.
 * Esta función es genérica y se usará para varias entidades (Escuela, Jornada, Carrera, Asignatura, Sección, Usuario, Plan_Estudio).
 * @param {oracledb.Connection} connection - La conexión activa a la base de datos.
 * @param {string} sqlSelect - Consulta SQL para seleccionar el ID de un registro existente.
 * @param {string} sqlInsert - Consulta SQL para insertar un nuevo registro.
 * @param {Object} bindSelect - Parámetros de enlace para la consulta SELECT.
 * @param {Object} bindInsert - Parámetros de enlace para la consulta INSERT (incluyendo ':newId' para el valor de retorno).
 * @returns {Promise<number>} El ID del registro existente o recién insertado.
 * @throws {Error} Si no se puede obtener o insertar el ID.
 */
async function obtenerOInsertar(
  connection,
  sqlSelect,
  sqlInsert,
  bindSelect,
  bindInsert
) {
  const clean = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined)
    );

  const selectRes = await connection.execute(sqlSelect, clean(bindSelect), {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_ARRAY,
  });

  if (selectRes.rows.length > 0) {
    return selectRes.rows[0][0];
  }

  const bindVars = {
    ...clean(bindInsert),
    newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  };
  const insertRes = await connection.execute(sqlInsert, bindVars, {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_ARRAY,
  });

  const newId = insertRes.outBinds.newId;
  if (newId !== undefined && newId !== null) {
    return Array.isArray(newId) ? newId[0] : newId;
  }

  throw new Error(
    `No se pudo obtener el ID del nuevo registro tras la inserción. SQL: ${sqlInsert}`
  );
}

/**
 * Obtiene todas las carreras con su escuela asociada y sus planes de estudio.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getAllCarreras = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    // Modificación para incluir los planes de estudio asociados usando LISTAGG
    const result = await conn.execute(
      `SELECT
          c.id_carrera,
          c.nombre_carrera,
          c.escuela_id_escuela,
          e.nombre_escuela,
          LISTAGG(pe.nombre_plan_estudio, ',') WITHIN GROUP (ORDER BY pe.nombre_plan_estudio) AS PLANES_ESTUDIO_ASOCIADOS
       FROM
          ADMIN.CARRERA c
       JOIN
          ADMIN.ESCUELA e ON c.escuela_id_escuela = e.id_escuela
       LEFT JOIN -- Usamos LEFT JOIN para incluir carreras que quizás no tengan planes aún
          ADMIN.CARRERA_PLAN_ESTUDIO cpe ON c.id_carrera = cpe.carrera_id_carrera
       LEFT JOIN
          ADMIN.PLAN_ESTUDIO pe ON cpe.plan_estudio_id_plan_estudio = pe.id_plan_estudio
       GROUP BY -- Agrupamos por los campos de carrera y escuela para que LISTAGG funcione
          c.id_carrera, c.nombre_carrera, c.escuela_id_escuela, e.nombre_escuela
       ORDER BY
          c.id_carrera`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carreras:', err);
    res.status(500).json({ error: 'Error al obtener carreras' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Obtiene una carrera por su ID.
 * @param {object} req - Objeto de solicitud con parámetros de ruta.
 * @param {object} res - Objeto de respuesta.
 */
export const getCarreraById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT c.*, s.nombre_escuela
       FROM ADMIN.CARRERA c
       JOIN ADMIN.ESCUELA s ON c.escuela_id_escuela = s.id_escuela
       WHERE c.id_carrera = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Carrera no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener carrera:', err);
    res.status(500).json({ error: 'Error al obtener carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Crea una nueva carrera.
 * @param {object} req - Objeto de solicitud con el cuerpo de la solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const createCarrera = async (req, res) => {
  const { nombre_carrera, escuela_id_escuela } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ADMIN.CARRERA (id_carrera, nombre_carrera, escuela_id_escuela)
       VALUES (ADMIN.SEQ_CARRERA.NEXTVAL, :nombre, :escuela)
       RETURNING id_carrera INTO :newId`,
      {
        nombre: nombre_carrera,
        escuela: escuela_id_escuela,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_carrera: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear carrera:', err);
    res.status(500).json({ error: 'Error al crear carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Actualiza una carrera existente.
 * @param {object} req - Objeto de solicitud con parámetros de ruta y cuerpo de la solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const updateCarrera = async (req, res) => {
  const { id } = req.params;
  const { nombre_carrera, escuela_id_escuela } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ADMIN.CARRERA
       SET nombre_carrera = :nombre,
           escuela_id_escuela = :escuela
       WHERE id_carrera = :id`,
      {
        id,
        nombre: nombre_carrera,
        escuela: escuela_id_escuela,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Carrera no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Carrera actualizada' });
  } catch (err) {
    console.error('Error al actualizar carrera:', err);
    res.status(500).json({ error: 'Error al actualizar carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Elimina una carrera.
 * @param {object} req - Objeto de solicitud con parámetros de ruta.
 * @param {object} res - Objeto de respuesta.
 */
export const deleteCarrera = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();

    // Iniciar transacción
    // Obtener todas las asignaturas de la carrera
    const asignaturasResult = await conn.execute(
      `SELECT ID_ASIGNATURA FROM ASIGNATURA WHERE CARRERA_ID_CARRERA = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const asignaturasIds = asignaturasResult.rows.map(
      (asig) => asig.ID_ASIGNATURA
    );

    if (asignaturasIds.length > 0) {
      // Para cada asignatura, obtener sus secciones
      const seccionesResult = await conn.execute(
        `SELECT ID_SECCION FROM SECCION WHERE ASIGNATURA_ID_ASIGNATURA IN (${asignaturasIds.join(',')})`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const seccionesIds = seccionesResult.rows.map((sec) => sec.ID_SECCION);

      if (seccionesIds.length > 0) {
        // Para cada sección, obtener sus exámenes
        const examenesResult = await conn.execute(
          `SELECT ID_EXAMEN FROM EXAMEN WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const examenIds = examenesResult.rows.map((ex) => ex.ID_EXAMEN);

        if (examenIds.length > 0) {
          const examenBinds = examenIds.map((examenId) => ({ id: examenId }));
          // Eliminar dependencias de los exámenes
          await conn.executeMany(
            `DELETE FROM RESERVA_DOCENTES WHERE RESERVA_ID_RESERVA IN (SELECT ID_RESERVA FROM RESERVA WHERE EXAMEN_ID_EXAMEN = :id)`,
            examenBinds
          );
          await conn.executeMany(
            `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA IN (SELECT ID_RESERVA FROM RESERVA WHERE EXAMEN_ID_EXAMEN = :id)`,
            examenBinds
          );
          await conn.executeMany(
            `DELETE FROM RESERVA WHERE EXAMEN_ID_EXAMEN = :id`,
            examenBinds
          );
        }

        // Eliminar exámenes
        await conn.execute(
          `DELETE FROM EXAMEN WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`
        );
        // Eliminar asociaciones de usuarios a secciones
        await conn.execute(
          `DELETE FROM USUARIOSECCION WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`
        );
      }
      // Eliminar secciones
      await conn.execute(
        `DELETE FROM SECCION WHERE ASIGNATURA_ID_ASIGNATURA IN (${asignaturasIds.join(',')})`
      );
    }

    // Eliminar asignaturas
    await conn.execute(
      `DELETE FROM ASIGNATURA WHERE CARRERA_ID_CARRERA = :id`,
      [id]
    );
    // Eliminar asociaciones de usuarios a carreras
    await conn.execute(
      `DELETE FROM USUARIOCARRERA WHERE CARRERA_ID_CARRERA = :id`,
      [id]
    );

    // Finalmente, eliminar la carrera
    const result = await conn.execute(
      `DELETE FROM CARRERA WHERE id_carrera = :id`,
      [id]
    );

    if (result.rowsAffected === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    await conn.commit();
    res
      .status(200)
      .json({
        message:
          'Carrera y todos sus registros asociados eliminados correctamente.',
      });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error('Error en rollback:', rbErr);
      }
    }
    console.error('Error al eliminar carrera:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar carrera y sus dependencias.' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión:', closeErr);
      }
    }
  }
};
/**
 * Obtiene todas las carreras asociadas a una escuela específica.
 * @param {object} req - Objeto de solicitud con parámetros de ruta.
 * @param {object} res - Objeto de respuesta.
 */
export const getCarrerasByEscuela = async (req, res) => {
  let conn; // Cambiado a 'conn' para consistencia
  try {
    conn = await getConnection();
    const { escuelaId } = req.params;
    const sql = `SELECT ID_CARRERA, NOMBRE_CARRERA FROM ADMIN.CARRERA WHERE ESCUELA_ID_ESCUELA = :escuelaId ORDER BY NOMBRE_CARRERA`;
    const result = await conn.execute(sql, [escuelaId], {
      // Usar conn.execute consistentemente
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carreras por escuela:', err); // Mensaje de error más específico
    res.status(500).json({ error: 'Error al obtener carreras por escuela' }); // Mensaje de error más específico
  } finally {
    if (conn) await conn.close();
  }
};

// --- CONTROLADOR para la carga masiva de actualización de carreras por plan de estudio ---
export const updateCarrerasFromPlanEstudio = async (req, res) => {
  const datosParaActualizar = req.body; // Array de objetos con las columnas del CSV/Excel

  let conn;
  let summary = {
    updatedCarreras: 0,
    insertedPlans: 0,
    newAssociations: 0,
    ignoredRows: 0,
    skippedValidation: 0, // Nuevo contador para filas saltadas por validación
  };
  let specificErrors = [];

  try {
    conn = await getConnection();

    for (let i = 0; i < datosParaActualizar.length; i++) {
      const fila = datosParaActualizar[i];
      const filaNum = i + 1;

      // 'Plan Estudio' de la planilla de actualización (ej. "2020" o "2020,2021" o "1111211,1116316")
      const planesEstudioStringFromCSV = String(
        fila['Plan Estudio'] ?? ''
      ).trim();
      // 'Nombre Carrera' de la planilla de actualización (ej. "Ingeniería en Informática")
      const nuevoNombreCarrera = String(fila['Nombre Carrera'] ?? '').trim();

      if (!planesEstudioStringFromCSV || !nuevoNombreCarrera) {
        summary.ignoredRows++;
        specificErrors.push({
          fila: filaNum,
          error:
            'Faltan datos obligatorios ("Plan Estudio" o "Nombre Carrera").',
        });
        continue;
      }

      // Convertir la cadena de planes de estudio a un array de planes individuales.
      // Se divide por espacios O comas.
      const planesIndividualesFromCSV = planesEstudioStringFromCSV
        .split(/\s+|,/)
        .filter((p) => p.length > 0);

      if (planesIndividualesFromCSV.length === 0) {
        summary.ignoredRows++;
        specificErrors.push({
          fila: filaNum,
          error: `Columna "Plan Estudio" vacía o inválida en la planilla. No se encontraron planes para validar o asociar.`,
        });
        continue;
      }

      let idCarrera;
      let currentCarreraNameInDB; // Nombre actual de la carrera en la BD (ej. "1111211,1116316")

      try {
        // 1. Encontrar la Carrera existente por su NOMBRE_CARRERA actual (que es el Plan Estudio concatenado de la carga inicial)
        const resultCarrera = await conn.execute(
          `SELECT ID_CARRERA, NOMBRE_CARRERA FROM ADMIN.CARRERA WHERE NOMBRE_CARRERA = :nombreActualEnDB`,
          { nombreActualEnDB: planesEstudioStringFromCSV }, // ¡Buscamos por el contenido de la columna 'Plan Estudio' del CSV!
          { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
        );

        if (resultCarrera.rows.length === 0) {
          summary.ignoredRows++;
          specificErrors.push({
            fila: filaNum,
            error: `Carrera no encontrada con el nombre (Plan Estudio concatenado): '${planesEstudioStringFromCSV}'.`,
          });
          continue;
        }

        idCarrera = resultCarrera.rows[0].ID_CARRERA;
        currentCarreraNameInDB = resultCarrera.rows[0].NOMBRE_CARRERA; // Nombre actual de la carrera en la BD

        // --- INICIO DE VALIDACIÓN CLAVE: El nombre actual de la carrera en la BD debe contener al menos UN plan de estudio del CSV ---
        // Esto verifica que el NOMBRE_CARRERA actual en la DB (ej. "1111211,1116316,1111212")
        // contenga AL MENOS UNO de los planes de estudio de la columna 'Plan Estudio' del CSV de actualización.
        const hasMatchingPlanInCurrentName = planesIndividualesFromCSV.some(
          (plan) => currentCarreraNameInDB.includes(plan)
        );

        if (!hasMatchingPlanInCurrentName) {
          summary.skippedValidation++;
          specificErrors.push({
            fila: filaNum,
            error: `Validación fallida: El nombre de la carrera en la BD ('${currentCarreraNameInDB}') no contiene ninguno de los planes de estudio proporcionados ('${planesEstudioStringFromCSV}'). Fila ignorada.`,
          });
          continue; // Saltar esta fila si la validación falla
        }
        // --- FIN DE VALIDACIÓN CLAVE ---

        // 2. Actualizar el nombre de la carrera en la BD al nombre "limpio"
        if (currentCarreraNameInDB !== nuevoNombreCarrera) {
          await conn.execute(
            `UPDATE ADMIN.CARRERA SET NOMBRE_CARRERA = :nuevoNombre WHERE ID_CARRERA = :idCarrera`,
            { nuevoNombre: nuevoNombreCarrera, idCarrera: idCarrera },
            { autoCommit: false }
          );
          summary.updatedCarreras++;
        }

        // 3. Eliminar asociaciones de planes de estudio antiguas para esta carrera
        await conn.execute(
          `DELETE FROM ADMIN.CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA = :idCarrera`,
          { idCarrera: idCarrera },
          { autoCommit: false }
        );

        // 4. Procesar y asociar los nuevos Planes de Estudio (numéricos)
        // Utiliza los planes individuales de la columna 'Plan Estudio' del CSV de actualización.
        for (const planNombre of planesIndividualesFromCSV) {
          if (!planNombre) continue;

          let idPlanEstudio;
          try {
            idPlanEstudio = await obtenerOInsertar(
              conn,
              'SELECT ID_PLAN_ESTUDIO FROM ADMIN.PLAN_ESTUDIO WHERE UPPER(NOMBRE_PLAN_ESTUDIO) = UPPER(:planNombre)',
              'INSERT INTO ADMIN.PLAN_ESTUDIO (ID_PLAN_ESTUDIO, NOMBRE_PLAN_ESTUDIO) VALUES (ADMIN.SEQ_PLAN_ESTUDIO.NEXTVAL, :planNombre) RETURNING ID_PLAN_ESTUDIO INTO :newId',
              { planNombre: planNombre },
              { planNombre: planNombre }
            );

            summary.insertedPlans++;

            await conn.execute(
              `INSERT INTO ADMIN.CARRERA_PLAN_ESTUDIO (CARRERA_ID_CARRERA, PLAN_ESTUDIO_ID_PLAN_ESTUDIO, FECHA_ASOCIACION) VALUES (:idCarrera, :idPlanEstudio, SYSTIMESTAMP)`,
              { idCarrera: idCarrera, idPlanEstudio: idPlanEstudio },
              { autoCommit: false }
            );
            summary.newAssociations++;
          } catch (err) {
            specificErrors.push({
              fila: filaNum,
              error: `Error procesando Plan de Estudio '${planNombre}' para Carrera '${nuevoNombreCarrera}': ${err.message}`,
            });
          }
        }
      } catch (err) {
        specificErrors.push({
          fila: filaNum,
          error: `Error crítico al procesar carrera con plan concatenado '${planesEstudioStringFromCSV}': ${err.message}`,
        });
        summary.ignoredRows++;
        continue;
      }
    }

    await conn.commit();

    return res.status(200).json({
      message: 'Proceso de actualización de carreras y planes completado.',
      summary: summary,
      specificErrors:
        specificErrors.length > 0
          ? specificErrors
          : 'No se registraron errores detallados por fila.',
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('Error durante el rollback:', rollbackErr);
      }
    }
    console.error('Error general en updateCarrerasFromPlanEstudio:', err);
    return res.status(500).json({
      error:
        'Error interno del servidor durante la actualización masiva de carreras.',
      details: err.message || 'Error desconocido.',
      processedSummary: summary,
      specificErrors: specificErrors,
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión:', closeErr);
      }
    }
  }
};
