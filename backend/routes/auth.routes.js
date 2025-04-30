import express from 'express';
import {
  login,
  logout,
  handleRefreshToken,
} from '../controllers/auth.controller.js';
const router = express.Router();

// Login → devuelve access + refresh
router.post('/login', login);

// Refresh → genera nuevo access
router.post('/refresh', handleRefreshToken);

// Logout → elimina refresh token
router.post('/logout', logout);

export default router;
