import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, defaultMessage, statusCode = 500) => {
  console.error(`[PeriodoReservas] ${defaultMessage}:`, error);
  const errorDetails =
    error?.message ||
    (typeof error === 'string' ? error : 'Error desconocido.');
  if (!res.headersSent) {
    res
      .status(statusCode)
      .json({ error: defaultMessage, details: errorDetails });
  }
};

// GET /api/periodo-reservas — lista todos los períodos
export const getAllPeriodos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_PERIODO,
              NOMBRE_PERIODO,
              DESCRIPCION,
              TO_CHAR(FECHA_INICIO, 'YYYY-MM-DD') AS FECHA_INICIO,
              TO_CHAR(FECHA_FIN,    'YYYY-MM-DD') AS FECHA_FIN,
              ACTIVO
       FROM PERIODO_RESERVAS
       ORDER BY FECHA_INICIO DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener los períodos de reservas.');
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
};

// GET /api/periodo-reservas/activos — solo los períodos activos
export const getPeriodosActivos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_PERIODO,
              NOMBRE_PERIODO,
              DESCRIPCION,
              TO_CHAR(FECHA_INICIO, 'YYYY-MM-DD') AS FECHA_INICIO,
              TO_CHAR(FECHA_FIN,    'YYYY-MM-DD') AS FECHA_FIN,
              ACTIVO
       FROM PERIODO_RESERVAS
       WHERE ACTIVO = 1
       ORDER BY FECHA_INICIO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener los períodos activos.');
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
};

// POST /api/periodo-reservas — crear período
export const createPeriodo = async (req, res) => {
  const { nombre_periodo, descripcion, fecha_inicio, fecha_fin, activo } =
    req.body;
  if (!nombre_periodo || !fecha_inicio || !fecha_fin) {
    return res
      .status(400)
      .json({
        error: 'Faltan campos obligatorios: nombre, fecha_inicio, fecha_fin.',
      });
  }
  if (fecha_fin < fecha_inicio) {
    return res
      .status(400)
      .json({
        error: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO PERIODO_RESERVAS (NOMBRE_PERIODO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, ACTIVO)
       VALUES (:nombre, :descripcion, TO_DATE(:inicio, 'YYYY-MM-DD'), TO_DATE(:fin, 'YYYY-MM-DD'), :activo)
       RETURNING ID_PERIODO INTO :new_id`,
      {
        nombre: nombre_periodo,
        descripcion: descripcion || null,
        inicio: fecha_inicio,
        fin: fecha_fin,
        activo: activo ?? 1,
        new_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      }
    );
    await conn.commit();
    res
      .status(201)
      .json({
        id_periodo: result.outBinds.new_id[0],
        message: 'Período creado.',
      });
  } catch (error) {
    handleError(res, error, 'Error al crear el período.');
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
};

// PUT /api/periodo-reservas/:id — actualizar período
export const updatePeriodo = async (req, res) => {
  const { id } = req.params;
  const { nombre_periodo, descripcion, fecha_inicio, fecha_fin, activo } =
    req.body;
  if (!nombre_periodo || !fecha_inicio || !fecha_fin) {
    return res
      .status(400)
      .json({
        error: 'Faltan campos obligatorios: nombre, fecha_inicio, fecha_fin.',
      });
  }
  if (fecha_fin < fecha_inicio) {
    return res
      .status(400)
      .json({
        error: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE PERIODO_RESERVAS
       SET NOMBRE_PERIODO = :nombre,
           DESCRIPCION    = :descripcion,
           FECHA_INICIO   = TO_DATE(:inicio, 'YYYY-MM-DD'),
           FECHA_FIN      = TO_DATE(:fin,    'YYYY-MM-DD'),
           ACTIVO         = :activo
       WHERE ID_PERIODO = :id`,
      {
        nombre: nombre_periodo,
        descripcion: descripcion || null,
        inicio: fecha_inicio,
        fin: fecha_fin,
        activo: activo ?? 1,
        id: parseInt(id),
      }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Período no encontrado.' });
    }
    await conn.commit();
    res.json({ message: 'Período actualizado.' });
  } catch (error) {
    handleError(res, error, 'Error al actualizar el período.');
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
};

// DELETE /api/periodo-reservas/:id — eliminar período
export const deletePeriodo = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM PERIODO_RESERVAS WHERE ID_PERIODO = :id`,
      { id: parseInt(id) }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Período no encontrado.' });
    }
    await conn.commit();
    res.json({ message: 'Período eliminado.' });
  } catch (error) {
    handleError(res, error, 'Error al eliminar el período.');
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
};
