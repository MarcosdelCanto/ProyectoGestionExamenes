import { getConnection } from '../db.js';
import oracledb from 'oracledb';

/**
 * Función auxiliar para buscar un ID o insertar el registro si no existe.
 * Devuelve tanto el ID como un indicador de si fue creado.
 * @returns {Promise<{id: number, creado: boolean}>} Un objeto con el ID del registro y un booleano.
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
    return { id: selectRes.rows[0][0], creado: false };
  }

  const bindVars = {
    ...clean(bindInsert),
    newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  };
  const insertRes = await connection.execute(sqlInsert, bindVars, {
    autoCommit: false,
  });

  const newIdArray = insertRes.outBinds.newId;
  if (newIdArray && newIdArray.length > 0) {
    return { id: newIdArray[0], creado: true };
  }

  throw new Error(
    `No se pudo obtener el ID del nuevo registro tras la inserción. SQL: ${sqlInsert}`
  );
}

// --- Las funciones CRUD básicas (getAll, getById, create, update, delete, getByEscuela) permanecen sin cambios ---

export const getAllCarreras = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
          c.id_carrera,
          c.nombre_carrera,
          c.escuela_id_escuela,
          e.nombre_escuela,
          LISTAGG(pe.nombre_plan_estudio, ', ') WITHIN GROUP (ORDER BY pe.nombre_plan_estudio) AS PLANES_ESTUDIO_ASOCIADOS
       FROM
          ADMIN.CARRERA c
       JOIN
          ADMIN.ESCUELA e ON c.escuela_id_escuela = e.id_escuela
       LEFT JOIN
          ADMIN.CARRERA_PLAN_ESTUDIO cpe ON c.id_carrera = cpe.carrera_id_carrera
       LEFT JOIN
          ADMIN.PLAN_ESTUDIO pe ON cpe.plan_estudio_id_plan_estudio = pe.id_plan_estudio
       GROUP BY
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

export const deleteCarrera = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const asignaturasResult = await conn.execute(
      `SELECT ID_ASIGNATURA FROM ASIGNATURA WHERE CARRERA_ID_CARRERA = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const asignaturasIds = asignaturasResult.rows.map(
      (asig) => asig.ID_ASIGNATURA
    );
    if (asignaturasIds.length > 0) {
      const seccionesResult = await conn.execute(
        `SELECT ID_SECCION FROM SECCION WHERE ASIGNATURA_ID_ASIGNATURA IN (${asignaturasIds.join(',')})`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const seccionesIds = seccionesResult.rows.map((sec) => sec.ID_SECCION);
      if (seccionesIds.length > 0) {
        const examenesResult = await conn.execute(
          `SELECT ID_EXAMEN FROM EXAMEN WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const examenIds = examenesResult.rows.map((ex) => ex.ID_EXAMEN);
        if (examenIds.length > 0) {
          const examenBinds = examenIds.map((examenId) => ({ id: examenId }));
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
        await conn.execute(
          `DELETE FROM EXAMEN WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`
        );
        await conn.execute(
          `DELETE FROM USUARIOSECCION WHERE SECCION_ID_SECCION IN (${seccionesIds.join(',')})`
        );
      }
      await conn.execute(
        `DELETE FROM SECCION WHERE ASIGNATURA_ID_ASIGNATURA IN (${asignaturasIds.join(',')})`
      );
    }
    await conn.execute(
      `DELETE FROM ASIGNATURA WHERE CARRERA_ID_CARRERA = :id`,
      [id]
    );
    await conn.execute(
      `DELETE FROM CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA = :id`,
      [id]
    );
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
    if (conn) await conn.rollback();
    console.error('Error al eliminar carrera:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar carrera y sus dependencias.' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getCarrerasByEscuela = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { escuelaId } = req.params;
    const sql = `SELECT ID_CARRERA, NOMBRE_CARRERA FROM ADMIN.CARRERA WHERE ESCUELA_ID_ESCUELA = :escuelaId ORDER BY NOMBRE_CARRERA`;
    const result = await conn.execute(sql, [escuelaId], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carreras por escuela:', err);
    res.status(500).json({ error: 'Error al obtener carreras por escuela' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Actualiza carreras y sus planes de estudio desde una carga masiva (SOLO ACTUALIZACIÓN).
 */
