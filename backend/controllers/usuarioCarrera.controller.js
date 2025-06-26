import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Listar todas las asociaciones Usuario-Carrera
export const listUsuarioCarreras = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    // JOIN con USUARIO y CARRERA para obtener nombres
    const result = await conn.execute(
      `SELECT uc.USUARIO_ID_USUARIO, u.NOMBRE_USUARIO, u.EMAIL_USUARIO,
              uc.CARRERA_ID_CARRERA, c.NOMBRE_CARRERA
       FROM USUARIOCARRERA uc
       JOIN USUARIO u ON uc.USUARIO_ID_USUARIO = u.ID_USUARIO
       JOIN CARRERA c ON uc.CARRERA_ID_CARRERA = c.ID_CARRERA
       ORDER BY u.NOMBRE_USUARIO, c.NOMBRE_CARRERA`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Mapear para que coincida con la estructura esperada por el frontend
    const formattedResult = result.rows.map((row) => ({
      USUARIO_ID_USUARIO: row.USUARIO_ID_USUARIO,
      CARRERA_ID_CARRERA: row.CARRERA_ID_CARRERA,
      // El frontend espera un objeto Usuario y Carrera anidado
      Usuario: {
        ID_USUARIO: row.USUARIO_ID_USUARIO,
        NOMBRE_USUARIO: row.NOMBRE_USUARIO,
        EMAIL_USUARIO: row.EMAIL_USUARIO,
      },
      Carrera: {
        ID_CARRERA: row.CARRERA_ID_CARRERA,
        NOMBRE_CARRERA: row.NOMBRE_CARRERA,
      },
    }));
    res.json(formattedResult);
  } catch (err) {
    console.error('Error al listar asociaciones usuario-carrera:', err);
    res
      .status(500)
      .json({ error: 'Error al listar asociaciones usuario-carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

// Crear una nueva asociación Usuario-Carrera
export const createUsuarioCarrera = async (req, res) => {
  const { USUARIO_ID_USUARIO, CARRERA_ID_CARRERA } = req.body;
  if (!USUARIO_ID_USUARIO || !CARRERA_ID_CARRERA) {
    return res.status(400).json({
      error: 'USUARIO_ID_USUARIO y CARRERA_ID_CARRERA son requeridos.',
    });
  }
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO USUARIOCARRERA (USUARIO_ID_USUARIO, CARRERA_ID_CARRERA)
       VALUES (:usuario_id, :carrera_id)`,
      {
        usuario_id: USUARIO_ID_USUARIO,
        carrera_id: CARRERA_ID_CARRERA,
      }
    );
    await conn.commit();
    res.status(201).json({
      USUARIO_ID_USUARIO,
      CARRERA_ID_CARRERA,
      message: 'Asociación creada exitosamente',
    });
  } catch (err) {
    console.error('Error al crear asociación usuario-carrera:', err);
    // Manejar error de clave duplicada (si la asociación ya existe)
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ error: 'Esta asociación ya existe.' });
    }
    res
      .status(500)
      .json({ error: 'Error al crear asociación usuario-carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

// Eliminar una asociación Usuario-Carrera
// Los IDs vendrán como parámetros de ruta
export const deleteUsuarioCarrera = async (req, res) => {
  const { usuarioId, carreraId } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM USUARIOCARRERA
       WHERE USUARIO_ID_USUARIO = :usuario_id AND CARRERA_ID_CARRERA = :carrera_id`,
      {
        usuario_id: usuarioId,
        carrera_id: carreraId,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Asociación no encontrada' });
    await conn.commit();
    res.status(200).json({ message: 'Asociación eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar asociación usuario-carrera:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar asociación usuario-carrera' });
  } finally {
    if (conn) await conn.close();
  }
};

// Obtener todas las carreras asociadas a un usuario específico
export const getCarrerasByUsuario = async (req, res) => {
  const { usuarioId } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT uc.CARRERA_ID_CARRERA, c.NOMBRE_CARRERA
       FROM USUARIOCARRERA uc
       JOIN CARRERA c ON uc.CARRERA_ID_CARRERA = c.ID_CARRERA
       WHERE uc.USUARIO_ID_USUARIO = :usuarioId
       ORDER BY c.NOMBRE_CARRERA`,
      { usuarioId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const carreras = result.rows.map((row) => ({
      ID_CARRERA: row.CARRERA_ID_CARRERA,
      NOMBRE_CARRERA: row.NOMBRE_CARRERA,
    }));
    res.json(carreras);
  } catch (err) {
    console.error(
      `Error al listar carreras para el usuario ${usuarioId}:`,
      err
    );
    res.status(500).json({ error: 'Error al listar carreras del usuario' });
  } finally {
    if (conn) await conn.close();
  }
};
