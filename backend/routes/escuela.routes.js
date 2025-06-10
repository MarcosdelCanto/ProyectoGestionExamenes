import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express

import {
  getAllEscuelas,
  getEscuelaById,
  createEscuela,
  updateEscuela,
  deleteEscuela,
  getEscuelasBySede,
} from '../controllers/escuela.controller.js';

const router = Router();

router.get('/', getAllEscuelas);
router.get('/:id', getEscuelaById);
router.post('/', createEscuela);
router.put('/:id', updateEscuela);
router.delete('/:id', deleteEscuela);
router.get('/sede/:sedeId', getEscuelasBySede); // Esta es la ruta clave

export default router;
