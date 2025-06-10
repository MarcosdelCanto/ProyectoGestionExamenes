// backend/routes/carga.routes.js
import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { handleCargaMasiva } from '../controllers/carga.controller.js';

const router = Router();

// POST /api/carga/7  ← aquí 7 sería tu sedeId
router.post('/:sedeId', authMiddleware, handleCargaMasiva);

export default router;
