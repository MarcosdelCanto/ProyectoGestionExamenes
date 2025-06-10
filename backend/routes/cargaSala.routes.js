import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { handleCargaSalas } from '../controllers/cargaSala.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/cargaSala/salas
router.post('/salas', authMiddleware, handleCargaSalas);

export default router;
