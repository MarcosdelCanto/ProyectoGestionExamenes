import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllSecciones = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.id_seccion, s.nombre_seccion, s.asignatura_id_asignatura, a.nombre_asignatura, j.nombre_jornada
      FROM SECCION s
      JOIN ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
      JOIN JORNADA j ON s.jornada_id_jornada = j.id_jornada
      ORDER BY s.id_seccion`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener secciones:', err);
    res.status(500).json({ error: 'Error al obtener secciones' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getSeccionById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.*, a.nombre_asignatura
      FROM SECCION s
      JOIN ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
      WHERE s.id_seccion = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Seccion no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener seccion:', err);
    res.status(500).json({ error: 'Error al obtener seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createSeccion = async (req, res) => {
  const { nombre_seccion, asignatura_id_asignatura, jornada_id_jornada } =
    req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO SECCION (id_seccion,nombre_seccion, asignatura_id_asignatura, jornada_id_jornada)
      VALUES (SEQ_SECCION.NEXTVAL, :nombre, :asignatura, :jornada)
      RETURNING id_seccion INTO :newId`,
      {
        nombre: nombre_seccion,
        asignatura: asignatura_id_asignatura,
        jornada: jornada_id_jornada,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_seccion: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear seccion:', err);
    res.status(500).json({ error: 'Error al crear seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateSeccion = async (req, res) => {
  const { id } = req.params;
  const { nombre_seccion, asignatura_id_asignatura } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE SECCION
      SET nombre_seccion = :nombre,
       asignatura_id_asignatura = :asignatura_id
      WHERE id_seccion = :id`,
      {
        id,
        nombre: nombre_seccion,
        asignatura_id: asignatura_id_asignatura,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Seccion no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Seccion actualizada' });
  } catch (err) {
    console.error('Error al actualizar seccion:', err);
    res.status(500).json({ error: 'Error al actualizar seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteSeccion = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM SECCION WHERE id_seccion = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Seccion no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Seccion eliminada' });
  } catch (err) {
    console.error('Error al eliminar seccion:', err);
    res.status(500).json({ error: 'Error al eliminar seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getSeccionesByAsignatura = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { asignaturaId } = req.params;
    const sql = `SELECT ID_SECCION, NOMBRE_SECCION FROM SECCION WHERE ASIGNATURA_ID_ASIGNATURA = :asignaturaId ORDER BY NOMBRE_SECCION`;
    const result = await connection.execute(sql, [asignaturaId], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    console.error('Error al eliminar seccion:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener secciones por asignatura' });
  } finally {
    if (connection) await connection.close();
  }
};

export const getDocentesBySeccion = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT u.ID_USUARIO, u.NOMBRE_USUARIO
      FROM USUARIO u
      JOIN USUARIOSECCION us ON u.ID_USUARIO = us.USUARIO_ID_USUARIO
      JOIN ROL r ON u.ROL_ID_ROL = r.ID_ROL
      WHERE us.SECCION_ID_SECCION = :seccionId
      AND r.NOMBRE_ROL = 'DOCENTE'
    `;
    const result = await connection.execute(
      sql,
      { seccionId: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener docentes por seccion:', error);
    res.status(500).json({ error: 'Error al obtener docentes por seccion' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
};
