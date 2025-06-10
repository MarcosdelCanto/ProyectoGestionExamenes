import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllEdificios,
  getEdificioById,
  createEdificio,
  updateEdificio,
  deleteEdificio,
  getEdificiosBySede,
} from '../controllers/edificio.controller.js';

const router = Router();

router.get('/', getAllEdificios);
router.get('/:id', getEdificioById);
router.post('/', createEdificio);
router.put('/:id', updateEdificio);
router.delete('/:id', deleteEdificio);
router.get('/sede/:sedeId', getEdificiosBySede);

export default router;
