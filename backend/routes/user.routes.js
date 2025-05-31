// routes/user.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getProfile, importUsuarios } from '../controllers/user.controller.js';
import { getUsuarios } from '../controllers/user.controller.js'; // Asume que tienes este controlador

const router = Router();

// GET /api/usuarios/profile
// Ruta protegida: solo accesible con JWT válido
router.get('/profile', authMiddleware, getProfile);

// POST /api/usuarios/import
// Protegemos la importación de usuarios
router.post('/import', authMiddleware, importUsuarios);

// Ruta para obtener usuarios

// GET /api/usuarios  o /api/usuarios?rolId=X
router.get('/', authMiddleware, getUsuarios);

export default router;
