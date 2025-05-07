import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllSedes = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id_sede, nombre_sede
       FROM SEDE
       ORDER BY id_sede`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener sedes:', err);
    res.status(500).json({ error: 'Error al obtener sedes' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getSedeById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM SEDE WHERE id_sede = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Sede no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener sede:', err);
    res.status(500).json({ error: 'Error al obtener sede' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createSede = async (req, res) => {
  const { nombre_sede } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO SEDE (id_sede, nombre_sede)
       VALUES (SEQ_SEDE.NEXTVAL, :nombre)
       RETURNING id_sede INTO :newId`,
      {
        nombre: nombre_sede,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();
    res.status(201).json({ id_sede: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear sede:', err);
    res.status(500).json({ error: 'Error al crear sede' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateSede = async (req, res) => {
  const { id } = req.params;
  const { nombre_sede } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE SEDE
       SET nombre_sede = :nombre
       WHERE id_sede = :id`,
      {
        id,
        nombre: nombre_sede
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Sede no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Sede actualizada' });
  } catch (err) {
    console.error('Error al actualizar sede:', err);
    res.status(500).json({ error: 'Error al actualizar sede' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteSede = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM SEDE WHERE id_sede = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Sede no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Sede eliminada' });
  } catch (err) {
    console.error('Error al eliminar sede:', err);
    res.status(500).json({ error: 'Error al eliminar sede' });
  } finally {
    if (conn) await conn.close();
  }
};