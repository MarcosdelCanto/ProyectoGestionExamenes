// middlewares/auth.middleware.js
import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        mensaje: 'Token no proporcionado.',
        codigo: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        mensaje: 'Formato de token inválido.',
        codigo: 'INVALID_FORMAT',
      });
    }

    const userPayload = verifyAccessToken(token);
    req.user = userPayload;
    next();
  } catch (err) {
    console.error('Error en authMiddleware:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        mensaje: 'Access token expirado. Por favor, refresca tu sesión.',
        codigo: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        mensaje: 'Token inválido.',
        codigo: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      mensaje: 'Error de autenticación.',
      codigo: 'AUTH_ERROR',
    });
  }
};
