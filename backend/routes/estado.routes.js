import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllEstados,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado,
} from '../controllers/estado.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAllEstados);
router.get('/:id', getEstadoById);
router.post('/', createEstado);
router.put('/:id', updateEstado);
router.delete('/:id', deleteEstado);

export default router;
