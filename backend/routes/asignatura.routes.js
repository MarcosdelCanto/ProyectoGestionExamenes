import { Router } from 'express';
import {
  getAllAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura,
} from '../controllers/asignatura.controller.js';

const router = Router();

router.get('/', getAllAsignaturas);
router.get('/:id', getAsignaturaById);
router.post('/', createAsignatura);
router.put('/:id', updateAsignatura);
router.delete('/:id', deleteAsignatura);

export default router;
