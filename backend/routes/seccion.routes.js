import { Router } from 'express';
import {
  getAllSecciones,
  getSeccionById,
  createSeccion,
  updateSeccion,
  deleteSeccion,
  getSeccionesByAsignatura,
} from '../controllers/seccion.controller.js';

const router = Router();

router.get('/', getAllSecciones);
router.get('/:id', getSeccionById);
router.post('/', createSeccion);
router.put('/:id', updateSeccion);
router.delete('/:id', deleteSeccion);
router.get('/asignatura/:asignaturaId', getSeccionesByAsignatura);

export default router;
