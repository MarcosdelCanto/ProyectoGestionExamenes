import { getConnection } from '../db.js';
import bcrypt from 'bcrypt';
import oracledb from 'oracledb';

const ROL_DOCENTE_ID = 2;
const BCRYPT_ROUNDS = 8;
const HASH_BATCH = 100;
const DB_CHUNK = 500;
const INSERT_BATCH = 1000;

export const handleCargaDocentes = async (req, res) => {
  const { rows } = req.body;
  let conn;
  const errorsDetallados = [];

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      error:
        'El formato de datos es incorrecto. Se esperaba un array de filas (rows).',
    });
  }

  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  try {
    // ── 1. Validar y normalizar filas en memoria ───────────────────────────
    console.log(`[CargaDocentes] Inicio — ${rows.length} filas recibidas`);
    const validRows = [];
    let ignoredCount = 0;

    for (const fila of rows) {
      const idDocente = String(fila['ID Docente'] ?? '').trim();
      const nombre =
        String(fila['Nombre Docente'] ?? '').trim() || 'Sin Nombre';
      const email = String(fila['Mail Duoc'] ?? '')
        .trim()
        .toLowerCase();

      if (!idDocente) {
        ignoredCount++;
        errorsDetallados.push({
          idDocente: '',
          email,
          error: 'ID Docente vacío.',
        });
        continue;
      }
      validRows.push({ idDocente, nombre, email });
    }
    console.log(
      `[CargaDocentes] [${elapsed()}] Válidas: ${validRows.length} | Ignoradas: ${ignoredCount}`
    );

    if (validRows.length === 0) {
      return res.status(200).json({
        message: 'No hay filas válidas para procesar.',
        inserted: 0,
        updated: 0,
        ignored: ignoredCount,
        errors: errorsDetallados,
      });
    }

    conn = await getConnection();
    console.log(`[CargaDocentes] [${elapsed()}] Conexión BD establecida`);

    // ── 2. Pre-cargar docentes existentes por ID_DOCENTE (1 query bulk) ───
    const idsUnicos = [...new Set(validRows.map((r) => r.idDocente))];
    console.log(
      `[CargaDocentes] [${elapsed()}] Consultando ${idsUnicos.length} ID_DOCENTE únicos...`
    );
    const existingDocenteMap = new Map(); // idDocente → { idUsuario, email }

    for (let i = 0; i < idsUnicos.length; i += DB_CHUNK) {
      const chunk = idsUnicos.slice(i, i + DB_CHUNK);
      const placeholders = chunk.map((_, j) => `:d${j}`).join(',');
      const binds = Object.fromEntries(chunk.map((id, j) => [`d${j}`, id]));
      const result = await conn.execute(
        `SELECT ID_USUARIO, EMAIL_USUARIO, ID_DOCENTE FROM USUARIO WHERE ID_DOCENTE IN (${placeholders})`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );
      result.rows.forEach(([idUsuario, emailDb, idDoc]) =>
        existingDocenteMap.set(idDoc, {
          idUsuario,
          email: emailDb?.toLowerCase() ?? '',
        })
      );
    }
    console.log(
      `[CargaDocentes] [${elapsed()}] Docentes ya en BD: ${existingDocenteMap.size}`
    );

    // ── 3. Pre-cargar todos los emails existentes ─────────────────────────
    console.log(`[CargaDocentes] [${elapsed()}] Cargando emails existentes...`);
    const existingEmailMap = new Map(); // email → idUsuario
    const emailsAConsultar = validRows.map((r) => r.email).filter(Boolean);
    const emailsUnicos = [...new Set(emailsAConsultar)];

    for (let i = 0; i < emailsUnicos.length; i += DB_CHUNK) {
      const chunk = emailsUnicos.slice(i, i + DB_CHUNK);
      const placeholders = chunk.map((_, j) => `:e${j}`).join(',');
      const binds = Object.fromEntries(chunk.map((e, j) => [`e${j}`, e]));
      const result = await conn.execute(
        `SELECT LOWER(EMAIL_USUARIO), ID_USUARIO FROM USUARIO WHERE LOWER(EMAIL_USUARIO) IN (${placeholders})`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );
      result.rows.forEach(([email, idUsuario]) =>
        existingEmailMap.set(email, idUsuario)
      );
    }
    console.log(
      `[CargaDocentes] [${elapsed()}] Emails existentes cargados: ${existingEmailMap.size}`
    );

    // ── 4. Clasificar en inserts y updates ────────────────────────────────
    const toInsert = []; // nuevos docentes
    const toUpdateWithEmail = []; // update nombre + email
    const toUpdateWithoutEmail = []; // update solo nombre (email conflicto o vacío)

    for (const row of validRows) {
      const existing = existingDocenteMap.get(row.idDocente);

      if (existing) {
        // UPDATE
        let emailValido = null;
        if (row.email) {
          const emailOwner = existingEmailMap.get(row.email);
          if (!emailOwner || emailOwner === existing.idUsuario) {
            emailValido = row.email;
          } else {
            errorsDetallados.push({
              idDocente: row.idDocente,
              email: row.email,
              error: `Email ${row.email} ya está en uso por otro usuario. Email no actualizado.`,
            });
          }
        }
        if (emailValido) {
          toUpdateWithEmail.push({
            nombre: row.nombre,
            email: emailValido,
            idUsuario: existing.idUsuario,
          });
        } else {
          toUpdateWithoutEmail.push({
            nombre: row.nombre,
            idUsuario: existing.idUsuario,
          });
        }
      } else {
        // INSERT
        if (!row.email) {
          ignoredCount++;
          errorsDetallados.push({
            idDocente: row.idDocente,
            email: '',
            error: 'Nuevo docente sin email. Ignorado.',
          });
          continue;
        }
        const emailOwner = existingEmailMap.get(row.email);
        if (emailOwner) {
          ignoredCount++;
          errorsDetallados.push({
            idDocente: row.idDocente,
            email: row.email,
            error: `Email ${row.email} ya está en uso. Inserción ignorada.`,
          });
          continue;
        }
        toInsert.push(row);
        // Marcar el email como usado para evitar duplicados dentro del mismo archivo
        existingEmailMap.set(row.email, '__pending__');
      }
    }
    console.log(
      `[CargaDocentes] [${elapsed()}] A insertar: ${toInsert.length} | A actualizar: ${toUpdateWithEmail.length + toUpdateWithoutEmail.length}`
    );

    // ── 5. Hash contraseñas en lotes paralelos (solo nuevos) ─────────────
    if (toInsert.length > 0) {
      console.log(
        `[CargaDocentes] [${elapsed()}] Hasheando ${toInsert.length} contraseñas...`
      );
      for (let i = 0; i < toInsert.length; i += HASH_BATCH) {
        await Promise.all(
          toInsert.slice(i, i + HASH_BATCH).map(async (row) => {
            row.hashedPassword = await bcrypt.hash(
              row.idDocente,
              BCRYPT_ROUNDS
            );
          })
        );
        if (
          (i + HASH_BATCH) % 1000 === 0 ||
          i + HASH_BATCH >= toInsert.length
        ) {
          console.log(
            `[CargaDocentes] [${elapsed()}]   Hashes: ${Math.min(i + HASH_BATCH, toInsert.length)}/${toInsert.length}`
          );
        }
      }
      console.log(`[CargaDocentes] [${elapsed()}] Hashes completados`);
    }

    // ── 6. Insertar nuevos docentes con executeMany ───────────────────────
    let insertedCount = 0;
    if (toInsert.length > 0) {
      const insertSql = `
        INSERT INTO USUARIO (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
          FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL, ID_DOCENTE)
        VALUES (SEQ_USUARIO.NEXTVAL, :nombre, :email, :password,
          SYSDATE, NULL, :rolId, :idDocente)`;

      const bindDefs = {
        nombre: { type: oracledb.STRING, maxSize: 200 },
        email: { type: oracledb.STRING, maxSize: 200 },
        password: { type: oracledb.STRING, maxSize: 200 },
        rolId: { type: oracledb.NUMBER },
        idDocente: { type: oracledb.STRING, maxSize: 50 },
      };

      for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
        const batch = toInsert.slice(i, i + INSERT_BATCH);
        const binds = batch.map((r) => ({
          nombre: r.nombre,
          email: r.email,
          password: r.hashedPassword,
          rolId: ROL_DOCENTE_ID,
          idDocente: r.idDocente,
        }));
        await conn.executeMany(insertSql, binds, { bindDefs });
        insertedCount += batch.length;
        console.log(
          `[CargaDocentes] [${elapsed()}]   Insertados: ${insertedCount}/${toInsert.length}`
        );
      }
    }

    // ── 7. Actualizar docentes existentes con executeMany ─────────────────
    let updatedCount = 0;

    if (toUpdateWithEmail.length > 0) {
      const updateEmailSql = `UPDATE USUARIO SET NOMBRE_USUARIO = :nombre, EMAIL_USUARIO = :email, FECHA_ACTU_USUARIO = SYSDATE WHERE ID_USUARIO = :idUsuario`;
      const bindDefs = {
        nombre: { type: oracledb.STRING, maxSize: 200 },
        email: { type: oracledb.STRING, maxSize: 200 },
        idUsuario: { type: oracledb.NUMBER },
      };
      for (let i = 0; i < toUpdateWithEmail.length; i += INSERT_BATCH) {
        const batch = toUpdateWithEmail.slice(i, i + INSERT_BATCH);
        await conn.executeMany(updateEmailSql, batch, { bindDefs });
        updatedCount += batch.length;
      }
      console.log(
        `[CargaDocentes] [${elapsed()}] Actualizados con email: ${toUpdateWithEmail.length}`
      );
    }

    if (toUpdateWithoutEmail.length > 0) {
      const updateSql = `UPDATE USUARIO SET NOMBRE_USUARIO = :nombre, FECHA_ACTU_USUARIO = SYSDATE WHERE ID_USUARIO = :idUsuario`;
      const bindDefs = {
        nombre: { type: oracledb.STRING, maxSize: 200 },
        idUsuario: { type: oracledb.NUMBER },
      };
      for (let i = 0; i < toUpdateWithoutEmail.length; i += INSERT_BATCH) {
        const batch = toUpdateWithoutEmail.slice(i, i + INSERT_BATCH);
        await conn.executeMany(updateSql, batch, { bindDefs });
        updatedCount += batch.length;
      }
      console.log(
        `[CargaDocentes] [${elapsed()}] Actualizados sin email: ${toUpdateWithoutEmail.length}`
      );
    }

    await conn.commit();
    console.log(
      `[CargaDocentes] [${elapsed()}] ✔ COMMIT — Insertados: ${insertedCount} | Actualizados: ${updatedCount} | Ignorados: ${ignoredCount}`
    );

    return res.json({
      message: 'Proceso de importación de docentes completado.',
      inserted: insertedCount,
      updated: updatedCount,
      ignored: ignoredCount,
      errors: errorsDetallados,
    });
  } catch (err) {
    console.error(
      `[CargaDocentes] [${elapsed()}] ✖ ERROR — rollback:`,
      err.message
    );
    if (conn) await conn.rollback();
    if (err.errorNum === 1) {
      return res.status(409).json({
        error:
          'Error de duplicado en la base de datos. Uno o más emails ya existen.',
        oracleError: err.message,
        details: errorsDetallados,
      });
    }
    return res.status(500).json({
      error: 'Error interno al importar docentes.',
      details: errorsDetallados,
    });
  } finally {
    if (conn) await conn.close();
  }
};
