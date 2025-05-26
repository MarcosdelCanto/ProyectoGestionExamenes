import { getConnection } from '../db.js';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';

const ROL_ALUMNO_ID = 3;

/**
 * Inserta o devuelve el ID de un usuario, usando INSERT … RETURNING si no existe.
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

  const finalBindSelect = clean(bindSelect);
  const resultadoSelect = await connection.execute(sqlSelect, finalBindSelect, {
    autoCommit: false, // Importante: autoCommit debe ser false dentro de una transacción mayor
    outFormat: oracledb.OUT_FORMAT_ARRAY, // Para obtener [ID]
  });
  if (resultadoSelect.rows.length > 0) {
    return resultadoSelect.rows[0][0]; // Devuelve el ID existente
  }

  const finalBindInsert = clean(bindInsert);
  const bindVars = {
    ...finalBindInsert,
    newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
  };
  const resultadoInsert = await connection.execute(sqlInsert, bindVars, {
    autoCommit: false, // Importante
  });

  if (
    resultadoInsert &&
    resultadoInsert.outBinds &&
    resultadoInsert.outBinds.newId &&
    resultadoInsert.outBinds.newId.length > 0
  ) {
    return resultadoInsert.outBinds.newId[0];
  } else {
    console.error(
      `ERROR en obtenerOInsertar (cargaAlumno): No se pudo obtener newId. SQL: ${sqlInsert}, Binds: ${JSON.stringify(finalBindInsert)}, Resultado del Insert: ${JSON.stringify(resultadoInsert)}`
    );
    throw new Error(
      `Fallo al obtener el ID para la inserción (cargaAlumno): ${sqlInsert.substring(0, 100)}...`
    );
  }
}

/**
 * Controlador para carga masiva de alumnos (rol=3).
 */
