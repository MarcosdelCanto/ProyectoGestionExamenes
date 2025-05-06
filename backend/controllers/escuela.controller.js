import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllEscuelas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.id_escuela, e.nombre_escuela, fecha_actualizacion_escuela, e.sede_id_sede, s.nombre_sede
      FROM ESCUELA e
      JOIN SEDE s ON e.sede_id_sede = s.id_sede
      ORDER BY e.id_escuela`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener escuelas:', err);
    res.status(500).json({ error: 'Error al obtener escuelas' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getEscuelaById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.id_escuela, e.nombre_escuela, e.fecha_actualizacion_escuela, e.sede_id_sede, s.nombre_sede
      FROM ESCUELA e
      JOIN SEDE s ON e.sede_id_sede = s.id_sede
      WHERE e.id_escuela = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Escuela no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener escuela:', err);
    res.status(500).json({ error: 'Error al obtener escuela' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createEscuela = async (req, res) => {
  const { nombre_escuela, sede_id_sede } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ESCUELA (id_escuela,nombre_escuela,fecha_actualizacion_escuela, sede_id_sede)
      VALUES (SEQ_ESCUELA.NEXTVAL, :nombre, SYSTIMESTAMP,:sede_id)
      RETURNING id_escuela INTO :newId`,
      {
        nombre: nombre_escuela,
        sede_id: sede_id_sede,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_escuela: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear escuela:', err);
    res.status(500).json({ error: 'Error al crear escuela' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateEscuela = async (req, res) => {
  const { id } = req.params;
  const { nombre_escuela, sede_id_sede } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ESCUELA
      SET nombre_escuela = :nombre,
          sede_id_sede = :sede_id
      WHERE id_escuela = :id`,
      {
        id,
        nombre: nombre_escuela,
        sede_id: sede_id_sede,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Escuela no encontrada' });
    await conn.commit();
    res.json({ message: 'Escuela actualizada con éxito' });
  } catch (err) {
    console.error('Error al actualizar escuela:', err);
    res.status(500).json({ error: 'Error al actualizar escuela' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteEscuela = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM ESCUELA WHERE id_escuela = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Escuela no encontrada' });
    await conn.commit();
    res.json({ message: 'Escuela eliminada con éxito' });
  } catch (err) {
    console.error('Error al eliminar escuela:', err);
    res.status(500).json({ error: 'Error al eliminar escuela' });
  } finally {
    if (conn) await conn.close();
  }
};
