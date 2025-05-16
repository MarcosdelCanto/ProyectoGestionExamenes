import { Router } from 'express';
import {
  getAllExamenes,
  getExamenById,
  createExamen,
  updateExamen,
  deleteExamen,
} from '../controllers/examen.controller.js';

const router = Router();

router.get('/', getAllExamenes);
router.get('/:id', getExamenById);
router.post('/', createExamen);
router.put('/:id', updateExamen);
router.delete('/:id', deleteExamen);

export default router;
