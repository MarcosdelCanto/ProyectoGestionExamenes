import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  getCarrerasByEscuela, // Importar la nueva función
} from '../controllers/carrera.controller.js';

const router = Router();

router.get('/', getAllCarreras);
router.get('/:id', getCarreraById);
router.post('/', createCarrera);
router.put('/:id', updateCarrera);
router.delete('/:id', deleteCarrera);
router.get('/escuela/:escuelaId', getCarrerasByEscuela); // Añadir esta ruta

export default router;
