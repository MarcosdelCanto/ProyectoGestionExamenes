import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllSecciones,
  getSeccionById,
  createSeccion,
  updateSeccion,
  deleteSeccion,
  getSeccionesByAsignatura,
  getDocentesBySeccion,
} from '../controllers/seccion.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllSecciones);
router.get('/:id', getSeccionById);
router.post('/', createSeccion);
router.put('/:id', updateSeccion);
router.delete('/:id', deleteSeccion);
router.get('/asignatura/:asignaturaId', getSeccionesByAsignatura);
router.get('/secciones/:id/docentes', authMiddleware, getDocentesBySeccion);

export default router;
