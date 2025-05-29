import { Router } from 'express';
import { getAllSalas, getSalaById } from '../controllers/sala.controller.js';
import {
  getAllExamenes,
  getExamenById,
} from '../controllers/examen.controller.js';
import {
  getAllModulos,
  getModuloById,
} from '../controllers/modulo.controller.js';

const router = Router();

router.get('/salas', getAllSalas); // Obtener todas las salas
router.get('/salas/:id', getSalaById); // Obtener una sala por ID
router.get('/examenes', getAllExamenes); // Obtener todos los exámenes
router.get('/examenes/:id', getExamenById); // Obtener un examen por ID
router.get('/modulos', getAllModulos); // Obtener todos los módulos
router.get('/modulos/:id', getModuloById); // Obtener un módulo por ID
export default router;
