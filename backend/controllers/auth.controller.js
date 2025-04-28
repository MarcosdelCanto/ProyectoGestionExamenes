import { getConnection } from '../db.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.utils.js';
// const usuariosMock = [];
export const login = async (req, res) => {
  const { email_usuario, password_usuario } = req.body;
  // 1. Validar que vengan email y password
  if (!email_usuario || !password_usuario) {
    return res
      .status(400)
      .json({ mensaje: 'Email y contraseña son obligatorios.' });
  }
  let conn;
  try {
    // 2. Obtener conexión del pool
    conn = await getConnection();
    // 3. Buscar usuario por email
    const result = await conn.execute(
      `SELECT
         id_usuario, password_usuario AS hash, ROL_id_rol
       FROM USUARIO
       WHERE email_usuario = :email_usuario`,
      { email_usuario }
    );
    // 4. Si no existe, 401 Unauthorized
    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }
    const [{ ID_USUARIO, HASH, ROL_ID_ROL }] = result.rows;
    // 5. Comparar contraseñas
    const coincide = await bcrypt.compare(password_usuario, HASH);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }
    // 6. Generar token JWT
    const token = generateToken({
      id_usuario: ID_USUARIO,
      ROL_id_rol: ROL_ID_ROL,
    });
    // 7. Enviar respuesta con token y datos de usuario
    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id_usuario: ID_USUARIO,
        email_usuario,
        ROL_id_rol: ROL_ID_ROL,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ mensaje: 'Error del servidor.' });
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
