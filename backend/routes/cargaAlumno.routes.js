import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { handleCargaAlumnos } from '../controllers/cargaAlumno.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/carga/alumnos
router.post('/alumnos', authMiddleware, handleCargaAlumnos);

export default router;
