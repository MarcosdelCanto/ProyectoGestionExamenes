import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Función para obtener todos los módulos
export const getAllModulos = async (req, res) => {
  let conn;
  // Conexión a la base de datos
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id_modulo, nombre_modulo, inicio_modulo, fin_modulo, orden
       FROM MODULO
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
  const { nombre_modulo, inicio_modulo, fin_modulo, orden } = req.body;

  if (orden == null || isNaN(orden)) {
    return res
      .status(400)
      .json({ error: 'El campo "orden" es obligatorio y debe ser numérico.' });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MODULO (id_modulo, nombre_modulo, inicio_modulo, fin_modulo, orden)
       VALUES (SEQ_MODULO.NEXTVAL, :nombre, :inicio, :fin, :orden)
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
  const { nombre_modulo, inicio_modulo, fin_modulo, orden } = req.body;

  if (orden == null || isNaN(orden)) {
    return res
      .status(400)
      .json({ error: 'El campo "orden" es obligatorio y debe ser numérico.' });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE MODULO
       SET nombre_modulo = :nombre,
           inicio_modulo = :inicio,
           fin_modulo    = :fin,
           orden         = :orden
       WHERE id_modulo = :id`,
      {
        id,
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        orden,
      }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    await conn.commit();
    res.status(200).json({ message: 'Módulo actualizado' });
  } catch (err) {
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: `Ya existe un módulo con orden ${orden}.` });
    }
    console.error('Error al actualizar módulo:', err);
    res.status(500).json({ error: 'Error al actualizar módulo' });
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
    // obtiene el orden del módulo a eliminar
    const lookup = await conn.execute(
      `SELECT orden FROM MODULO WHERE id_modulo = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (lookup.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    const deletedOrden = lookup.rows[0].ORDEN;

    // elimina el módulo
    await conn.execute(`DELETE FROM MODULO WHERE id_modulo = :id`, [id]);

    // cambia el orden de los demás módulos
    await conn.execute(
      `UPDATE MODULO
          SET orden = orden - 1
        WHERE orden > :deletedOrden`,
      [deletedOrden]
    );

    await conn.commit();
    res.json({ message: 'Módulo eliminado y orden actualizado' });
  } catch (err) {
    console.error('Error eliminando módulo:', err);
    res.status(500).json({ error: 'Error eliminando módulo' });
  } finally {
    if (conn) await conn.close();
  }
};