export const handleCargaAlumnos = async (req, res) => {
  const datos = req.body; // el JSON con las filas
  let conn;
  let alumnosInsertados = 0;
  let alumnosActualizados = 0; // Si implementaras lógica de actualización
  let asociacionesCreadas = 0;
  let filasIgnoradas = 0;

  try {
    conn = await getConnection();

    for (const fila of datos) {
      const nombreParticipante = String(fila['Nombre partic.'] ?? '').trim();
      const nombreSeccionExcel = String(fila['Seccion'] ?? '').trim(); // Columna 'Seccion' del Excel

      if (!nombreParticipante) {
        filasIgnoradas++;
        console.warn('Fila ignorada: Nombre de participante vacío.');
        continue;
      }

      const [apellido = '', nombreCompleto = ''] =
        nombreParticipante.split(',');
      const nombreUsuario = nombreCompleto.trim() + ' ' + apellido.trim();
      const emailUsuario = String(fila['Mail'] ?? '').trim();
      const plainPasswordAlumno = String(
        fila['Abrev.participante'] ?? ''
      ).trim(); // Contraseña en texto plano del archivo
      let hashedPasswordAlumno = '';

      if (!emailUsuario) {
        // Validar que el email exista, ya que es la clave para buscar/insertar
        filasIgnoradas++;
        console.warn(`Fila ignorada para "${nombreUsuario}": Email vacío.`);
        continue;
      }

      if (!plainPasswordAlumno) {
        // Si la contraseña abreviada está vacía, podríamos generar una aleatoria o marcar error
        // Por ahora, si está vacía, el hash será de una cadena vacía, lo cual no es ideal.
        // Considera generar una contraseña aleatoria si plainPasswordAlumno es vacío.
        console.warn(
          `ADVERTENCIA: Contraseña (Abrev.participante) vacía para alumno "${nombreUsuario}". Se usará hash de cadena vacía o se podría generar una aleatoria.`
        );
      }
      // Siempre hashear la contraseña, incluso si está vacía (bcrypt maneja esto)
      hashedPasswordAlumno = await bcrypt.hash(plainPasswordAlumno, 10);

      // 1. Obtener o insertar USUARIO (Alumno)
      let idAlumno;
      const selectUsuarioSql =
        'SELECT ID_USUARIO FROM ADMIN.USUARIO WHERE EMAIL_USUARIO = :email';
      const insertUsuarioSql = `INSERT INTO ADMIN.USUARIO (
                                   ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
                                   FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL
                                 ) VALUES (
                                   SEQ_USUARIO.NEXTVAL, :nombre, :email, :password,
                                   SYSTIMESTAMP, SYSTIMESTAMP, :rol
                                 ) RETURNING ID_USUARIO INTO :newId`;

      // Verificar si el usuario ya existe para contar inserciones vs actualizaciones (si se implementa)
      const usuarioExistente = await conn.execute(
        selectUsuarioSql,
        { email: emailUsuario },
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );

      idAlumno = await obtenerOInsertar(
        conn,
        selectUsuarioSql,
        insertUsuarioSql,
        { email: emailUsuario },
        {
          nombre: nombreUsuario,
          email: emailUsuario,
          password: hashedPasswordAlumno, // Usar la contraseña hasheada
          rol: ROL_ALUMNO_ID,
        }
      );

      if (usuarioExistente.rows.length === 0) {
        alumnosInsertados++;
      } else {
        // Aquí podrías implementar lógica de actualización si fuera necesario
        // y contar alumnosActualizados++
      }
      console.log(
        `  Procesado Alumno: "${nombreUsuario}", ID_Usuario: ${idAlumno}`
      );

      // 2. Obtener SECCION_ID_SECCION
      let idSeccion = null;
      if (nombreSeccionExcel) {
        const selectSeccionSql =
          'SELECT ID_SECCION FROM ADMIN.SECCION WHERE NOMBRE_SECCION = :nombreSeccion';
        const seccionResult = await conn.execute(
          selectSeccionSql,
          { nombreSeccion: nombreSeccionExcel },
          { outFormat: oracledb.OUT_FORMAT_ARRAY }
        );
        if (seccionResult.rows.length > 0) {
          idSeccion = seccionResult.rows[0][0];
          console.log(
            `  Sección encontrada: "${nombreSeccionExcel}", ID_Seccion: ${idSeccion}`
          );
        } else {
          console.warn(
            `  ADVERTENCIA: Sección "${nombreSeccionExcel}" no encontrada para el alumno "${nombreUsuario}". No se creará asociación.`
          );
        }
      } else {
        console.warn(
          `  ADVERTENCIA: Nombre de sección vacío en Excel para el alumno "${nombreUsuario}". No se buscará sección.`
        );
      }

      // 3. Verificar e insertar en USUARIOSECCION
      if (idAlumno && idSeccion) {
        const selectUsuarioSeccionSql = `SELECT COUNT(*) AS "total"
                                         FROM ADMIN.USUARIOSECCION
                                         WHERE USUARIO_ID_USUARIO = :idAlumno AND SECCION_ID_SECCION = :idSeccion`;
        const assocResult = await conn.execute(selectUsuarioSeccionSql, {
          idAlumno,
          idSeccion,
        });

        if (assocResult.rows[0][0] === 0) {
          const insertUsuarioSeccionSql = `INSERT INTO ADMIN.USUARIOSECCION (USUARIO_ID_USUARIO, SECCION_ID_SECCION)
                                           VALUES (:idAlumno, :idSeccion)`;
          await conn.execute(insertUsuarioSeccionSql, { idAlumno, idSeccion });
          asociacionesCreadas++;
          console.log(
            `  Asociación creada para Alumno ID: ${idAlumno} y Sección ID: ${idSeccion}`
          );
        } else {
          console.log(
            `  Asociación ya existente para Alumno ID: ${idAlumno} y Sección ID: ${idSeccion}`
          );
        }
      }
    }

    await conn.commit();
    return res.status(201).json({
      message: 'Carga de alumnos completada.',
      inserted: alumnosInsertados,
      updated: alumnosActualizados, // Mantener si se implementa actualización
      associations_created: asociacionesCreadas,
      ignored: filasIgnoradas,
    });
  } catch (e) {
    if (conn) await conn.rollback();
    console.error('Error en handleCargaAlumnos:', e);
    return res.status(500).json({
      error: 'Error interno del servidor al cargar alumnos.',
      details: e.message,
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};
