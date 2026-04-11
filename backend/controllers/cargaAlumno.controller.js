import { getConnection } from '../db.js';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';

const ROL_ALUMNO_ID = 3;
const BCRYPT_ROUNDS = 8; // 4× más rápido que 10, sigue siendo seguro
const HASH_BATCH = 100; // Hashes en paralelo por lote
const DB_CHUNK = 500; // Máx. valores en cláusula IN (límite Oracle)
const INSERT_BATCH = 1000; // Filas por executeMany

export const handleCargaAlumnos = async (req, res) => {
  const datos = req.body;
  let conn;

  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  try {
    // ── 1. Validar y normalizar todas las filas en memoria ────────────────
    console.log(`[CargaAlumnos] Inicio — ${datos.length} filas recibidas`);
    if (datos.length > 0) {
      console.log(`[CargaAlumnos] Columnas detectadas:`, Object.keys(datos[0]));
      console.log(`[CargaAlumnos] Primera fila:`, datos[0]);
    }
    const validRows = [];
    let filasIgnoradas = 0;

    for (const fila of datos) {
      const nombreParticipante = String(fila['Nombre partic.'] ?? '').trim();
      const emailUsuario = String(fila['Mail'] ?? '').trim();

      if (!nombreParticipante || !emailUsuario) {
        filasIgnoradas++;
        continue;
      }

      const [apellido = '', primerNombre = ''] = nombreParticipante.split(',');
      const nombreUsuario = `${primerNombre.trim()} ${apellido.trim()}`.trim();
      const plainPassword =
        String(fila['Abrev.participante'] ?? '').trim() || 'changeme';
      const seccion = String(fila['Seccion'] ?? '').trim();

      validRows.push({ nombreUsuario, emailUsuario, plainPassword, seccion });
    }

    console.log(
      `[CargaAlumnos] [${elapsed()}] Validación: ${validRows.length} filas válidas, ${filasIgnoradas} ignoradas`
    );

    if (validRows.length === 0) {
      return res.status(200).json({
        message: 'No hay filas válidas para procesar.',
        inserted: 0,
        updated: 0,
        associations_created: 0,
        ignored: filasIgnoradas,
      });
    }

    // ── 2. Hashear contraseñas en lotes paralelos (mayor ganancia) ────────
    console.log(
      `[CargaAlumnos] [${elapsed()}] Hasheando ${validRows.length} contraseñas en lotes de ${HASH_BATCH}...`
    );
    for (let i = 0; i < validRows.length; i += HASH_BATCH) {
      await Promise.all(
        validRows.slice(i, i + HASH_BATCH).map(async (row) => {
          row.hashedPassword = await bcrypt.hash(
            row.plainPassword,
            BCRYPT_ROUNDS
          );
        })
      );
      if ((i + HASH_BATCH) % 1000 === 0 || i + HASH_BATCH >= validRows.length) {
        console.log(
          `[CargaAlumnos] [${elapsed()}]   Hashes: ${Math.min(i + HASH_BATCH, validRows.length)}/${validRows.length}`
        );
      }
    }
    console.log(`[CargaAlumnos] [${elapsed()}] Hashes completados`);

    conn = await getConnection();
    console.log(`[CargaAlumnos] [${elapsed()}] Conexión BD establecida`);

    // ── 3. Pre-cargar TODAS las secciones en un Map (1 sola consulta) ─────
    console.log(`[CargaAlumnos] [${elapsed()}] Cargando secciones...`);
    const seccionResult = await conn.execute(
      'SELECT ID_SECCION, NOMBRE_SECCION FROM ADMIN.SECCION',
      [],
      { outFormat: oracledb.OUT_FORMAT_ARRAY }
    );
    const seccionMap = new Map(
      seccionResult.rows.map(([id, nombre]) => [nombre, id])
    );
    console.log(
      `[CargaAlumnos] [${elapsed()}] ${seccionMap.size} secciones cargadas`
    );

    // ── 4. Consultar usuarios existentes en chunks ────────────────────────
    const emailsUnicos = [...new Set(validRows.map((r) => r.emailUsuario))];
    console.log(
      `[CargaAlumnos] [${elapsed()}] Consultando ${emailsUnicos.length} emails únicos en BD...`
    );
    const existingUserMap = new Map(); // email → ID_USUARIO

    for (let i = 0; i < emailsUnicos.length; i += DB_CHUNK) {
      const chunk = emailsUnicos.slice(i, i + DB_CHUNK);
      const placeholders = chunk.map((_, j) => `:e${j}`).join(',');
      const binds = Object.fromEntries(
        chunk.map((email, j) => [`e${j}`, email])
      );

      const res = await conn.execute(
        `SELECT ID_USUARIO, EMAIL_USUARIO FROM ADMIN.USUARIO
          WHERE EMAIL_USUARIO IN (${placeholders})`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );
      res.rows.forEach(([id, email]) => existingUserMap.set(email, id));
    }
    console.log(
      `[CargaAlumnos] [${elapsed()}] ${existingUserMap.size} usuarios ya existen en BD`
    );

    // ── 5. Insertar usuarios nuevos con executeMany (bulk) ─────────────────
    // Deduplicar por email: un alumno puede aparecer en varias secciones,
    // pero solo se debe insertar una vez como usuario.
    const seenEmails = new Set();
    const newUserRows = [];
    for (const r of validRows) {
      if (
        !existingUserMap.has(r.emailUsuario) &&
        !seenEmails.has(r.emailUsuario)
      ) {
        seenEmails.add(r.emailUsuario);
        newUserRows.push(r);
      }
    }
    console.log(
      `[CargaAlumnos] [${elapsed()}] Insertando ${newUserRows.length} usuarios nuevos en lotes de ${INSERT_BATCH}...`
    );
    let alumnosInsertados = 0;

    const insertUsuarioSql = `
      INSERT INTO ADMIN.USUARIO
        (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
         FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL)
      VALUES
        (SEQ_USUARIO.NEXTVAL, :nombre, :email, :password,
         SYSTIMESTAMP, SYSTIMESTAMP, :rol)
      RETURNING ID_USUARIO INTO :newId`;

    const insertUsuarioBindDefs = {
      nombre: { type: oracledb.STRING, maxSize: 200 },
      email: { type: oracledb.STRING, maxSize: 200 },
      password: { type: oracledb.STRING, maxSize: 200 },
      rol: { type: oracledb.NUMBER },
      newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    };

    for (let i = 0; i < newUserRows.length; i += INSERT_BATCH) {
      const batch = newUserRows.slice(i, i + INSERT_BATCH);
      const binds = batch.map((r) => ({
        nombre: r.nombreUsuario,
        email: r.emailUsuario,
        password: r.hashedPassword,
        rol: ROL_ALUMNO_ID,
      }));

      const result = await conn.executeMany(insertUsuarioSql, binds, {
        bindDefs: insertUsuarioBindDefs,
      });
      result.outBinds.forEach((bind, j) => {
        existingUserMap.set(batch[j].emailUsuario, bind.newId[0]);
      });
      alumnosInsertados += batch.length;
      console.log(
        `[CargaAlumnos] [${elapsed()}]   Usuarios insertados: ${alumnosInsertados}/${newUserRows.length}`
      );
    }
    console.log(
      `[CargaAlumnos] [${elapsed()}] Inserción de usuarios completada`
    );

    // ── 6. Construir lista de asociaciones deseadas ───────────────────────
    const desiredAssociations = validRows
      .map((r) => ({
        idAlumno: existingUserMap.get(r.emailUsuario),
        idSeccion: seccionMap.get(r.seccion),
      }))
      .filter((a) => a.idAlumno && a.idSeccion);

    console.log(
      `[CargaAlumnos] [${elapsed()}] Asociaciones deseadas: ${desiredAssociations.length}`
    );

    // ── 7. Cargar asociaciones ya existentes en chunks ────────────────────
    const userIds = [...new Set(desiredAssociations.map((a) => a.idAlumno))];
    console.log(
      `[CargaAlumnos] [${elapsed()}] Consultando asociaciones existentes para ${userIds.length} usuarios...`
    );
    const existingAssocSet = new Set();

    for (let i = 0; i < userIds.length; i += DB_CHUNK) {
      const chunk = userIds.slice(i, i + DB_CHUNK);
      const placeholders = chunk.map((_, j) => `:u${j}`).join(',');
      const binds = Object.fromEntries(chunk.map((id, j) => [`u${j}`, id]));

      const res = await conn.execute(
        `SELECT USUARIO_ID_USUARIO, SECCION_ID_SECCION
           FROM ADMIN.USUARIOSECCION
          WHERE USUARIO_ID_USUARIO IN (${placeholders})`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );
      res.rows.forEach(([uid, sid]) => existingAssocSet.add(`${uid}-${sid}`));
    }
    console.log(
      `[CargaAlumnos] [${elapsed()}] ${existingAssocSet.size} asociaciones ya existen en BD`
    );

    // ── 8. Insertar asociaciones nuevas con executeMany (bulk) ────────────
    const newAssociations = desiredAssociations.filter(
      (a) => !existingAssocSet.has(`${a.idAlumno}-${a.idSeccion}`)
    );
    console.log(
      `[CargaAlumnos] [${elapsed()}] Insertando ${newAssociations.length} asociaciones nuevas en lotes de ${INSERT_BATCH}...`
    );
    let asociacionesCreadas = 0;

    for (let i = 0; i < newAssociations.length; i += INSERT_BATCH) {
      const batch = newAssociations.slice(i, i + INSERT_BATCH);
      await conn.executeMany(
        `INSERT INTO ADMIN.USUARIOSECCION (USUARIO_ID_USUARIO, SECCION_ID_SECCION)
         VALUES (:idAlumno, :idSeccion)`,
        batch
      );
      asociacionesCreadas += batch.length;
      console.log(
        `[CargaAlumnos] [${elapsed()}]   Asociaciones insertadas: ${asociacionesCreadas}/${newAssociations.length}`
      );
    }

    await conn.commit();
    console.log(
      `[CargaAlumnos] [${elapsed()}] ✔ COMMIT realizado — carga finalizada`
    );

    return res.status(201).json({
      message: 'Carga de alumnos completada.',
      inserted: alumnosInsertados,
      updated: validRows.length - newUserRows.length,
      associations_created: asociacionesCreadas,
      ignored: filasIgnoradas,
    });
  } catch (e) {
    if (conn) await conn.rollback();
    console.error(
      `[CargaAlumnos] [${elapsed()}] ✖ ERROR — se hizo rollback:`,
      e.message
    );
    return res.status(500).json({
      error: 'Error interno del servidor al cargar alumnos.',
      details: e.message,
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error al cerrar conexión:', err);
      }
    }
  }
};
