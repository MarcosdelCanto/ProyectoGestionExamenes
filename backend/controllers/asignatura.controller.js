import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllAsignaturas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT a.id_asignatura, a.nombre_asignatura, a.carrera_id_carrera, c.nombre_carrera
      FROM ASIGNATURA a
      JOIN CARRERA c ON a.carrera_id_carrera = c.id_carrera
      ORDER BY a.id_asignatura`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaturas:', err);
    res.status(500).json({ error: 'Error al obtener asignaturas' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getAsignaturaById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT a.*, c.nombre_carrera
      FROM ASIGNATURA a
      JOIN CARRERA c ON a.carrera_id_carrera = c.id_carrera
      WHERE a.id_asignatura = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener asignatura:', err);
    res.status(500).json({ error: 'Error al obtener asignatura' });
  } finally {
    if (conn) await conn.close();
  }
};
export const createAsignatura = async (req, res) => {
  const { nombre_asignatura, carrera_id_carrera } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ASIGNATURA (id_asignatura, nombre_asignatura, carrera_id_carrera)
      VALUES (SEQ_SECCION.NEXTVAL, :nombre, :carrera)
      RETURNING id_asignatura INTO :newId,`,
      {
        nombre: nombre_asignatura,
        carrera: carrera_id_carrera,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_asignatura: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear asignatura:', err);
    res.status(500).json({ error: 'Error al crear asignatura' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateAsignatura = async (req, res) => {
  const { id } = req.params;
  const { nombre_asignatura, carrera_id_carrera } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ASIGNATURA
      SET nombre_asignatura = :nombre,
       carrera_id_carrera = :carrera
      WHERE id_asignatura = :id`,
      {
        id,
        nombre: nombre_asignatura,
        carrera: carrera_id_carrera,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    await conn.commit();
    res.json({ message: 'Asignatura actualizada' });
  } catch (err) {
    console.error('Error al actualizar asignatura:', err);
    res.status(500).json({ error: 'Error al actualizar asignatura' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteAsignatura = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM ASIGNATURA WHERE id_asignatura = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    await conn.commit();
    res.json({ message: 'Asignatura eliminada' });
  } catch (err) {
    console.error('Error al eliminar asignatura:', err);
    res.status(500).json({ error: 'Error al eliminar asignatura' });
  } finally {
    if (conn) await conn.close();
  }
};
