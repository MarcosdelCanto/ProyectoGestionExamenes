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
         u.id_usuario, u.nombre_usuario, u.password_usuario AS hash, u.ROL_id_rol, r.NOMBRE_ROL
       FROM USUARIO U
       JOIN ROL R ON U.ROL_ID_ROL = R.id_rol
       WHERE email_usuario = :email_usuario`,
      { email_usuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    const row = result.rows[0];
    const { ID_USUARIO, NOMBRE_USUARIO, HASH, ROL_ID_ROL, NOMBRE_ROL } = row;

    const coincide = await bcrypt.compare(password_usuario, HASH);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Generar tokens
    const payload = {
      id_usuario: ID_USUARIO,
      nombre_usuario: NOMBRE_USUARIO, // <-- AÑADIR NOMBRE DE USUARIO AL PAYLOAD
      rol_id_rol: ROL_ID_ROL,
      nombre_rol: NOMBRE_ROL,
    };
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
        nombre_usuario: NOMBRE_USUARIO, // <-- AÑADIR NOMBRE DE USUARIO A LA RESPUESTA
        email_usuario,
        ROL_ID_ROL, // Mantener formato original en mayúsculas
        rol_id_rol: ROL_ID_ROL, // Añadir formato en minúsculas para compatibilidad
        nombre_rol: NOMBRE_ROL,
        rol: NOMBRE_ROL, // Asegurar que esto sea el NOMBRE_ROL
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
      nombre_usuario: payload.nombre_usuario, // <-- Asegurar que se propaga al refrescar
      rol_id_rol: payload.rol_id_rol, // Mantener consistencia
      nombre_rol: payload.nombre_rol,
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
