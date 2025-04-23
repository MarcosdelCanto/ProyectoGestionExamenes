// middlewares/auth.middleware.js
import { verifyToken } from '../utils/jwt.utils.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    }

    const userPayload = verifyToken(authHeader);

    req.user = userPayload;

    // 4. Continuar al siguiente middleware / controlador
    next();
  } catch (err) {
    console.error('Error en authMiddleware:', err);
    res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};
