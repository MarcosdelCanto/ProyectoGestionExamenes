import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getAllPeriodos,
  getPeriodosActivos,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
} from '../controllers/periodoReservas.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getAllPeriodos);
router.get('/activos', authMiddleware, getPeriodosActivos);
router.post('/', authMiddleware, createPeriodo);
router.put('/:id', authMiddleware, updatePeriodo);
router.delete('/:id', authMiddleware, deletePeriodo);

export default router;
