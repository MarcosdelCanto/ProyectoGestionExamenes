import { getConnection } from '../db.js';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';

const ROL_DOCENTE_ID = 2; // Asegúrate de que este sea el ID de tu rol DOCENTE

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

/**
 * Controlador para gestionar la carga masiva de datos desde un archivo.
 */
export const handleCargaMasiva = async (req, res) => {
  const idSedeParaEstaCarga = Number(req.params.sedeId);
  const datosParaCargar = req.body;

  let conn;
  let insertedCount = {
    escuela: 0,
    jornada: 0,
    carrera: 0,
    asignatura: 0,
    seccion: 0,
    docente: 0,
    plan_estudio: 0,
    asoc_usuario_seccion: 0,
    asoc_carrera_plan: 0,
    examen: 0,
  };
  let updatedCount = {
    docente: 0,
  };
  let ignoredCount = {
    fila_total: 0,
    docente_existente: 0,
    email_docente_en_uso: 0,
    carrera_existente: 0,
    examen_existente: 0,
    plan_estudio_no_valido: 0,
  };
  const errorsDetallados = [];

  try {
    conn = await getConnection();

    for (let i = 0; i < datosParaCargar.length; i++) {
      const fila = datosParaCargar[i];
      const filaNum = i + 1;

      // --- 1. Procesar Escuela ---
      const nombreEscuelaOriginal = String(fila.Escuela ?? '').trim();
      let idEscuela = null;

      if (!nombreEscuelaOriginal) {
        ignoredCount.fila_total++;
        errorsDetallados.push({
          fila: filaNum,
          error: 'Nombre de Escuela vacío. Fila ignorada.',
        });
        continue;
      }

      try {
        const resultadoEscuela = await obtenerOInsertar(
          conn,
          'SELECT ID_ESCUELA FROM ADMIN.ESCUELA WHERE UPPER(NOMBRE_ESCUELA) = UPPER(:nombre) AND SEDE_ID_SEDE = :idSede',
          'INSERT INTO ADMIN.ESCUELA (ID_ESCUELA, NOMBRE_ESCUELA, FECHA_CREACION_ESCUELA, SEDE_ID_SEDE) VALUES (SEQ_ESCUELA.NEXTVAL, :nombre, SYSTIMESTAMP, :idSede) RETURNING ID_ESCUELA INTO :newId',
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga },
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga }
        );
        idEscuela = resultadoEscuela.id;
        if (resultadoEscuela.creado) insertedCount.escuela++;
      } catch (err) {
        errorsDetallados.push({
          fila: filaNum,
          error: `Error procesando Escuela '${nombreEscuelaOriginal}': ${err.message}`,
        });
        ignoredCount.fila_total++;
        continue;
      }

      // --- 2. Procesar Jornada ---
      const nombreJornadaOriginal = String(fila['Jornada'] ?? '').trim();
      let codJornadaInput = String(fila['CodJornada'] ?? '').trim();
      let idJornada = null;
      let codJornadaParaOperaciones = '';

      if (codJornadaInput) {
        codJornadaParaOperaciones = codJornadaInput
          .substring(0, 2)
          .toUpperCase();
      } else if (nombreJornadaOriginal) {
        codJornadaParaOperaciones = nombreJornadaOriginal
          .substring(0, 2)
          .toUpperCase();
      }

      if (codJornadaParaOperaciones) {
        try {
          const resultadoJornada = await obtenerOInsertar(
            conn,
            'SELECT ID_JORNADA FROM ADMIN.JORNADA WHERE UPPER(COD_JORNADA) = :codJornada',
            'INSERT INTO ADMIN.JORNADA (ID_JORNADA, NOMBRE_JORNADA, COD_JORNADA) VALUES (SEQ_JORNADA.NEXTVAL, :nombre, :codJornadaInsert) RETURNING ID_JORNADA INTO :newId',
            { codJornada: codJornadaParaOperaciones },
            {
              nombre: nombreJornadaOriginal,
              codJornadaInsert: codJornadaParaOperaciones,
            }
          );
          idJornada = resultadoJornada.id;
          if (resultadoJornada.creado) insertedCount.jornada++;
        } catch (err) {
          errorsDetallados.push({
            fila: filaNum,
            error: `Error procesando Jornada '${nombreJornadaOriginal}': ${err.message}`,
          });
          ignoredCount.fila_total++;
          continue;
        }
      } else {
        errorsDetallados.push({
          fila: filaNum,
          error: 'No se pudo determinar CodJornada. Fila ignorada.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      // --- 3. Procesar Carrera y Planes de Estudio (LÓGICA CORREGIDA) ---
      const planesEstudioStringCSV = String(fila['Plan Estudio'] ?? '').trim();
      const planesIndividualesParsed = planesEstudioStringCSV
        .split(/\s+|,/)
        .filter((p) => p.length > 0);

      if (planesIndividualesParsed.length === 0) {
        errorsDetallados.push({
          fila: filaNum,
          error: 'Columna "Plan Estudio" vacía o inválida. Fila ignorada.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      let idCarrera = null;
      let carreraEncontrada = false;

      // **INICIO DE LA VALIDACIÓN CLAVE**
      // Buscamos si ALGUNO de los planes de estudio de la fila ya está asociado a una carrera existente.
      for (const planNombre of planesIndividualesParsed) {
        const carreraExistente = await conn.execute(
          `SELECT cpe.CARRERA_ID_CARRERA FROM ADMIN.CARRERA_PLAN_ESTUDIO cpe
           JOIN ADMIN.PLAN_ESTUDIO pe ON cpe.PLAN_ESTUDIO_ID_PLAN_ESTUDIO = pe.ID_PLAN_ESTUDIO
           WHERE pe.NOMBRE_PLAN_ESTUDIO = :planNombre`,
          { planNombre },
          { outFormat: oracledb.OUT_FORMAT_ARRAY }
        );

        if (carreraExistente.rows.length > 0) {
          idCarrera = carreraExistente.rows[0][0]; // Usamos el ID de la carrera encontrada
          carreraEncontrada = true;
          break; // Si encontramos una, no necesitamos buscar más
        }
      }

      try {
        if (carreraEncontrada) {
          // Si la carrera ya existe (sin importar su nombre actual), la reutilizamos.
          ignoredCount.carrera_existente++;
        } else {
          // Si no se encontró ninguna carrera asociada a los planes, creamos una nueva.
          // Usamos la concatenación de planes como nombre temporal.
          const nombreCarreraInicial = planesIndividualesParsed.join(',');
          const resultadoCarrera = await obtenerOInsertar(
            conn,
            'SELECT ID_CARRERA FROM ADMIN.CARRERA WHERE NOMBRE_CARRERA = :nombre AND ESCUELA_ID_ESCUELA = :idEscuela',
            'INSERT INTO ADMIN.CARRERA (ID_CARRERA, NOMBRE_CARRERA, ESCUELA_ID_ESCUELA) VALUES (SEQ_CARRERA.NEXTVAL, :nombre, :idEscuela) RETURNING ID_CARRERA INTO :newId',
            { nombre: nombreCarreraInicial, idEscuela },
            { nombre: nombreCarreraInicial, idEscuela }
          );
          idCarrera = resultadoCarrera.id;
          if (resultadoCarrera.creado) {
            insertedCount.carrera++;
          }
        }
        // **FIN DE LA VALIDACIÓN CLAVE**

        // Ahora, con el idCarrera correcto (sea existente o nuevo), procesamos los planes y asociaciones.
        for (const planNombre of planesIndividualesParsed) {
          const resultadoPlan = await obtenerOInsertar(
            conn,
            'SELECT ID_PLAN_ESTUDIO FROM ADMIN.PLAN_ESTUDIO WHERE UPPER(NOMBRE_PLAN_ESTUDIO) = UPPER(:planNombre)',
            'INSERT INTO ADMIN.PLAN_ESTUDIO (ID_PLAN_ESTUDIO, NOMBRE_PLAN_ESTUDIO) VALUES (SEQ_PLAN_ESTUDIO.NEXTVAL, :planNombre) RETURNING ID_PLAN_ESTUDIO INTO :newId',
            { planNombre },
            { planNombre }
          );
          const idPlanEstudio = resultadoPlan.id;
          if (resultadoPlan.creado) insertedCount.plan_estudio++;

          // Asociamos el plan a la carrera si la asociación no existe
          const checkAssocPlan = await conn.execute(
            `SELECT COUNT(*) FROM ADMIN.CARRERA_PLAN_ESTUDIO WHERE CARRERA_ID_CARRERA = :idCarrera AND PLAN_ESTUDIO_ID_PLAN_ESTUDIO = :idPlanEstudio`,
            { idCarrera, idPlanEstudio },
            { outFormat: oracledb.OUT_FORMAT_ARRAY, autoCommit: false }
          );
          if (checkAssocPlan.rows[0][0] === 0) {
            await conn.execute(
              `INSERT INTO ADMIN.CARRERA_PLAN_ESTUDIO (CARRERA_ID_CARRERA, PLAN_ESTUDIO_ID_PLAN_ESTUDIO, FECHA_ASOCIACION) VALUES (:idCarrera, :idPlanEstudio, SYSTIMESTAMP)`,
              { idCarrera, idPlanEstudio },
              { autoCommit: false }
            );
            insertedCount.asoc_carrera_plan++;
          }
        }
      } catch (err) {
        errorsDetallados.push({
          fila: filaNum,
          error: `Error procesando Carrera o Planes de Estudio: ${err.message}`,
        });
        ignoredCount.fila_total++;
        continue;
      }

      // ... El resto del código para Asignatura, Sección, Docente y Examen sigue igual ...
      // --- 4. Procesar Asignatura ---
      const nombreAsignaturaOriginal = String(
        fila['Nom. Asignatura'] ?? ''
      ).trim();
      let idAsignatura = null;

      if (!nombreAsignaturaOriginal) {
        errorsDetallados.push({
          fila: filaNum,
          error: 'Nombre de Asignatura vacío. Fila ignorada.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      try {
        const resultadoAsignatura = await obtenerOInsertar(
          conn,
          'SELECT ID_ASIGNATURA FROM ADMIN.ASIGNATURA WHERE NOMBRE_ASIGNATURA = :nombre AND CARRERA_ID_CARRERA = :idCarrera',
          'INSERT INTO ADMIN.ASIGNATURA (ID_ASIGNATURA, NOMBRE_ASIGNATURA, CARRERA_ID_CARRERA) VALUES (SEQ_ASIGNATURA.NEXTVAL, :nombre, :idCarrera) RETURNING ID_ASIGNATURA INTO :newId',
          { nombre: nombreAsignaturaOriginal, idCarrera },
          { nombre: nombreAsignaturaOriginal, idCarrera }
        );
        idAsignatura = resultadoAsignatura.id;
        if (resultadoAsignatura.creado) insertedCount.asignatura++;
      } catch (err) {
        errorsDetallados.push({
          fila: filaNum,
          error: `Error procesando Asignatura '${nombreAsignaturaOriginal}': ${err.message}`,
        });
        ignoredCount.fila_total++;
        continue;
      }

      // --- 5. Procesar Sección ---
      const nombreSeccionOriginal = String(fila.Seccion ?? '').trim();
      let idSeccion = null;

      if (!nombreSeccionOriginal) {
        errorsDetallados.push({
          fila: filaNum,
          error: 'Nombre de Sección vacío. Fila ignorada.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      try {
        const resultadoSeccion = await obtenerOInsertar(
          conn,
          'SELECT ID_SECCION FROM ADMIN.SECCION WHERE NOMBRE_SECCION = :nombre AND ASIGNATURA_ID_ASIGNATURA = :idAsignatura AND JORNADA_ID_JORNADA = :idJornada',
          'INSERT INTO ADMIN.SECCION (ID_SECCION, NOMBRE_SECCION, ASIGNATURA_ID_ASIGNATURA, JORNADA_ID_JORNADA) VALUES (SEQ_SECCION.NEXTVAL, :nombre, :idAsignatura, :idJornada) RETURNING ID_SECCION INTO :newId',
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada },
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada }
        );
        idSeccion = resultadoSeccion.id;
        if (resultadoSeccion.creado) insertedCount.seccion++;
      } catch (err) {
        errorsDetallados.push({
          fila: filaNum,
          error: `Error procesando Sección '${nombreSeccionOriginal}': ${err.message}`,
        });
        ignoredCount.fila_total++;
        continue;
      }

      // --- 6. Procesar Usuario (Docente) ---
      const rutDocente = String(fila['Rut Docente'] ?? '').trim();
      const nombreCompletoDocente = String(
        fila['Instruct.(den.)'] ?? ''
      ).trim();
      const emailDocente = String(fila['Mail Duoc'] ?? '').trim();
      let idUsuarioDocente = null;

      if (!rutDocente) {
        // Si no hay rut, simplemente no procesamos el docente y continuamos con el examen.
      } else {
        try {
          const selDocente = await conn.execute(
            'SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE ID_DOCENTE = :rutDocente',
            { rutDocente },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
          );
          if (selDocente.rows.length > 0) {
            idUsuarioDocente = selDocente.rows[0].ID_USUARIO;
            ignoredCount.docente_existente++;
          } else {
            if (!emailDocente) {
              errorsDetallados.push({
                fila: filaNum,
                rut: rutDocente,
                error:
                  'Email de Docente vacío para nuevo usuario. Inserción ignorada.',
              });
            } else {
              const emailConflictGlobal = await conn.execute(
                `SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE LOWER(EMAIL_USUARIO) = LOWER(:email)`,
                { email: emailDocente },
                { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
              );
              if (emailConflictGlobal.rows.length > 0) {
                errorsDetallados.push({
                  fila: filaNum,
                  rut: rutDocente,
                  error: `Email '${emailDocente}' ya está en uso. Inserción de docente ignorada.`,
                });
                ignoredCount.email_docente_en_uso++;
              } else {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(
                  rutDocente,
                  saltRounds
                );
                const insertDocenteRes = await conn.execute(
                  `INSERT INTO ADMIN.USUARIO (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO, FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL, ID_DOCENTE) VALUES (SEQ_USUARIO.NEXTVAL, :nombre, LOWER(:email), :password, SYSTIMESTAMP, SYSTIMESTAMP, :rol, :idDocente) RETURNING ID_USUARIO INTO :newId`,
                  {
                    nombre: nombreCompletoDocente,
                    email: emailDocente,
                    password: hashedPassword,
                    rol: ROL_DOCENTE_ID,
                    idDocente: rutDocente,
                    newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                  },
                  { autoCommit: false }
                );
                idUsuarioDocente = insertDocenteRes.outBinds.newId[0];
                insertedCount.docente++;
              }
            }
          }
          if (idUsuarioDocente && idSeccion) {
            const checkAssoc = await conn.execute(
              `SELECT COUNT(*) FROM ADMIN.USUARIOSECCION WHERE USUARIO_ID_USUARIO = :idUsuario AND SECCION_ID_SECCION = :idSeccion`,
              { idUsuario: idUsuarioDocente, idSeccion },
              { outFormat: oracledb.OUT_FORMAT_ARRAY, autoCommit: false }
            );
            if (checkAssoc.rows[0][0] === 0) {
              await conn.execute(
                `INSERT INTO ADMIN.USUARIOSECCION (USUARIO_ID_USUARIO, SECCION_ID_SECCION) VALUES (:idUsuario, :idSeccion)`,
                { idUsuario: idUsuarioDocente, idSeccion },
                { autoCommit: false }
              );
              insertedCount.asoc_usuario_seccion++;
            }
          }
        } catch (err) {
          errorsDetallados.push({
            fila: filaNum,
            rut: rutDocente,
            error: `Error procesando Docente o Asociación: ${err.message}`,
          });
        }
      }

      // --- 8. Procesar Examen ---
      const nombreExamen = String(fila['Nombre Seccion'] ?? '').trim();
      if (idSeccion && nombreExamen) {
        try {
          const examenExists = await conn.execute(
            `SELECT ID_EXAMEN FROM ADMIN.EXAMEN WHERE NOMBRE_EXAMEN = :nombre AND SECCION_ID_SECCION = :idSeccion`,
            { nombre: nombreExamen, idSeccion },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
          );
          if (examenExists.rows.length === 0) {
            const inscritosExamen =
              fila['Cant. ins.'] != null && !isNaN(Number(fila['Cant. ins.']))
                ? Number(fila['Cant. ins.'])
                : null;
            const tipoProcesamiento = String(
              fila['Tipo de Procesamiento'] ?? ''
            ).trim();
            const plataformaProse = String(
              fila['Plataforma de Procesamiento'] ?? ''
            ).trim();
            const situacionEvaluativa = String(
              fila['Situación Evaluativa'] ?? ''
            ).trim();
            const cantidadModulos = 3;
            const idEvento =
              fila['ID evento'] != null && !isNaN(Number(fila['ID evento']))
                ? Number(fila['ID evento'])
                : null;
            await conn.execute(
              `INSERT INTO ADMIN.EXAMEN (ID_EXAMEN, NOMBRE_EXAMEN, INSCRITOS_EXAMEN, TIPO_PROCESAMIENTO_EXAMEN, PLATAFORMA_PROSE_EXAMEN, SITUACION_EVALUATIVA_EXAMEN, CANTIDAD_MODULOS_EXAMEN, SECCION_ID_SECCION, ESTADO_ID_ESTADO, ID_EVENTO) VALUES (SEQ_EXAMEN.NEXTVAL, :nombre, :inscritos, :tipoProc, :plataforma, :situacion, :modulos, :idSeccion, 1, :idEvento)`,
              {
                nombre: nombreExamen,
                inscritos: inscritosExamen,
                tipoProc: tipoProcesamiento,
                plataforma: plataformaProse,
                situacion: situacionEvaluativa,
                modulos: cantidadModulos,
                idSeccion: idSeccion,
                idEvento: idEvento,
              },
              { autoCommit: false }
            );
            insertedCount.examen++;
          } else {
            ignoredCount.examen_existente++;
          }
        } catch (err) {
          errorsDetallados.push({
            fila: filaNum,
            error: `Error procesando Examen '${nombreExamen}': ${err.message}`,
          });
        }
      }
    } // Fin del bucle for

    await conn.commit();

    return res.status(201).json({
      message: 'Carga masiva completada.',
      summary: {
        inserted: insertedCount,
        updated: updatedCount,
        ignored: ignoredCount,
      },
      details:
        errorsDetallados.length > 0
          ? errorsDetallados
          : 'No se registraron errores específicos por fila.',
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error general en handleCargaMasiva:', err);
    return res.status(500).json({
      error: 'Error interno del servidor durante la carga masiva.',
      details: err.message || 'Error desconocido.',
      processedSummary: {
        inserted: insertedCount,
        updated: updatedCount,
        ignored: ignoredCount,
      },
      specificErrors: errorsDetallados,
    });
  } finally {
    if (conn) await conn.close();
  }
};
