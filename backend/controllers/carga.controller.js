import { getConnection } from '../db.js';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';

const ROL_DOCENTE_ID = 2;

/**
 * Función auxiliar para buscar un ID o insertar el registro si no existe.
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

  // 1) SELECT
  const selectRes = await connection.execute(sqlSelect, clean(bindSelect), {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_ARRAY, // <-- forzamos array
  });
  // console.log('   → Filas SELECT:', selectRes.rows);
  if (selectRes.rows.length > 0) {
    return selectRes.rows[0][0];
  }

  // 2) INSERT + RETURNING
  const bindVars = {
    ...clean(bindInsert),
    newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  };
  const insertRes = await connection.execute(sqlInsert, bindVars, {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_ARRAY, // <-- igual aquí
  });
  // console.log('   → outBinds:', insertRes.outBinds);
  const newId = insertRes.outBinds.newId;
  if (newId !== undefined) {
    return Array.isArray(newId) ? newId[0] : newId;
  }

  throw new Error(`No vino newId tras INSERT: ${sqlInsert}`);
}

/**
 * Controlador para gestionar la carga masiva de datos desde un archivo.
 */
export const handleCargaMasiva = async (req, res) => {
  // toma la sede de los params
  const idSedeParaEstaCarga = Number(req.params.sedeId);
  // console.log('idSedeParaEstaCarga:', idSedeParaEstaCarga);
  const datosParaCargar = req.body;
  let conn;
  try {
    conn = await getConnection();

    for (const fila of datosParaCargar) {
      // console.log('\n--- Nueva Fila ---');
      // console.log('Procesando fila del Excel:', fila);

      // --- Escuela ---
      const nombreEscuelaOriginal = String(fila.Escuela ?? '').trim();
      let idEscuela = null;

      if (!nombreEscuelaOriginal) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): El nombre de la Escuela está vacío para la fila. No se procesará Escuela ni sus dependientes.`
        );
      } else {
        // console.log(
        //   `  Buscando/Creando Escuela: Nombre="${nombreEscuelaOriginal}", idSede=${idSedeParaEstaCarga}`
        // );
        // VERIFICA: Que tu tabla ESCUELA no tenga ESTADO_ID_ESTADO si no lo especificas en el INSERT
        idEscuela = await obtenerOInsertar(
          conn,
          'SELECT ID_ESCUELA FROM ADMIN.ESCUELA WHERE UPPER(NOMBRE_ESCUELA) = UPPER(:nombre) AND SEDE_ID_SEDE = :idSede',
          'INSERT INTO ADMIN.ESCUELA (ID_ESCUELA, NOMBRE_ESCUELA, FECHA_CREACION_ESCUELA, SEDE_ID_SEDE) VALUES (SEQ_ESCUELA.NEXTVAL, :nombre, SYSTIMESTAMP, :idSede) RETURNING ID_ESCUELA INTO :newId',
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga },
          { nombre: nombreEscuelaOriginal, idSede: idSedeParaEstaCarga }
        );
      }

      // --- Jornada ---
      const nombreJornadaOriginal =
        String(fila['Jornada'] ?? '').trim() || 'Diurno';
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
        if (codJornadaParaOperaciones) {
          console.warn(
            `ADVERTENCIA (Carga Masiva): CodJornada no fue provisto. Derivando a "${codJornadaParaOperaciones}" desde "${nombreJornadaOriginal}" para la fila.`
          );
        }
      }

      if (codJornadaParaOperaciones) {
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
        // console.log(
        //   `  Jornada: "${nombreJornadaOriginal}" / "${codJornadaParaOperaciones}", ID_Jornada: ${idJornada}`
        // );
      } else {
        console.warn(
          'ADVERTENCIA (Carga Masiva): No se pudo determinar un CodJornada válido. ID_Jornada será nulo para la fila:',
          fila
        );
      }

      // --- Verificaciones antes de procesar Carrera ---
      if (!idEscuela) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se procesará Carrera ni subsiguientes porque ID_Escuela es nulo para la fila.`
        );
        continue;
      }
      // VERIFICA: Si Jornada es obligatoria para Carrera y idJornada es null, considera usar 'continue'
      // if (!idJornada) {
      //   console.warn(`ADVERTENCIA: ID_Jornada es nulo. No se procesará Carrera.`);
      //   continue;
      // }

      // --- Carrera ---
      const codGenerico = String(fila['Cod.Gene.'] ?? '').trim(); // Asegurar .trim() para consistencia
      const nombreCarrera = codGenerico.split(' ')[0] || 'Sin Codigo Generico';
      let idCarrera = null;

      if (!nombreCarrera) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): Nombre de Carrera vacío o no extraíble para la fila.`
        );
      } else {
        // VERIFICA TU TABLA CARRERA: ¿Tiene JORNADA_ID_JORNADA? Si no, este INSERT es correcto.
        // Si sí la tiene y es NOT NULL, deberás incluirla y asegurarte que idJornada tenga valor.
        idCarrera = await obtenerOInsertar(
          conn,
          'SELECT ID_CARRERA FROM ADMIN.CARRERA WHERE NOMBRE_CARRERA = :nombre AND ESCUELA_ID_ESCUELA = :idEscuela',
          'INSERT INTO ADMIN.CARRERA (ID_CARRERA, NOMBRE_CARRERA, ESCUELA_ID_ESCUELA) VALUES (SEQ_CARRERA.NEXTVAL, :nombre, :idEscuela) RETURNING ID_CARRERA INTO :newId',
          { nombre: nombreCarrera, idEscuela },
          { nombre: nombreCarrera, idEscuela }
        );
        // console.log(`  Carrera: "${nombreCarrera}", ID_Carrera: ${idCarrera}`);
      }

      // --- Verificación antes de procesar Asignatura ---
      if (!idCarrera) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se procesará Asignatura porque ID_Carrera es nulo para la fila.`
        );
        continue;
      }

      // --- Asignatura ---
      const nombreAsignaturaOriginal = String(
        fila['Nom. Asignatura'] ?? ''
      ).trim();
      // const codigoAsignaturaOriginal = (fila['C.Asig.'] || '').trim(); // Descomentar y usar si tu tabla ASIGNATURA tiene CODIGO_ASIGNATURA
      let idAsignatura = null;

      if (!nombreAsignaturaOriginal) {
        console.warn(
          'ADVERTENCIA (Carga Masiva): Nombre de Asignatura vacío para la fila.'
        );
        // } else if (!codigoAsignaturaOriginal) { // Descomentar si usas codigoAsignaturaOriginal
        //   console.warn('ADVERTENCIA (Carga Masiva): Código de Asignatura vacío para la fila.');
      } else {
        // VERIFICA: Si tu tabla ASIGNATURA tiene CODIGO_ASIGNATURA, añádelo al SELECT y al INSERT
        idAsignatura = await obtenerOInsertar(
          conn,
          'SELECT ID_ASIGNATURA FROM ADMIN.ASIGNATURA WHERE NOMBRE_ASIGNATURA = :nombre AND CARRERA_ID_CARRERA = :idCarrera',
          'INSERT INTO ADMIN.ASIGNATURA (ID_ASIGNATURA, NOMBRE_ASIGNATURA, CARRERA_ID_CARRERA) VALUES (SEQ_ASIGNATURA.NEXTVAL, :nombre, :idCarrera) RETURNING ID_ASIGNATURA INTO :newId',
          { nombre: nombreAsignaturaOriginal, idCarrera },
          { nombre: nombreAsignaturaOriginal, idCarrera }
          // Si usas código: { codigo: codigoAsignaturaOriginal, nombre: nombreAsignaturaOriginal, idCarrera } para el bindInsert
          // y el SELECT debería ser por código.
        );
        // console.log(
        //   `  Asignatura: "${nombreAsignaturaOriginal}", ID_Asignatura: ${idAsignatura}`
        // );
      }

      // --- Verificaciones antes de procesar Sección ---
      if (!idAsignatura) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se procesará Sección porque ID_Asignatura es nulo para la fila.`
        );
        continue;
      }
      if (!idJornada) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se procesará Sección porque ID_Jornada es nulo para la fila (y es requerido para Sección).`
        );
        continue;
      }

      // --- Sección ---
      const nombreSeccionOriginal = String(fila.Seccion ?? '').trim();
      let idSeccion = null;

      if (!nombreSeccionOriginal) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): Nombre de Sección vacío para la fila.`
        );
      } else {
        idSeccion = await obtenerOInsertar(
          conn,
          'SELECT ID_SECCION FROM ADMIN.SECCION WHERE NOMBRE_SECCION = :nombre AND ASIGNATURA_ID_ASIGNATURA = :idAsignatura AND JORNADA_ID_JORNADA = :idJornada',
          'INSERT INTO ADMIN.SECCION (ID_SECCION, NOMBRE_SECCION, ASIGNATURA_ID_ASIGNATURA, JORNADA_ID_JORNADA) VALUES (SEQ_SECCION.NEXTVAL, :nombre, :idAsignatura, :idJornada) RETURNING ID_SECCION INTO :newId',
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada },
          { nombre: nombreSeccionOriginal, idAsignatura, idJornada }
        );
        // console.log(
        //   `  Sección: "${nombreSeccionOriginal}", ID_Sección: ${idSeccion}`
        // );
      }

      // --- Usuario (Docente) ---
      // Convertir siempre a string antes de trim()
      const rutDocente = String(fila['Rut Docente'] ?? '').trim();
      let idUsuario = null;

      if (!rutDocente) {
        console.warn(
          'ADVERTENCIA (Carga Masiva): Rut Docente vacío para la fila:',
          fila
        );
      } else {
        // VALIDATION: Check if DOCENTE already exists by RUT
        const docenteExists = await conn.execute(
          'SELECT COUNT(*) AS total FROM ADMIN.USUARIO WHERE ID_DOCENTE = :rutDocente',
          { rutDocente },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (docenteExists.rows[0].TOTAL > 0) {
          console.warn(
            `ADVERTENCIA (Carga Masiva): El DOCENTE con RUT ${rutDocente} ya existe. Fila omitida.`,
            fila
          );
          continue; // Skip this row
        }
        const nombreCompletoDocente = String(
          fila['Instruct.(den.)'] ?? ''
        ).trim();
        // Generar un email más válido, aunque simple. Considera una mejor estrategia.
        const emailUsuarioGenerado = `${rutDocente.replace(/[^0-9kK]+/g, '')}@docente.duoc.cl`;
        idUsuario = await obtenerOInsertar(
          conn,
          'SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE EMAIL_USUARIO = :email',
          'INSERT INTO ADMIN.USUARIO (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO, FECHA_CREA_USUARIO, ROL_ID_ROL,ID_DOCENTE) VALUES (SEQ_USUARIO.NEXTVAL, :nombre, :email, :password, SYSTIMESTAMP, :rol, :rutDocente) RETURNING ID_USUARIO INTO :newId',
          { email: emailUsuarioGenerado },
          {
            nombre: nombreCompletoDocente,
            email: emailUsuarioGenerado,
            password: await bcrypt.hash(rutDocente, 10),
            rol: ROL_DOCENTE_ID,
            rutDocente: rutDocente,
          }
        );
        // console.log(
        //   `  Usuario (Docente): "${nombreCompletoDocente}", ID_Usuario: ${idUsuario}`
        // );
      }

      // --- Verificación antes de Asociación Usuario-Sección ---
      if (idUsuario && idSeccion) {
        const checkAssoc = await conn.execute(
          `SELECT COUNT(*) AS "total" FROM ADMIN.USUARIOSECCION WHERE USUARIO_ID_USUARIO = :idUsuario AND SECCION_ID_SECCION = :idSeccion`,
          { idUsuario, idSeccion },
          { autoCommit: false }
        );
        if (checkAssoc.rows[0][0] === 0) {
          await conn.execute(
            `INSERT INTO ADMIN.USUARIOSECCION (USUARIO_ID_USUARIO, SECCION_ID_SECCION) VALUES (:idUsuario, :idSeccion)`,
            { idUsuario, idSeccion },
            { autoCommit: false }
          );
          // console.log(
          //   `  Asociación Usuario-Sección creada para ID_Usuario: ${idUsuario}, ID_Sección: ${idSeccion}`
          // );
        } else {
          // console.log(
          //   `  Asociación Usuario-Sección ya existe para ID_Usuario: ${idUsuario}, ID_Sección: ${idSeccion}`
          // );
        }
      } else if (rutDocente && (!idUsuario || !idSeccion)) {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se pudo asociar Usuario a Sección. RutDocente: ${rutDocente}, idUsuario: ${idUsuario}, idSeccion: ${idSeccion}. Fila:`,
          fila
        );
      }

      // --- Examen ---
      const nombreExamen = String(
        fila['Nombre Seccion'] ?? 'no informado' // String() constructor is fine here if `fila['Nombre Seccion']` could be non-string after `??`
      ).trim();
      const inscritosExamen =
        fila['Cant. ins.'] != null && !isNaN(Number(fila['Cant. ins.']))
          ? Number(fila['Cant. ins.'])
          : null; // Usar null si no es un número válido
      const tipoProcesamiento = String(
        fila['Tipo de Procesamiento'] ?? 'no informado'
      ).trim(); // String() constructor is fine here
      const plataformaProse = String(
        fila['Plataforma de Procesamiento'] ?? 'no informado'
      ).trim(); // String() constructor is fine here
      const situacionEvaluativa = String(
        fila['Situación Evaluativa'] ?? 'no informado'
      ).trim(); // String() constructor is fine here
      const cantidadModulos = 3;
      const idEvento =
        fila['ID evento'] != null && !isNaN(Number(fila['ID evento']))
          ? Number(fila['ID evento'])
          : null; // Usar null si no es un número válido

      if (idSeccion) {
        // Only proceed if idSeccion is not null
        // const idExamen = await obtenerOInsertar( // Variable was unused
        await obtenerOInsertar(
          conn,
          `SELECT ID_EXAMEN
             FROM ADMIN.EXAMEN
            WHERE NOMBRE_EXAMEN = :nombre
              AND SECCION_ID_SECCION = :idSeccion`,
          `INSERT INTO ADMIN.EXAMEN (
               ID_EXAMEN,
               NOMBRE_EXAMEN,
               INSCRITOS_EXAMEN,
               TIPO_PROCESAMIENTO_EXAMEN,
               PLATAFORMA_PROSE_EXAMEN,
               SITUACION_EVALUATIVA_EXAMEN,
               CANTIDAD_MODULOS_EXAMEN,
               SECCION_ID_SECCION,
               ESTADO_ID_ESTADO,
               ID_EVENTO
             ) VALUES (
               SEQ_EXAMEN.NEXTVAL,
               :nombre, :inscritos, :tipoProc, :plataforma,
               :situacion, :modulos, :idSeccion, 1, :idEvento
             ) RETURNING ID_EXAMEN INTO :newId`,
          {
            nombre: nombreExamen,
            idSeccion, // This will be a valid ID here
          },
          {
            nombre: nombreExamen,
            inscritos: inscritosExamen,
            tipoProc: tipoProcesamiento,
            plataforma: plataformaProse,
            situacion: situacionEvaluativa,
            modulos: cantidadModulos,
            idSeccion, // This will be a valid ID here
            idEvento,
          }
        );
        // console.log(`  Examen: "${nombreExamen}" procesado/creado.`); // Adjusted log message
      } else {
        console.warn(
          `ADVERTENCIA (Carga Masiva): No se procesará Examen porque ID_Seccion es nulo para la fila. Nombre Examen (del excel): "${nombreExamen}"`
        );
      }
    }

    await conn.commit();
    return res.status(201).json({ message: 'Carga completada.' });
  } catch (err) {
    if (conn) await conn.rollback();
    return res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
