import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllSalas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.id_sala, s.nombre_sala, s.capacidad_sala, s.edificio_id_edificio, e.nombre_edificio, e.sigla_edificio
      FROM SALA s
      JOIN EDIFICIO e ON s.edificio_id_edificio = e.id_edificio
      ORDER BY s.id_sala`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener salas:', err);
    res.status(500).json({ error: 'Error al obtener salas' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getSalaById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.*, e.nombre_edificio, e.sigla_edificio
       FROM SALA s
       JOIN EDIFICIO e ON s.edificio_id_edificio = e.id_edificio
       WHERE s.id_sala = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Sala no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener sala:', err);
    res.status(500).json({ error: 'Error al obtener sala' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createSala = async (req, res) => {
  const { nombre_sala, capacidad_sala, edificio_id_edificio } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO SALA (id_sala, nombre_sala, capacidad_sala, edificio_id_edificio)
       VALUES (SEQ_SALA.NEXTVAL, :nombre, :capacidad, :edificio)
       RETURNING id_sala INTO :newId`,
      {
        nombre: nombre_sala,
        capacidad: capacidad_sala,
        edificio: edificio_id_edificio,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_sala: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear sala:', err);
    res.status(500).json({ error: 'Error al crear sala' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateSala = async (req, res) => {
  const { id } = req.params;
  const { nombre_sala, capacidad_sala, edificio_id_edificio } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE SALA
       SET nombre_sala = :nombre,
           capacidad_sala = :capacidad,
           edificio_id_edificio = :edificio_id
       WHERE id_sala = :id`,
      {
        id,
        nombre: nombre_sala,
        capacidad: capacidad_sala,
        edificio_id: edificio_id_edificio,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Sala no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Sala actualizada' });
  } catch (err) {
    console.error('Error al actualizar sala:', err);
    res.status(500).json({ error: 'Error al actualizar sala' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteSala = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`DELETE FROM SALA WHERE id_sala = :id`, [
      id,
    ]);
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Sala no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Sala eliminada' });
  } catch (err) {
    console.error('Error al eliminar sala:', err);
    res.status(500).json({ error: 'Error al eliminar sala' });
  } finally {
    if (conn) await conn.close();
  }
};
