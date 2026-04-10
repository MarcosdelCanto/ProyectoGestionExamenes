import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, defaultMessage, statusCode = 500) => {
  console.error(`[Feriado] ${defaultMessage}:`, error);
  const errorDetails =
    error?.message ||
    (typeof error === 'string' ? error : 'Error desconocido.');
  if (!res.headersSent) {
    res
      .status(statusCode)
      .json({ error: defaultMessage, details: errorDetails });
  }
};

// GET /feriado — lista todos los feriados con sus módulos
export const getAllFeriados = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_FERIADO,
              TO_CHAR(FECHA_FERIADO, 'YYYY-MM-DD') AS FECHA_FERIADO,
              NOMBRE_FERIADO, DESCRIPCION_FERIADO, TIPO_BLOQUEO, ACTIVO
       FROM FERIADO
       ORDER BY FECHA_FERIADO DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const feriados = result.rows;

    for (const feriado of feriados) {
      const modResult = await conn.execute(
        `SELECT fm.MODULO_ID_MODULO, m.NOMBRE_MODULO,
                m.INICIO_MODULO, m.FIN_MODULO, m.ORDEN
         FROM FERIADO_MODULO fm
         JOIN MODULO m ON fm.MODULO_ID_MODULO = m.ID_MODULO
         WHERE fm.FERIADO_ID_FERIADO = :id
         ORDER BY m.ORDEN`,
        { id: feriado.ID_FERIADO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      feriado.MODULOS = modResult.rows;
    }

    res.json(feriados);
  } catch (err) {
    handleError(res, err, 'Error al obtener feriados');
  } finally {
    if (conn) await conn.close();
  }
};

