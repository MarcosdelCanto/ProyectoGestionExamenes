import { getConnection } from '../db.js';
import oracledb from 'oracledb';
export const getAllModulos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT m.id_modulo, m.nombre_modulo, m.inicio_modulo, m.fin_modulo, m.orden, e.nombre_estado
       FROM MODULO m
       JOIN ESTADO e ON m.estado_id_estado = e.id_estado
       ORDER BY orden`,
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

export const getModuloById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT m.*, e.nombre_estado
      FROM MODULO m
      JOIN ESTADO e ON m.estado_id_estado = e.id_estado
      WHERE m.id_modulo = :id`,
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
  const { nombre_modulo, inicio_modulo, fin_modulo, orden } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MODULO (id_modulo, nombre_modulo, inicio_modulo, fin_modulo, orden, estado_id_estado)
       VALUES (SEQ_MODULO.NEXTVAL, :nombre, :inicio, :fin, :orden, 1)
       RETURNING id_modulo INTO :newId`,
      {
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        orden,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_modulo: result.outBinds.newId[0] });
  } catch (err) {
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: `Ya existe un módulo con orden ${orden}.` });
    }
    console.error('Error creando módulo:', err);
    res.status(500).json({ error: 'Error creando módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
//función para actualizar un módulo
export const updateModulo = async (req, res) => {
  const { id } = req.params;
  const { orden, nombre_modulo, inicio_modulo, fin_modulo, estado_id_estado } =
    req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE MODULO
       SET orden = :orden,
           nombre_modulo = :nombre,
           inicio_modulo = :inicio,
           fin_modulo = :fin,
           estado_id_estado = :estado_id
       WHERE id_modulo = :id`,
      {
        orden: orden,
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        id,
        estado_id: estado_id_estado,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Módulo no encontrado' });
    await conn.commit();
    res.json({ message: 'Módulo actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar módulo:', err);
    res.status(500).json({
      error: 'Error al actualizar módulo',
      details: err.message,
    });
  } finally {
    if (conn) await conn.close();
  }
};
// Borra un modulo y actualiza el orden de los demás
export const deleteModulo = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM MUDULO WHERE id_modulo = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Módulo no encontrado' });
    await conn.commit();
    res.json({ message: 'Módulo eliminado' });
  } catch (err) {
    console.error('Error eliminando módulo:', err);
    res.status(500).json({ error: 'Error eliminando módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
