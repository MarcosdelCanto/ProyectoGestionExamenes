import { Router } from 'express';
import {
  getAllJornadas,
  getJornadaById,
  createJornada,
  updateJornada,
  deleteJornada,
} from '../controllers/jornada.controller.js';

const router = Router();

router.get('/', getAllJornadas);
router.get('/:id', getJornadaById);
router.post('/', createJornada);
router.put('/:id', updateJornada);
router.delete('/:id', deleteJornada);

export default router;