// GET /feriado/rango?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
export const getFeriadosByRango = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  let conn;
  try {
    conn = await getConnection();
    let sql = `SELECT ID_FERIADO,
                      TO_CHAR(FECHA_FERIADO, 'YYYY-MM-DD') AS FECHA_FERIADO,
                      NOMBRE_FERIADO, DESCRIPCION_FERIADO, TIPO_BLOQUEO, ACTIVO
               FROM FERIADO
               WHERE ACTIVO = 1`;
    const binds = {};
    if (fecha_inicio) {
      sql += ` AND FECHA_FERIADO >= TO_DATE(:fi, 'YYYY-MM-DD')`;
      binds.fi = fecha_inicio;
    }
    if (fecha_fin) {
      sql += ` AND FECHA_FERIADO <= TO_DATE(:ff, 'YYYY-MM-DD')`;
      binds.ff = fecha_fin;
    }
    sql += ' ORDER BY FECHA_FERIADO';

    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    const feriados = result.rows;

    for (const feriado of feriados) {
      const modResult = await conn.execute(
        `SELECT fm.MODULO_ID_MODULO
         FROM FERIADO_MODULO fm
         WHERE fm.FERIADO_ID_FERIADO = :id`,
        { id: feriado.ID_FERIADO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      feriado.MODULOS_IDS = modResult.rows.map((r) => r.MODULO_ID_MODULO);
    }

    res.json(feriados);
  } catch (err) {
    handleError(res, err, 'Error al obtener feriados por rango');
  } finally {
    if (conn) await conn.close();
  }
};

// GET /feriado/check?fecha=YYYY-MM-DD
export const checkFechaBloqueo = async (req, res) => {
  const { fecha } = req.query;
  if (!fecha)
    return res.status(400).json({ error: 'Parámetro fecha requerido' });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_FERIADO, NOMBRE_FERIADO, TIPO_BLOQUEO
       FROM FERIADO
       WHERE FECHA_FERIADO = TO_DATE(:fecha, 'YYYY-MM-DD')
         AND ACTIVO = 1`,
      { fecha },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows.length) {
      return res.json({ bloqueado: false });
    }

    const feriado = result.rows[0];

    if (feriado.TIPO_BLOQUEO === 'COMPLETO') {
      return res.json({
        bloqueado: true,
        tipo: 'COMPLETO',
        nombre: feriado.NOMBRE_FERIADO,
        id_feriado: feriado.ID_FERIADO,
      });
    }

    const modResult = await conn.execute(
      `SELECT fm.MODULO_ID_MODULO
       FROM FERIADO_MODULO fm
       WHERE fm.FERIADO_ID_FERIADO = :id`,
      { id: feriado.ID_FERIADO },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      bloqueado: true,
      tipo: 'MODULOS',
      nombre: feriado.NOMBRE_FERIADO,
      id_feriado: feriado.ID_FERIADO,
      modulos_bloqueados: modResult.rows.map((r) => r.MODULO_ID_MODULO),
    });
  } catch (err) {
    handleError(res, err, 'Error al verificar bloqueo de fecha');
  } finally {
    if (conn) await conn.close();
  }
};

// GET /feriado/:id
export const getFeriadoById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return handleError(res, new Error('ID inválido'), 'ID inválido', 400);

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_FERIADO,
              TO_CHAR(FECHA_FERIADO, 'YYYY-MM-DD') AS FECHA_FERIADO,
              NOMBRE_FERIADO, DESCRIPCION_FERIADO, TIPO_BLOQUEO, ACTIVO
       FROM FERIADO
       WHERE ID_FERIADO = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Feriado no encontrado' });

    const feriado = result.rows[0];
    const modResult = await conn.execute(
      `SELECT fm.MODULO_ID_MODULO, m.NOMBRE_MODULO,
              m.INICIO_MODULO, m.FIN_MODULO, m.ORDEN
       FROM FERIADO_MODULO fm
       JOIN MODULO m ON fm.MODULO_ID_MODULO = m.ID_MODULO
       WHERE fm.FERIADO_ID_FERIADO = :id
       ORDER BY m.ORDEN`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    feriado.MODULOS = modResult.rows;

    res.json(feriado);
  } catch (err) {
    handleError(res, err, 'Error al obtener feriado');
  } finally {
    if (conn) await conn.close();
  }
};

// POST /feriado
export const createFeriado = async (req, res) => {
  const {
    fecha_feriado,
    nombre_feriado,
    descripcion_feriado,
    tipo_bloqueo = 'COMPLETO',
    modulos_ids = [],
    activo = 1,
  } = req.body;

  if (!fecha_feriado || !nombre_feriado) {
    return res.status(400).json({ error: 'Fecha y nombre son requeridos' });
  }
  if (!['COMPLETO', 'MODULOS'].includes(tipo_bloqueo)) {
    return res
      .status(400)
      .json({ error: 'tipo_bloqueo debe ser COMPLETO o MODULOS' });
  }
  if (tipo_bloqueo === 'MODULOS' && modulos_ids.length === 0) {
    return res
      .status(400)
      .json({ error: 'Debe seleccionar al menos un módulo para tipo MODULOS' });
  }

  let conn;
  try {
    conn = await getConnection();

    const insertResult = await conn.execute(
      `INSERT INTO FERIADO
         (FECHA_FERIADO, NOMBRE_FERIADO, DESCRIPCION_FERIADO, TIPO_BLOQUEO, ACTIVO)
       VALUES
         (TO_DATE(:fecha, 'YYYY-MM-DD'), :nombre, :descripcion, :tipo, :activo)
       RETURNING ID_FERIADO INTO :id`,
      {
        fecha: fecha_feriado,
        nombre: nombre_feriado,
        descripcion: descripcion_feriado || null,
        tipo: tipo_bloqueo,
        activo: activo,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false }
    );

    const newId = insertResult.outBinds.id[0];

    if (tipo_bloqueo === 'MODULOS' && modulos_ids.length > 0) {
      for (const moduloId of modulos_ids) {
        await conn.execute(
          `INSERT INTO FERIADO_MODULO (FERIADO_ID_FERIADO, MODULO_ID_MODULO)
           VALUES (:fid, :mid)`,
          { fid: newId, mid: moduloId },
          { autoCommit: false }
        );
      }
    }

    await conn.commit();
    res
      .status(201)
      .json({ message: 'Feriado creado exitosamente', id_feriado: newId });
  } catch (err) {
    if (conn) await conn.rollback();
    handleError(res, err, 'Error al crear feriado');
  } finally {
    if (conn) await conn.close();
  }
};

// PUT /feriado/:id
export const updateFeriado = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return handleError(res, new Error('ID inválido'), 'ID inválido', 400);

  const {
    fecha_feriado,
    nombre_feriado,
    descripcion_feriado,
    tipo_bloqueo,
    modulos_ids = [],
    activo,
  } = req.body;

  if (!fecha_feriado || !nombre_feriado || !tipo_bloqueo) {
    return res
      .status(400)
      .json({ error: 'Fecha, nombre y tipo_bloqueo son requeridos' });
  }
  if (!['COMPLETO', 'MODULOS'].includes(tipo_bloqueo)) {
    return res
      .status(400)
      .json({ error: 'tipo_bloqueo debe ser COMPLETO o MODULOS' });
  }
  if (tipo_bloqueo === 'MODULOS' && modulos_ids.length === 0) {
    return res
      .status(400)
      .json({ error: 'Debe seleccionar al menos un módulo para tipo MODULOS' });
  }

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `UPDATE FERIADO
       SET FECHA_FERIADO       = TO_DATE(:fecha, 'YYYY-MM-DD'),
           NOMBRE_FERIADO      = :nombre,
           DESCRIPCION_FERIADO = :descripcion,
           TIPO_BLOQUEO        = :tipo,
           ACTIVO              = :activo
       WHERE ID_FERIADO = :id`,
      {
        fecha: fecha_feriado,
        nombre: nombre_feriado,
        descripcion: descripcion_feriado || null,
        tipo: tipo_bloqueo,
        activo: activo,
        id,
      },
      { autoCommit: false }
    );

    await conn.execute(
      `DELETE FROM FERIADO_MODULO WHERE FERIADO_ID_FERIADO = :id`,
      { id },
      { autoCommit: false }
    );

    if (tipo_bloqueo === 'MODULOS' && modulos_ids.length > 0) {
      for (const moduloId of modulos_ids) {
        await conn.execute(
          `INSERT INTO FERIADO_MODULO (FERIADO_ID_FERIADO, MODULO_ID_MODULO)
           VALUES (:fid, :mid)`,
          { fid: id, mid: moduloId },
          { autoCommit: false }
        );
      }
    }

    await conn.commit();
    res.json({ message: 'Feriado actualizado exitosamente' });
  } catch (err) {
    if (conn) await conn.rollback();
    handleError(res, err, 'Error al actualizar feriado');
  } finally {
    if (conn) await conn.close();
  }
};

// DELETE /feriado/:id
export const deleteFeriado = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return handleError(res, new Error('ID inválido'), 'ID inválido', 400);

  let conn;
  try {
    conn = await getConnection();
    // FERIADO_MODULO tiene ON DELETE CASCADE
    await conn.execute(
      `DELETE FROM FERIADO WHERE ID_FERIADO = :id`,
      { id },
      { autoCommit: true }
    );
    res.json({ message: 'Feriado eliminado exitosamente' });
  } catch (err) {
    handleError(res, err, 'Error al eliminar feriado');
  } finally {
    if (conn) await conn.close();
  }
};
