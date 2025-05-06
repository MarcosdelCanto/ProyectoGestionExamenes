import { Router } from 'express';
import {
  getAllCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera,
} from '../controllers/carrera.controller.js';

const router = Router();

router.get('/', getAllCarreras);
router.get('/:id', getCarreraById);
router.post('/', createCarrera);
router.put('/:id', updateCarrera);
router.delete('/:id', deleteCarrera);

export default router;
