import { getConnection } from '../db.js';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';

const ROL_DOCENTE_ID = 2; // Asegúrate de que este sea el ID de tu rol DOCENTE

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
  // Limpia los objetos de enlace para eliminar propiedades con valor 'undefined'
  const clean = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined)
    );

  // 1) Intentar seleccionar un registro existente
  const selectRes = await connection.execute(sqlSelect, clean(bindSelect), {
    autoCommit: false, // Parte de una transacción mayor
    outFormat: oracledb.OUT_FORMAT_ARRAY, // Forzar formato de array para facilitar el acceso a la primera columna
  });

  if (selectRes.rows.length > 0) {
    return selectRes.rows[0][0]; // Devuelve el ID existente
  }

  // 2) Si no existe, intentar insertar un nuevo registro y obtener el nuevo ID
  const bindVars = {
    ...clean(bindInsert),
    newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }, // Parámetro de salida para el nuevo ID
  };
  const insertRes = await connection.execute(sqlInsert, bindVars, {
    autoCommit: false, // Parte de una transacción mayor
    outFormat: oracledb.OUT_FORMAT_ARRAY, // Forzar formato de array para el resultado
  });

  // Extraer el nuevo ID del resultado del BIND_OUT
  const newId = insertRes.outBinds.newId;
  if (newId !== undefined && newId !== null) {
    return Array.isArray(newId) ? newId[0] : newId;
  }

  // Si llegamos aquí, algo salió mal y no se obtuvo el nuevo ID
  throw new Error(
    `No se pudo obtener el ID del nuevo registro tras la inserción. SQL: ${sqlInsert}`
  );
}

/**
 * Controlador para gestionar la carga masiva de datos desde un archivo.
 * Procesa datos de Escuelas, Jornadas, Carreras, Asignaturas, Secciones, Usuarios (Docentes)
 * y Planes de Estudio, estableciendo sus relaciones.
 */
