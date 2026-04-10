import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, err, msg, status = 500) => {
  console.error(msg, err);
  res.status(status).json({ error: msg, details: err?.message });
};

// GET /api/ayuda  — todos los registros (admin)
export const getAllAyudas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_AYUDA, CLAVE, TITULO, DESCRIPCION, CONTENIDO_JSON, NOTA, ACTIVO, RUTA,
              FECHA_CREA, FECHA_ACTU
         FROM AYUDA_SISTEMA
        ORDER BY CLAVE`,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: { CONTENIDO_JSON: { type: oracledb.STRING } },
      }
    );
    const rows = result.rows.map((r) => ({
      ...r,
      CONTENIDO_JSON: r.CONTENIDO_JSON ? JSON.parse(r.CONTENIDO_JSON) : [],
    }));
    res.json(rows);
  } catch (err) {
    handleError(res, err, 'Error al obtener ayudas');
  } finally {
    if (conn) await conn.close();
  }
};

// GET /api/ayuda/clave/:clave  — un registro por clave (público con auth)
export const getAyudaByClave = async (req, res) => {
  const { clave } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_AYUDA, CLAVE, TITULO, DESCRIPCION, CONTENIDO_JSON, NOTA, ACTIVO, RUTA
         FROM AYUDA_SISTEMA
        WHERE CLAVE = :clave AND ACTIVO = 1`,
      { clave },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: { CONTENIDO_JSON: { type: oracledb.STRING } },
      }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ayuda no encontrada' });
    }
    const row = result.rows[0];
    row.CONTENIDO_JSON = row.CONTENIDO_JSON
      ? JSON.parse(row.CONTENIDO_JSON)
      : [];
    res.json(row);
  } catch (err) {
    handleError(res, err, 'Error al obtener ayuda');
  } finally {
    if (conn) await conn.close();
  }
};

// POST /api/ayuda
export const createAyuda = async (req, res) => {
  const {
    clave,
    titulo,
    descripcion,
    contenido_json,
    nota,
    activo = 1,
    ruta,
  } = req.body;
  if (!clave || !titulo) {
    return res.status(400).json({ error: 'clave y titulo son obligatorios' });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO AYUDA_SISTEMA (ID_AYUDA, CLAVE, TITULO, DESCRIPCION, CONTENIDO_JSON, NOTA, ACTIVO, RUTA, FECHA_CREA, FECHA_ACTU)
            VALUES (SEQ_AYUDA_SISTEMA.NEXTVAL, :clave, :titulo, :descripcion, :contenido, :nota, :activo, :ruta, SYSTIMESTAMP, SYSTIMESTAMP)
            RETURNING ID_AYUDA INTO :newId`,
      {
        clave,
        titulo,
        descripcion: descripcion || null,
        contenido: contenido_json ? JSON.stringify(contenido_json) : null,
        nota: nota || null,
        activo: activo ? 1 : 0,
        ruta: ruta || null,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id: result.outBinds.newId[0] });
  } catch (err) {
    if (err.errorNum === 1) {
      return res
        .status(409)
        .json({ error: `Ya existe una ayuda con la clave "${clave}"` });
    }
    handleError(res, err, 'Error al crear ayuda');
  } finally {
    if (conn) await conn.close();
  }
};

// PUT /api/ayuda/:id
export const updateAyuda = async (req, res) => {
  const { id } = req.params;
  const { clave, titulo, descripcion, contenido_json, nota, activo, ruta } =
    req.body;
  if (!clave || !titulo) {
    return res.status(400).json({ error: 'clave y titulo son obligatorios' });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE AYUDA_SISTEMA
          SET CLAVE = :clave,
              TITULO = :titulo,
              DESCRIPCION = :descripcion,
              CONTENIDO_JSON = :contenido,
              NOTA = :nota,
              ACTIVO = :activo,
              RUTA = :ruta,
              FECHA_ACTU = SYSTIMESTAMP
        WHERE ID_AYUDA = :id`,
      {
        clave,
        titulo,
        descripcion: descripcion || null,
        contenido: contenido_json ? JSON.stringify(contenido_json) : null,
        nota: nota || null,
        activo: activo ? 1 : 0,
        ruta: ruta || null,
        id: Number(id),
      }
    );
    await conn.commit();
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Ayuda no encontrada' });
    }
    res.json({ ok: true });
  } catch (err) {
    if (err.errorNum === 1) {
      return res
        .status(409)
        .json({ error: `Ya existe una ayuda con la clave "${clave}"` });
    }
    handleError(res, err, 'Error al actualizar ayuda');
  } finally {
    if (conn) await conn.close();
  }
};

// GET /api/ayuda/ruta  — busca por ruta de página (para GlobalHelpFab)
export const getAyudaByRuta = async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'path requerido' });
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_AYUDA, CLAVE, TITULO, DESCRIPCION, CONTENIDO_JSON, NOTA, ACTIVO, RUTA
         FROM AYUDA_SISTEMA
        WHERE RUTA = :path AND ACTIVO = 1`,
      { path },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: { CONTENIDO_JSON: { type: oracledb.STRING } },
      }
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Ayuda no encontrada para esta ruta' });
    }
    const row = result.rows[0];
    row.CONTENIDO_JSON = row.CONTENIDO_JSON
      ? JSON.parse(row.CONTENIDO_JSON)
      : [];
    res.json(row);
  } catch (err) {
    handleError(res, err, 'Error al obtener ayuda por ruta');
  } finally {
    if (conn) await conn.close();
  }
};

// DELETE /api/ayuda/:id
export const deleteAyuda = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM AYUDA_SISTEMA WHERE ID_AYUDA = :id`,
      { id: Number(id) }
    );
    await conn.commit();
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Ayuda no encontrada' });
    }
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err, 'Error al eliminar ayuda');
  } finally {
    if (conn) await conn.close();
  }
};
