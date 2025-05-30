import { Router } from 'express';
import {
  getAllAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura,
  getAsignaturasByCarrera, // Importar la nueva función
} from '../controllers/asignatura.controller.js';

const router = Router();

router.get('/', getAllAsignaturas);
router.get('/:id', getAsignaturaById);
router.post('/', createAsignatura);
router.put('/:id', updateAsignatura);
router.delete('/:id', deleteAsignatura);
router.get('/carrera/:carreraId', getAsignaturasByCarrera); // Añadir esta ruta

export default router;
