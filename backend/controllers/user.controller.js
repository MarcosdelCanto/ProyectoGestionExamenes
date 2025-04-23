// controllers/user.controller.js
import { getConnection } from '../db.js';

export const getProfile = async (req, res) => {
  const { id_usuario } = req.user; // viene del authMiddleware

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
         id_usuario,
         nombre_usuario,
         email_usuario,
         fecha_crea_usuario,
         fecha_actu_usuario,
         ROL_id_rol
       FROM USUARIO
       WHERE id_usuario = :id`,
      { id: id_usuario }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const perfil = result.rows[0];
    res.json({ perfil });
  } catch (err) {
    console.error('Error en getProfile:', err);
    res.status(500).json({ mensaje: 'Error al obtener perfil.' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error('Error cerrando conexión:', e);
      }
    }
  }
};
