import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllCarreras = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT c.id_carrera, c.nombre_carrera, c.escuela_id_escuela, e.nombre_escuela
FROM CARRERA c
JOIN ESCUELA e ON c.escuela_id_escuela = e.id_escuela
ORDER BY c.id_carrera`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carreras:', err);
    res.status(500).json({ error: 'Error al obtener carreras' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getCarreraById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT c.*, s.nombre_escuela
       FROM CARRERA c
       JOIN ESCUELA s ON c.escuela_id_escuela = s.id_escuela
       WHERE c.id_carrera = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Carrera no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener carrera:', err);
    res.status(500).json({ error: 'Error al obtener carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createCarrera = async (req, res) => {
  const { nombre_carrera, escuela_id_escuela } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO CARRERA (id_carrera, nombre_carrera, escuela_id_escuela)
       VALUES (SEQ_CARRERA.NEXTVAL, :nombre, :escuela)
       RETURNING id_carrera INTO :newId`,
      {
        nombre: nombre_carrera,
        escuela: escuela_id_escuela,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_carrera: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear carrera:', err);
    res.status(500).json({ error: 'Error al crear carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateCarrera = async (req, res) => {
  const { id } = req.params;
  const { nombre_carrera, escuela_id_escuela } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE CARRERA
       SET nombre_carrera = :nombre,
           escuela_id_escuela = :escuela
       WHERE id_carrera = :id`,
      {
        id,
        nombre: nombre_carrera,
        escuela: escuela_id_escuela,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Carrera no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Carrera actualizada' });
  } catch (err) {
    console.error('Error al actualizar carrera:', err);
    res.status(500).json({ error: 'Error al actualizar carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteCarrera = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM CARRERA WHERE id_carrera = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Carrera no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Carrera eliminada' });
  } catch (err) {
    console.error('Error al eliminar carrera:', err);
    res.status(500).json({ error: 'Error al eliminar carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getCarrerasByEscuela = async (req, res) => {
  let connection;
  try {
    const { escuelaId } = req.params;
    if (!escuelaId) {
      return res.status(400).json({ message: 'Escuela ID is required' });
    }
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT ID_CARRERA, NOMBRE_CARRERA, ESCUELA_ID_ESCUELA
       FROM CARRERA
       WHERE ESCUELA_ID_ESCUELA = :id`,
      [parseInt(escuelaId)],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching carreras by escuela:', error);
    res.status(500).json({ message: 'Error al obtener carreras por escuela' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};