export const handleCargaMasiva = async (req, res) => {
  // Obtiene el ID de la sede de los parámetros de la URL
  const idSedeParaEstaCarga = Number(req.params.sedeId);
  const datosParaCargar = req.body; // Los datos del archivo Excel procesado (JSON)

  let conn; // Variable para la conexión a la base de datos
  let insertedCount = {
    escuela: 0,
    jornada: 0,
    carrera: 0,
    asignatura: 0,
    seccion: 0,
    docente: 0,
    plan_estudio: 0, // Se cuenta aquí porque se insertan en este flujo
    asoc_usuario_seccion: 0,
    asoc_carrera_plan: 0, // Se cuenta aquí porque se asocian en este flujo
    examen: 0,
  };
  let updatedCount = {
    docente: 0,
  };
  let ignoredCount = {
    fila_total: 0,
    docente_existente: 0,
    email_docente_en_uso: 0,
    seccion_no_encontrada: 0,
    edificio_no_encontrado: 0,
    carrera_existente: 0,
    asignatura_existente: 0,
    seccion_existente: 0,
    examen_existente: 0,
    plan_estudio_no_valido: 0, // Puede ocurrir si la cadena del plan está vacía o malformada
  };
  const errorsDetallados = []; // Para acumular mensajes de error/advertencia por fila

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
        idEscuela = await obtenerOInsertar(
          conn,
          'SELECT ID_ESCUELA FROM ADMIN.ESCUELA WHERE UPPER(NOMBRE_ESCUELA) = UPPER(:nombre) AND SEDE_ID_SEDE = :idSede',
          'INSERT INTO ADMIN.ESCUELA (ID_ESCUELA, NOMBRE_ESCUELA, FECHA_CREACION_ESCUELA, SEDE_ID_SEDE) VALUES (SEQ_ESCUELA.NEXTVAL, :nombre, SYSTIMESTAMP, :idSede) RETURNING ID_ESCUELA INTO :newId',
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga },
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga }
        );
        insertedCount.escuela++;
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
          idJornada = await obtenerOInsertar(
            conn,
            'SELECT ID_JORNADA FROM ADMIN.JORNADA WHERE UPPER(COD_JORNADA) = :codJornada',
            'INSERT INTO ADMIN.JORNADA (ID_JORNADA, NOMBRE_JORNADA, COD_JORNADA) VALUES (SEQ_JORNADA.NEXTVAL, :nombre, :codJornadaInsert) RETURNING ID_JORNADA INTO :newId',
            { codJornada: codJornadaParaOperaciones },
            {
              nombre: nombreJornadaOriginal,
              codJornadaInsert: codJornadaParaOperaciones,
            }
          );
          insertedCount.jornada++;
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

      // --- 3. Procesar Carrera (¡NOMBRE_CARRERA = Plan Estudio concatenado!) ---
      const planesEstudioStringCSV = String(fila['Plan Estudio'] ?? '').trim(); // Contenido original de la columna Plan Estudio
      let nombreCarreraInicial = ''; // Este será el NOMBRE_CARRERA en la DB

      // Divide por espacios O comas para obtener planes individuales
      const planesIndividualesParsed = planesEstudioStringCSV
        .split(/\s+|,/)
        .filter((p) => p.length > 0);

      if (planesIndividualesParsed.length > 0) {
        // Concatena los planes con comas para formar el NOMBRE_CARRERA inicial en la BD
        nombreCarreraInicial = planesIndividualesParsed.join(',');
      } else {
        errorsDetallados.push({
          fila: filaNum,
          error:
            'Columna "Plan Estudio" vacía o inválida. Se esperaba al menos un plan de estudio para formar el Nombre de Carrera. Fila ignorada.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      let idCarrera = null;

      try {
        // Usamos el nombre concatenado como NOMBRE_CARRERA
        idCarrera = await obtenerOInsertar(
          conn,
          'SELECT ID_CARRERA FROM ADMIN.CARRERA WHERE NOMBRE_CARRERA = :nombre AND ESCUELA_ID_ESCUELA = :idEscuela',
          'INSERT INTO ADMIN.CARRERA (ID_CARRERA, NOMBRE_CARRERA, ESCUELA_ID_ESCUELA) VALUES (SEQ_CARRERA.NEXTVAL, :nombre, :idEscuela) RETURNING ID_CARRERA INTO :newId',
          { nombre: nombreCarreraInicial, idEscuela },
          { nombre: nombreCarreraInicial, idEscuela }
        );
        insertedCount.carrera++;

        // --- Procesar Planes de Estudio Individuales y asociar a la Carrera ---
        // Esta lógica se mantiene, utilizando los planes individuales ya parseados de 'Plan Estudio'.
        for (const planNombre of planesIndividualesParsed) {
          if (!planNombre) continue;

          let idPlanEstudio;
          try {
            idPlanEstudio = await obtenerOInsertar(
              conn,
              'SELECT ID_PLAN_ESTUDIO FROM ADMIN.PLAN_ESTUDIO WHERE UPPER(NOMBRE_PLAN_ESTUDIO) = UPPER(:planNombre)',
              'INSERT INTO ADMIN.PLAN_ESTUDIO (ID_PLAN_ESTUDIO, NOMBRE_PLAN_ESTUDIO) VALUES (SEQ_PLAN_ESTUDIO.NEXTVAL, :planNombre) RETURNING ID_PLAN_ESTUDIO INTO :newId',
              { planNombre: planNombre },
              { planNombre: planNombre }
            );
            // La función obtenerOInsertar ya cuenta si inserta uno nuevo. Aquí solo actualizamos el contador global.
            insertedCount.plan_estudio++;

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
          } catch (err) {
            errorsDetallados.push({
              fila: filaNum,
              error: `Error procesando Plan Estudio individual '${planNombre}' para Carrera '${nombreCarreraInicial}': ${err.message}`,
            });
            ignoredCount.plan_estudio_no_valido++;
          }
        }
      } catch (err) {
        errorsDetallados.push({
          fila: filaNum,
          error: `Error procesando Carrera inicial '${nombreCarreraInicial}': ${err.message}`,
        });
        ignoredCount.fila_total++;
        continue;
      }

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
        idAsignatura = await obtenerOInsertar(
          conn,
          'SELECT ID_ASIGNATURA FROM ADMIN.ASIGNATURA WHERE NOMBRE_ASIGNATURA = :nombre AND CARRERA_ID_CARRERA = :idCarrera',
          'INSERT INTO ADMIN.ASIGNATURA (ID_ASIGNATURA, NOMBRE_ASIGNATURA, CARRERA_ID_CARRERA) VALUES (SEQ_ASIGNATURA.NEXTVAL, :nombre, :idCarrera) RETURNING ID_ASIGNATURA INTO :newId',
          { nombre: nombreAsignaturaOriginal, idCarrera },
          { nombre: nombreAsignaturaOriginal, idCarrera }
        );
        insertedCount.asignatura++;
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
        idSeccion = await obtenerOInsertar(
          conn,
          'SELECT ID_SECCION FROM ADMIN.SECCION WHERE NOMBRE_SECCION = :nombre AND ASIGNATURA_ID_ASIGNATURA = :idAsignatura AND JORNADA_ID_JORNADA = :idJornada',
          'INSERT INTO ADMIN.SECCION (ID_SECCION, NOMBRE_SECCION, ASIGNATURA_ID_ASIGNATURA, JORNADA_ID_JORNADA) VALUES (SEQ_SECCION.NEXTVAL, :nombre, :idAsignatura, :idJornada) RETURNING ID_SECCION INTO :newId',
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada },
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada }
        );
        insertedCount.seccion++;
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
        errorsDetallados.push({
          fila: filaNum,
          error:
            'Rut Docente vacío. No se procesará docente ni sus asociaciones.',
        });
        ignoredCount.fila_total++;
        continue;
      }

      try {
        const selDocente = await conn.execute(
          'SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE ID_DOCENTE = :rutDocente',
          { rutDocente },
          { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
        );

        if (selDocente.rows.length > 0) {
          idUsuarioDocente = selDocente.rows[0].ID_USUARIO;
          let updateDocenteSql = `UPDATE ADMIN.USUARIO SET FECHA_ACTU_USUARIO = SYSDATE`;
          const updateDocenteBinds = { idUsuario: idUsuarioDocente };

          if (emailDocente) {
            const emailConflict = await conn.execute(
              `SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE LOWER(EMAIL_USUARIO) = LOWER(:email) AND ID_USUARIO != :idUsuario`,
              { email: emailDocente, idUsuario: idUsuarioDocente },
              { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
            );
            if (emailConflict.rows.length === 0) {
              updateDocenteSql += `, EMAIL_USUARIO = LOWER(:email)`;
              updateDocenteBinds.email = emailDocente;
            } else {
              errorsDetallados.push({
                fila: filaNum,
                rut: rutDocente,
                error: `Email '${emailDocente}' ya está en uso por otro usuario. Email no actualizado para este docente.`,
              });
            }
          }
          if (nombreCompletoDocente) {
            updateDocenteSql += `, NOMBRE_USUARIO = :nombre`;
            updateDocenteBinds.nombre = nombreCompletoDocente;
          }

          if (Object.keys(updateDocenteBinds).length > 1) {
            await conn.execute(
              updateDocenteSql + ` WHERE ID_USUARIO = :idUsuario`,
              updateDocenteBinds
            );
            updatedCount.docente++;
          } else {
            ignoredCount.docente_existente++;
          }
        } else {
          if (!emailDocente) {
            errorsDetallados.push({
              fila: filaNum,
              rut: rutDocente,
              error:
                'Email de Docente vacío para nuevo usuario. Inserción ignorada.',
            });
            ignoredCount.fila_total++;
            continue;
          }
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
            ignoredCount.fila_total++;
            continue;
          }

          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(rutDocente, saltRounds);
          const insertDocenteRes = await conn.execute(
            `INSERT INTO ADMIN.USUARIO (
                 ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
                 FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL, ID_DOCENTE
               ) VALUES (
                 SEQ_USUARIO.NEXTVAL, :nombre, LOWER(:email), :password,
                 SYSDATETIMESTAMP, SYSTIMESTAMP, :rol, :idDocente
               ) RETURNING ID_USUARIO INTO :newId`,
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

        // --- 7. Asociar Docente a Sección (USUARIOSECCION) ---
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
        ignoredCount.fila_total++;
        continue;
      }

      // --- 8. Procesar Examen ---
      const nombreExamen = String(fila['Nombre Seccion'] ?? '').trim();
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

      if (idSeccion) {
        try {
          const examenExists = await conn.execute(
            `SELECT ID_EXAMEN FROM ADMIN.EXAMEN WHERE NOMBRE_EXAMEN = :nombre AND SECCION_ID_SECCION = :idSeccion`,
            { nombre: nombreExamen, idSeccion },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
          );

          if (examenExists.rows.length === 0) {
            await conn.execute(
              `INSERT INTO ADMIN.EXAMEN (
                   ID_EXAMEN, NOMBRE_EXAMEN, INSCRITOS_EXAMEN, TIPO_PROCESAMIENTO_EXAMEN,
                   PLATAFORMA_PROSE_EXAMEN, SITUACION_EVALUATIVA_EXAMEN, CANTIDAD_MODULOS_EXAMEN,
                   SECCION_ID_SECCION, ESTADO_ID_ESTADO, ID_EVENTO
                 ) VALUES (
                   SEQ_EXAMEN.NEXTVAL, :nombre, :inscritos, :tipoProc, :plataforma,
                   :situacion, :modulos, :idSeccion, 1, :idEvento -- Estado 1 (ACTIVO)
                 )`,
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
          ignoredCount.fila_total++;
          continue;
        }
      }
    }

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
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('Error durante el rollback:', rollbackErr);
      }
    }
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
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión:', closeErr);
      }
    }
  }
};
