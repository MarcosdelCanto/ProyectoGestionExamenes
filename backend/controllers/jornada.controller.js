import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllJornadas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT  id_jornada, nombre_jornada
      FROM    JORNADA `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener jornadas:', err);
  } finally {
    if (conn) await conn.close();
  }
};

export const getJornadaById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT  id_jornada, nombre_jornada
      FROM    JORNADA
      WHERE   id_jornada = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'La jornada no existe' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener jornada:', err);
    res.status(500).json({ error: 'Error al obtener jornada' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createJornada = async (req, res) => {
  const { nombre_jornada, cod_jornada } = req.body;
  let conn;
  try {
    if (!nombre_jornada || cod_jornada) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }
    conn = await getConnection();

    const result = await conn.execute(
      `INSERT INTO JORNADA (id_jornada, nombre_jornada, cod_jornada)
      VALUES (SEQ_JORNADA.NEXTVAL, :nombre_jornada, :cod_jornada)
      RETURNING id_jornada INTO :newId`,
      {
        nombre_jornada: nombre_jornada,
        cod_jornada: cod_jornada,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.json({
      message: 'Jornada creada con éxito',
      id: result.outBinds.newId[0],
    });
  } catch (err) {
    console.error('Error al crear jornada:', err);
    res.status(500).json({ error: 'Error al crear jornada' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateJornada = async (req, res) => {
  const { id } = req.params;
  const { nombre_jornada, cod_jornada } = req.body;
  let conn;
  try {
    if (!nombre_jornada || cod_jornada) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE JORNADA
      SET nombre_jornada = :nombre_jornada, cod_jornada = :cod_jornada
      WHERE id_jornada = :id`,
      {
        nombre_jornada: nombre_jornada,
        cod_jornada: cod_jornada,
        id: id,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'La jornada no existe' });
  } catch (err) {
    console.error('Error al actualizar jornada:', err);
    res.status(500).json({ error: 'Error al actualizar jornada' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteJornada = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM JORNADA
      WHERE id_jornada = :id`,
      {
        id: id,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'La jornada no existe' });
  } catch (err) {
    console.error('Error al eliminar jornada:', err);
    res.status(500).json({ error: 'Error al eliminar jornada' });
  } finally {
    if (conn) await conn.close();
  }
};
