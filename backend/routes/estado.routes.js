import { Router } from 'express';
import {
  getAllEstados,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado,
} from '../controllers/estado.controller.js';

const router = Router();

router.get('/', getAllEstados);
router.get('/:id', getEstadoById);
router.post('/', createEstado);
router.put('/:id', updateEstado);
router.delete('/:id', deleteEstado);

export default router;
