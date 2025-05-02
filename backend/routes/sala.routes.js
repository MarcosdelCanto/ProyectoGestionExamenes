import { Router } from 'express';
import {
  getAllSalas,
  getSalaById,
  createSala,
  updateSala,
  deleteSala,
} from '../controllers/sala.controller.js';

const router = Router();

// Rutas para las salas
router.get('/', getAllSalas);        // Obtener todas las salas
router.get('/:id', getSalaById);     // Obtener una sala por ID
router.post('/', createSala);        // Crear una nueva sala
router.put('/:id', updateSala);      // Actualizar una sala por ID
router.delete('/:id', deleteSala);   // Eliminar una sala por ID

export default router;