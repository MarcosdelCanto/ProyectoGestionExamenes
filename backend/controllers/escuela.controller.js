// backend/controllers/escuela.controller.js

import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllEscuelas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.id_escuela, e.nombre_escuela, fecha_actualizacion_escuela, e.sede_id_sede, s.nombre_sede,
              e.COLOR_BACKGROUND, e.COLOR_BORDER -- <-- Columnas de color añadidas
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
      `SELECT e.id_escuela, e.nombre_escuela, e.fecha_actualizacion_escuela, e.sede_id_sede, s.nombre_sede,
              e.COLOR_BACKGROUND, e.COLOR_BORDER -- <-- Columnas de color añadidas
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
  // Desestructuración para incluir los nuevos campos de color
  const { nombre_escuela, sede_id_sede, color_background, color_border } =
    req.body;
  let conn;
  try {
    // Validación básica de campos obligatorios para el negocio
    if (!nombre_escuela || !sede_id_sede) {
      return res.status(400).json({
        error: 'El nombre de la escuela y la sede son campos obligatorios.',
      });
    }

    conn = await getConnection();

    // Opcional: Verificar si la sede existe (ya presente en tu código)
    const sedeExists = await conn.execute(
      'SELECT 1 FROM SEDE WHERE id_sede = :sede_id',
      [sede_id_sede],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (sedeExists.rows.length === 0) {
      return res.status(400).json({ error: 'La sede especificada no existe.' });
    }

    const result = await conn.execute(
      `INSERT INTO ESCUELA (id_escuela,nombre_escuela,fecha_creacion_escuela, sede_id_sede, COLOR_BACKGROUND, COLOR_BORDER)
       VALUES (SEQ_ESCUELA.NEXTVAL, :nombre, SYSTIMESTAMP, :sede_id, :color_background, :color_border)
       RETURNING id_escuela INTO :newId`,
      {
        nombre: nombre_escuela,
        sede_id: sede_id_sede,
        color_background: color_background || null, // Permite que sea NULL si no se envía
        color_border: color_border || null, // Permite que sea NULL si no se envía
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_escuela: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear escuela:', err);
    // ORA-00001: unique constraint violated
    if (err.errorNum === 1) {
      return res
        .status(409)
        .json({ error: 'Ya existe una escuela con ese nombre o ID de sede.' });
    }
    // ORA-01400: cannot insert NULL into (...) (si un campo NOT NULL es NULL)
    if (err.errorNum === 1400) {
      return res
        .status(400)
        .json({ error: 'Faltan datos obligatorios o inválidos.' });
    }
    res
      .status(500)
      .json({ error: 'Error al crear escuela', detalles: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateEscuela = async (req, res) => {
  const { id } = req.params;
  // Desestructuración para incluir los nuevos campos de color
  const { nombre_escuela, sede_id_sede, color_background, color_border } =
    req.body;
  let conn;
  try {
    // Validación básica de campos obligatorios
    if (!nombre_escuela || !sede_id_sede) {
      return res.status(400).json({
        error: 'El nombre de la escuela y la sede son campos obligatorios.',
      });
    }

    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ESCUELA
       SET nombre_escuela = :nombre,
           sede_id_sede = :sede_id,
           COLOR_BACKGROUND = :color_background, -- Actualiza el color de fondo
           COLOR_BORDER = :color_border         -- Actualiza el color de borde
       WHERE id_escuela = :id`,
      {
        id,
        nombre: nombre_escuela,
        sede_id: sede_id_sede,
        color_background: color_background || null,
        color_border: color_border || null,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Escuela no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Escuela actualizada con éxito' });
  } catch (err) {
    console.error('Error al actualizar escuela:', err);
    // ORA-00001: unique constraint violated
    if (err.errorNum === 1) {
      return res
        .status(409)
        .json({ error: 'Ya existe otra escuela con ese nombre o ID de sede.' });
    }
    res
      .status(500)
      .json({ error: 'Error al actualizar escuela', detalles: err.message });
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
    // ORA-02292: integrity constraint violated - child record found
    if (err.errorNum === 2292) {
      return res
        .status(409)
        .json({
          error:
            'No se puede eliminar la escuela porque tiene carreras asociadas.',
        });
    }
    res
      .status(500)
      .json({ error: 'Error al eliminar escuela', detalles: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

export const getEscuelasBySede = async (req, res) => {
  let connection;
  try {
    const { sedeId } = req.params;
    if (!sedeId) {
      return res.status(400).json({ message: 'Sede ID is required' });
    }
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT ID_ESCUELA, NOMBRE_ESCUELA, SEDE_ID_SEDE, COLOR_BACKGROUND, COLOR_BORDER -- <-- Columnas de color añadidas
       FROM ESCUELA
       WHERE SEDE_ID_SEDE = :id`,
      [parseInt(sedeId)],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching escuelas by sede:', error);
    res.status(500).json({ message: 'Error al obtener escuelas por sede' });
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
