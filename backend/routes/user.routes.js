// routes/user.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { getProfile } from '../controllers/user.controller.js';

const router = express.Router();

// Ruta protegida: solo accesible con JWT válido
router.get('/profile', authMiddleware, getProfile);

export default router;
