import { Router } from 'express';
import {
  getAllEdificios,
  getEdificioById,
  createEdificio,
  updateEdificio,
  deleteEdificio,
} from '../controllers/edificio.controller.js';

const router = Router();

router.get('/', getAllEdificios);
router.get('/:id', getEdificioById);
router.post('/', createEdificio);
router.put('/:id', updateEdificio);
router.delete('/:id', deleteEdificio);

export default router;
