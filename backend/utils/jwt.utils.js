// utils/jwt.utils.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Genera un JWT con el payload que le pases.
 * @param {Object} payload - Datos a incluir (p.ej. { id_usuario, ROL_id_rol })
 * @returns {String} token firmado
 */
export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

/**
 * Verifica un token y devuelve el payload si es válido.
 * @param {String} token - JWT en formato "Bearer <token>" o solo el token
 * @returns {Object} payload decodificado
 * @throws {Error} si el token no es válido o expiró
 */
export function verifyToken(token) {
  // Si viene con "Bearer ", lo limpiamos
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  return jwt.verify(raw, SECRET);
}
