// utils/jwt.utils.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_EXPIRES_IN || '7d';

export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token) {
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  return jwt.verify(raw, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
