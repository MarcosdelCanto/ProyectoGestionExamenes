import { Router } from 'express';
import {
  getAllEscuelas,
  getEscuelaById,
  createEscuela,
  updateEscuela,
  deleteEscuela,
} from '../controllers/escuela.controller.js';

const router = Router();

router.get('/', getAllEscuelas);
router.get('/:id', getEscuelaById);
router.post('/', createEscuela);
router.put('/:id', updateEscuela);
router.delete('/:id', deleteEscuela);

export default router;
