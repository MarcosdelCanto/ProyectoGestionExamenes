import express from 'express';
import {
  login,
  logout,
  handleRefreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/auth.controller.js';
const router = express.Router();

// Login → devuelve access + refresh
router.post('/login', login);

// Refresh → genera nuevo access
router.post('/refresh', handleRefreshToken);

// Logout → elimina refresh token
router.post('/logout', logout);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

export default router;
