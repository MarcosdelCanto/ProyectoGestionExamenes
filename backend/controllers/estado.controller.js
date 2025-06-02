import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllEstados = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM ESTADO`, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los estados:', err);
    res.status(500).json({ error: 'Error al obtener los estados' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getEstadoById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM ESTADO WHERE id_estado = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      res.status(404).json({ error: 'Estado no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener el estado:', err);
    res.status(500).json({ error: 'Error al obtener el estado' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createEstado = async (req, res) => {
  const { nombre_estado } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ESTADO (id_estado, nombre_estado) VALUES (SEQ_ESCUELA.NEXTVAL, :nombre) RETURNING id_estado INTO :newId`,
      {
        nombre: nombre_estado,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear el estado:', err);
    res.status(500).json({ error: 'Error al crear el estado' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateEstado = async (req, res) => {
  const { id } = req.params;
  const { nombre_estado } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ESTADO
            SET nombre_estado = :nombre
            WHERE id_estado = :id`,
      {
        id,
        nombre: nombre_estado,
      }
    );
    if (result.rowsAffected === 0)
      res.status(404).json({ error: 'Estado no encontrado' });
    await conn.commit();
    res.json({ message: 'Estado actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar el estado:', err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteEstado = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM ESTADO WHERE id_estado = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      res.status(404).json({ error: 'Estado no encontrado' });
    await conn.commit();
    res.json({ message: 'Estado eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar el estado:', err);
    res.status(500).json({ error: 'Error al eliminar el estado' });
  } finally {
    if (conn) await conn.close();
  }
};
