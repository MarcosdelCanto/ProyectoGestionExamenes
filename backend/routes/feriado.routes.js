import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js';
import {
  getAllFeriados,
  getFeriadosByRango,
  checkFechaBloqueo,
  getFeriadoById,
  createFeriado,
  updateFeriado,
  deleteFeriado,
} from '../controllers/feriado.controller.js';

const router = express.Router();

// Rutas accesibles por cualquier usuario autenticado (usadas desde el formulario de reserva y calendario)
router.get('/check', authMiddleware, checkFechaBloqueo);
router.get('/rango', authMiddleware, getFeriadosByRango);

// Rutas de administración: requieren permiso GESTIONAR FERIADOS
router.get(
  '/',
  authMiddleware,
  checkPermission(['GESTIONAR FERIADOS']),
  getAllFeriados
);
router.get(
  '/:id',
  authMiddleware,
  checkPermission(['GESTIONAR FERIADOS']),
  getFeriadoById
);
router.post(
  '/',
  authMiddleware,
  checkPermission(['GESTIONAR FERIADOS']),
  createFeriado
);
router.put(
  '/:id',
  authMiddleware,
  checkPermission(['GESTIONAR FERIADOS']),
  updateFeriado
);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['GESTIONAR FERIADOS']),
  deleteFeriado
);

export default router;
