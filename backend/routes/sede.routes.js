import { Router } from 'express';
import {
  getAllSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede,
} from '../controllers/sede.controller.js';

const router = Router();

router.get('/', getAllSedes);
router.get('/:id', getSedeById);
router.post('/', createSede);
router.put('/:id', updateSede);
router.delete('/:id', deleteSede);

export default router;