export const updateCarrerasFromPlanEstudio = async (req, res) => {
  const datosParaActualizar = req.body;

  let conn;
  let summary = {
    updatedCarreras: 0,
    insertedPlans: 0,
    newAssociations: 0,
    ignoredRows: 0,
  };
  let specificErrors = [];

  try {
    conn = await getConnection();

    for (let i = 0; i < datosParaActualizar.length; i++) {
      const fila = datosParaActualizar[i];
      const filaNum = i + 1;

      const planesEstudioStringCSV = String(fila['Plan Estudio'] ?? '').trim();
      const nuevoNombreCarrera = String(fila['Nombre Carrera'] ?? '').trim();

      if (!planesEstudioStringCSV || !nuevoNombreCarrera) {
        summary.ignoredRows++;
        specificErrors.push({
          fila: filaNum,
          error:
            'Faltan datos obligatorios ("Plan Estudio" o "Nombre Carrera").',
        });
        continue;
      }

      const planesIndividualesFromCSV = planesEstudioStringCSV
        .split(/\s+|,/)
        .filter((p) => p.length > 0);
      if (planesIndividualesFromCSV.length === 0) {
        summary.ignoredRows++;
        specificErrors.push({
          fila: filaNum,
          error: `Columna "Plan Estudio" vacía o inválida.`,
        });
        continue;
      }

      let idCarrera = null;
      let carreraExistenteEncontrada = false;

      for (const plan of planesIndividualesFromCSV) {
        const carreraRes = await conn.execute(
          `SELECT cpe.CARRERA_ID_CARRERA
             FROM ADMIN.CARRERA_PLAN_ESTUDIO cpe
             JOIN ADMIN.PLAN_ESTUDIO pe ON cpe.PLAN_ESTUDIO_ID_PLAN_ESTUDIO = pe.ID_PLAN_ESTUDIO
             WHERE pe.NOMBRE_PLAN_ESTUDIO = :planNombre`,
          { planNombre: plan },
          { outFormat: oracledb.OUT_FORMAT_ARRAY }
        );
        if (carreraRes.rows.length > 0) {
          idCarrera = carreraRes.rows[0][0];
          carreraExistenteEncontrada = true;
          break;
        }
      }

      if (carreraExistenteEncontrada) {
        try {
          // --- RUTA DE ACTUALIZACIÓN ---
          const carreraDetailsRes = await conn.execute(
            // **INICIO DE LA CORRECCIÓN: Usamos TRIM para limpiar el nombre de la BD**
            `SELECT TRIM(nombre_carrera) AS NOMBRE_CARRERA FROM ADMIN.CARRERA WHERE id_carrera = :idCarrera`,
            // **FIN DE LA CORRECCIÓN**
            { idCarrera },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
          );
          const currentDBName = carreraDetailsRes.rows[0].NOMBRE_CARRERA;

          if (currentDBName !== nuevoNombreCarrera) {
            await conn.execute(
              `UPDATE ADMIN.CARRERA SET NOMBRE_CARRERA = :nuevoNombre WHERE ID_CARRERA = :idCarrera`,
              { nuevoNombre: nuevoNombreCarrera, idCarrera },
              { autoCommit: false }
            );
            summary.updatedCarreras++;
          }

          await conn.execute(
            `DELETE FROM ADMIN.CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA = :idCarrera`,
            { idCarrera },
            { autoCommit: false }
          );

          for (const planNombre of planesIndividualesFromCSV) {
            const resultadoPlan = await obtenerOInsertar(
              conn,
              'SELECT ID_PLAN_ESTUDIO FROM ADMIN.PLAN_ESTUDIO WHERE UPPER(NOMBRE_PLAN_ESTUDIO) = UPPER(:planNombre)',
              'INSERT INTO ADMIN.PLAN_ESTUDIO (ID_PLAN_ESTUDIO, NOMBRE_PLAN_ESTUDIO) VALUES (ADMIN.SEQ_PLAN_ESTUDIO.NEXTVAL, :planNombre) RETURNING ID_PLAN_ESTUDIO INTO :newId',
              { planNombre },
              { planNombre }
            );
            const idPlanEstudio = resultadoPlan.id;
            if (resultadoPlan.creado) summary.insertedPlans++;

            await conn.execute(
              `INSERT INTO ADMIN.CARRERA_PLAN_ESTUDIO (CARRERA_ID_CARRERA, PLAN_ESTUDIO_ID_PLAN_ESTUDIO, FECHA_ASOCIACION) VALUES (:idCarrera, :idPlanEstudio, SYSTIMESTAMP)`,
              { idCarrera, idPlanEstudio },
              { autoCommit: false }
            );
            summary.newAssociations++;
          }
        } catch (err) {
          specificErrors.push({
            fila: filaNum,
            error: `Error al actualizar la carrera '${nuevoNombreCarrera}': ${err.message}`,
          });
          summary.ignoredRows++;
        }
      } else {
        // --- RUTA DE IGNORAR ---
        summary.ignoredRows++;
        specificErrors.push({
          fila: filaNum,
          error: `Carrera con planes '${planesEstudioStringCSV}' no encontrada. Fila ignorada.`,
        });
      }
    } // Fin del bucle for

    await conn.commit();

    return res.status(200).json({
      message: 'Proceso de actualización de carreras completado.',
      summary: summary,
      specificErrors:
        specificErrors.length > 0
          ? specificErrors
          : 'No se registraron errores detallados.',
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error general en updateCarrerasFromPlanEstudio:', err);
    return res.status(500).json({
      error: 'Error interno del servidor durante la carga masiva de carreras.',
      details: err.message || 'Error desconocido.',
      processedSummary: summary,
      specificErrors: specificErrors,
    });
  } finally {
    if (conn) await conn.close();
  }
};
