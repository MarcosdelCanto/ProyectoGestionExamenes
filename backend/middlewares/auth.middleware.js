// middlewares/auth.middleware.js
import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    }
    const userPayload = verifyAccessToken(authHeader);
    req.user = userPayload;
    next();
  } catch (err) {
    console.error('Error en authMiddleware:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Access token expirado.' });
    }
    return res.status(401).json({ mensaje: 'Token inválido.' });
  }
};
