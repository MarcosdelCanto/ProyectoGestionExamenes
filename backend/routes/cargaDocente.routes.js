import { Router } from 'express';
import { handleCargaDocentes } from '../controllers/cargaDocente.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/cargaDocente/docentes
// Protegemos la importación de docentes
router.post('/docentes', authMiddleware, handleCargaDocentes);

export default router;
