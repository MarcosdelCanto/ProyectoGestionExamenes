import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Función para obtener todos los módulos
export const getAllModulos = async (req, res) => {
  let conn;
  // Conexión a la base de datos
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id_modulo, nombre_modulo, inicio_modulo, fin_modulo
       FROM MODULO
       ORDER BY id_modulo`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener módulos:', err);
    res.status(500).json({ error: 'Error al obtener módulos' });
  } finally {
    if (conn) await conn.close();
  }
};
// Función para obtener un módulo por ID
export const getModuloById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM MODULO WHERE id_modulo = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Módulo no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener módulo:', err);
    res.status(500).json({ error: 'Error al obtener módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
// Función para crear un módulo
export const createModulo = async (req, res) => {
  const { nombre_modulo, inicio_modulo, fin_modulo } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MODULO (id_modulo, nombre_modulo, inicio_modulo, fin_modulo)
       VALUES (SEQ_MODULO.NEXTVAL, :nombre, :inicio, :fin)
       RETURNING id_modulo INTO :newId`,
      {
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_modulo: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear módulo:', err);
    res.status(500).json({ error: 'Error al crear módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
//función para actualizar un módulo
export const updateModulo = async (req, res) => {
  const { id } = req.params;
  const { nombre_modulo, inicio_modulo, fin_modulo } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE MODULO
       SET nombre_modulo = :name,
           inicio_modulo = :start,
           fin_modulo    = :end
       WHERE id_modulo = :id`,
      {
        id,
        name: nombre_modulo,
        start: inicio_modulo,
        end: fin_modulo,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Módulo no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Módulo actualizado' });
  } catch (err) {
    console.error('Error al actualizar módulo:', err);
    res.status(500).json({ error: 'Error al actualizar módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
// Función para elminar un módulo
export const deleteModulo = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM MODULO WHERE id_modulo = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Módulo no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Módulo eliminado' });
  } catch (err) {
    console.error('Error al eliminar módulo:', err);
    res.status(500).json({ error: 'Error al eliminar módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
