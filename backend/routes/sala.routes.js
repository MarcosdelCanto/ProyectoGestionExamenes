import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllSalas,
  getSalaById,
  createSala,
  updateSala,
  deleteSala,
} from '../controllers/sala.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAllSalas);
router.get('/:id', getSalaById);
router.post('/', createSala);
router.put('/:id', updateSala);
router.delete('/:id', deleteSala);

export default router;
