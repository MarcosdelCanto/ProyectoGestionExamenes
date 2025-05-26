// routes/user.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getProfile, importUsuarios } from '../controllers/user.controller.js';

const router = Router();

// GET /api/usuarios/profile
// Ruta protegida: solo accesible con JWT válido
router.get('/profile', authMiddleware, getProfile);

// POST /api/usuarios/import
// Protegemos la importación de usuarios
router.post('/import', authMiddleware, importUsuarios);

export default router;
