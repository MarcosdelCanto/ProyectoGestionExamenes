import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Listar todas las asociaciones Usuario-Seccion
export const listUsuarioSecciones = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT us.USUARIO_ID_USUARIO, u.NOMBRE_USUARIO, u.EMAIL_USUARIO,
              us.SECCION_ID_SECCION, s.NOMBRE_SECCION
       FROM USUARIOSECCION us
       JOIN USUARIO u ON us.USUARIO_ID_USUARIO = u.ID_USUARIO
       JOIN SECCION s ON us.SECCION_ID_SECCION = s.ID_SECCION
       ORDER BY u.NOMBRE_USUARIO, s.NOMBRE_SECCION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Mapear para que coincida con la estructura esperada por el frontend
    const formattedResult = result.rows.map((row) => ({
      USUARIO_ID_USUARIO: row.USUARIO_ID_USUARIO,
      SECCION_ID_SECCION: row.SECCION_ID_SECCION,
      Usuario: {
        ID_USUARIO: row.USUARIO_ID_USUARIO,
        NOMBRE_USUARIO: row.NOMBRE_USUARIO,
        EMAIL_USUARIO: row.EMAIL_USUARIO,
      },
      Seccion: {
        ID_SECCION: row.SECCION_ID_SECCION,
        NOMBRE_SECCION: row.NOMBRE_SECCION,
        // Podrías añadir CODIGO_SECCION si lo tienes y lo necesitas
      },
    }));
    res.json(formattedResult);
  } catch (err) {
    console.error('Error al listar asociaciones usuario-seccion:', err);
    res
      .status(500)
      .json({ error: 'Error al listar asociaciones usuario-seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

// Crear una nueva asociación Usuario-Seccion
export const createUsuarioSeccion = async (req, res) => {
  const { USUARIO_ID_USUARIO, SECCION_ID_SECCION } = req.body;
  if (!USUARIO_ID_USUARIO || !SECCION_ID_SECCION) {
    return res.status(400).json({
      error: 'USUARIO_ID_USUARIO y SECCION_ID_SECCION son requeridos.',
    });
  }
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO USUARIOSECCION (USUARIO_ID_USUARIO, SECCION_ID_SECCION)
       VALUES (:usuario_id, :seccion_id)`,
      {
        usuario_id: USUARIO_ID_USUARIO,
        seccion_id: SECCION_ID_SECCION,
      }
    );
    await conn.commit();
    res.status(201).json({
      USUARIO_ID_USUARIO,
      SECCION_ID_SECCION,
      message: 'Asociación creada exitosamente',
    });
  } catch (err) {
    console.error('Error al crear asociación usuario-seccion:', err);
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ error: 'Esta asociación ya existe.' });
    }
    res
      .status(500)
      .json({ error: 'Error al crear asociación usuario-seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

// Eliminar una asociación Usuario-Seccion
export const deleteUsuarioSeccion = async (req, res) => {
  const { usuarioId, seccionId } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM USUARIOSECCION
       WHERE USUARIO_ID_USUARIO = :usuario_id AND SECCION_ID_SECCION = :seccion_id`,
      {
        usuario_id: usuarioId,
        seccion_id: seccionId,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Asociación no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Asociación eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar asociación usuario-seccion:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar asociación usuario-seccion' });
  } finally {
    if (conn) await conn.close();
  }
};

// Obtener todas las secciones asociadas a un usuario específico
export const getSeccionesByUsuario = async (req, res) => {
  const { usuarioId } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT us.SECCION_ID_SECCION, s.NOMBRE_SECCION, s.CODIGO_SECCION
       FROM USUARIOSECCION us
       JOIN SECCION s ON us.SECCION_ID_SECCION = s.ID_SECCION
       WHERE us.USUARIO_ID_USUARIO = :usuarioId
       ORDER BY s.NOMBRE_SECCION`,
      { usuarioId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // El frontend podría esperar un array de objetos Seccion directamente
    const secciones = result.rows.map((row) => ({
      ID_SECCION: row.SECCION_ID_SECCION,
      NOMBRE_SECCION: row.NOMBRE_SECCION,
      CODIGO_SECCION: row.CODIGO_SECCION, // Opcional, si lo necesitas
    }));
    res.json(secciones);
  } catch (err) {
    console.error(
      `Error al listar secciones para el usuario ${usuarioId}:`,
      err
    );
    res.status(500).json({ error: 'Error al listar secciones del usuario' });
  } finally {
    if (conn) await conn.close();
  }
};
