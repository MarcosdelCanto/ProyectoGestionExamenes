// routes/user.routes.js
import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getProfile, importUsuarios } from '../controllers/user.controller.js';
import { getUsuarios } from '../controllers/user.controller.js'; // Asume que tienes este controlador
import { getDocentes } from '../controllers/user.controller.js';
import { searchDocentes } from '../controllers/user.controller.js'; // Asegúrate de que este controlador exista
const router = Router();

// GET /api/usuarios/profile
// Ruta protegida: solo accesible con JWT válido
router.get('/profile', authMiddleware, getProfile);

// POST /api/usuarios/import
// Protegemos la importación de usuarios
router.post('/import', authMiddleware, importUsuarios);

// Ruta para obtener usuarios docentes
// GET /api/usuarios/docentes
router.get('/docentes', authMiddleware, getDocentes);

// Ruta protegida: solo accesible con JWT válido

// GET /api/usuarios  o /api/usuarios?rolId=X
router.get('/', authMiddleware, getUsuarios);

// NUEVA RUTA PROTEGIDA PARA BÚSQUEDA
router.get('/docentes/search', authMiddleware, searchDocentes);
export default router;
