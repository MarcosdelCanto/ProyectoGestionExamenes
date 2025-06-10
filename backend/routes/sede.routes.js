import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede,
} from '../controllers/sede.controller.js';

const router = Router();

router.get('/', getAllSedes);
router.get('/:id', getSedeById);
router.post('/', createSede);
router.put('/:id', updateSede);
router.delete('/:id', deleteSede);

export default router;
