// controllers/auth.controller.js
import oracledb from 'oracledb';
import { getConnection } from '../db.js';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils.js';

let refreshTokens = []; // En memoria; en producción guárdalos en BD

export const login = async (req, res) => {
  const { email_usuario, password_usuario } = req.body;
  // Log para verificar los datos recibidos
  console.log('Email recibido:', email_usuario);
  console.log('Contraseña recibida:', password_usuario);

  if (!email_usuario || !password_usuario) {
    return res
      .status(400)
      .json({ mensaje: 'Email y contraseña son obligatorios.' });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
         id_usuario, password_usuario AS hash, ROL_id_rol
       FROM USUARIO
       WHERE email_usuario = :email_usuario`,
      { email_usuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Log para verificar si el usuario existe
    console.log('Resultado de la consulta:', result.rows);

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    const row = result.rows[0];
    const { ID_USUARIO, HASH, ROL_ID_ROL } = row;

    // Log para verificar el hash recuperado
    console.log('Hash recuperado de la base de datos:', HASH);

    const coincide = await bcrypt.compare(password_usuario, HASH);

    // Log para verificar el resultado de la comparación
    console.log('¿La contraseña coincide?', coincide);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Generar tokens
    const payload = { id_usuario: ID_USUARIO, ROL_id_rol: ROL_ID_ROL };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Guardar refresh token en memoria
    refreshTokens.push(refreshToken);

    // Devolver ambos tokens y datos de usuario
    return res.status(200).json({
      mensaje: 'Login exitoso.',
      accessToken,
      refreshToken,
      usuario: {
        id_usuario: ID_USUARIO,
        email_usuario,
        ROL_id_rol: ROL_ID_ROL,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ mensaje: 'Error del servidor.' });
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

// Opcional: manejar refresh
export const handleRefreshToken = (req, res) => {
  const { token } = req.body;
  if (!token || !refreshTokens.includes(token)) {
    return res.status(401).json({ mensaje: 'Refresh token inválido.' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({
      id_usuario: payload.id_usuario,
      ROL_id_rol: payload.ROL_id_rol,
    });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ mensaje: 'Refresh token expirado.', err });
  }
};

// Opcional: logout
export const logout = (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  return res.sendStatus(204);
};
