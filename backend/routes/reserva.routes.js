import { Router } from 'express';
import {
  getAllReservas,
  getReservaById,
  createReserva,
  updateReserva,
  deleteReserva,
} from '../controllers/reserva.controller.js';
// Aquí podrías añadir middlewares de autenticación/autorización si es necesario
// import { authRequired, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', /* authRequired, */ getAllReservas);
router.get('/:id', /* authRequired, */ getReservaById);
router.post('/', /* authRequired, isAdmin, */ createReserva); // Crear podría ser solo para admin/docente
router.put('/:id', /* authRequired, isAdmin, */ updateReserva);
router.delete('/:id', /* authRequired, isAdmin, */ deleteReserva);

export default router;
