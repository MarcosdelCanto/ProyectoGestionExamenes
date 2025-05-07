import { Router } from 'express';
import {
  getAllSalas,
  getSalaById,
  createSala,
  updateSala,
  deleteSala,
} from '../controllers/sala.controller.js';

const router = Router();

router.get('/', getAllSalas);
router.get('/:id', getSalaById);
router.post('/', createSala);
router.put('/:id', updateSala);
router.delete('/:id', deleteSala);

export default router;
