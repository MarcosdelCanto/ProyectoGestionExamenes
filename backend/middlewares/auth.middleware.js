// middlewares/auth.middleware.js
import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    }
    const token = authHeader.split(' ')[1];
    const userPayload = verifyAccessToken(token);
    req.user = userPayload;
    //console.log(
    //  '[authMiddleware] Payload del token asignado a req.user:',
    //  req.user
    //); // <--- AÑADE ESTO
    next();
  } catch (err) {
    console.error('Error en authMiddleware:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Access token expirado.' });
    }
    return res.status(401).json({ mensaje: 'Token inválido.' });
  }
};
