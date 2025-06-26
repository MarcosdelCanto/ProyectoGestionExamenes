import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getAllCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  getCarrerasByEscuela, // Importar la nueva función
  updateCarrerasFromPlanEstudio, // Importar el nuevo controlador
} from '../controllers/carrera.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js'; // <-- 1. Importar middleware de autenticación
import { checkPermission } from '../middlewares/permission.middleware.js';

const router = Router();

// Rutas protegidas por token y permisos, usando '/carreras' como base
router.get(
  '/',
  authMiddleware,
  checkPermission('VER CARRERAS'),
  getAllCarreras
);
router.get(
  '/:id',
  authMiddleware,
  checkPermission('VER CARRERAS'),
  getCarreraById
);
router.post(
  '/',
  authMiddleware,
  checkPermission('CREAR CARRERAS'),
  createCarrera
);
router.put(
  '/:id',
  authMiddleware,
  checkPermission('ACTUALIZAR CARRERAS'),
  updateCarrera
);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('ELIMINAR CARRERAS'),
  deleteCarrera
);

// --- NUEVA RUTA para obtener carreras por escuela ---
router.get(
  '/escuela/:escuelaId',
  authMiddleware,
  checkPermission('VER CARRERAS'),
  getCarrerasByEscuela
);
// --- FIN NUEVA RUTA ---

// --- RUTA existente para la carga masiva de actualización de carreras por plan de estudio ---
router.post(
  '/bulk-update-plans',
  authMiddleware,
  checkPermission('ACTUALIZAR CARRERAS'),
  updateCarrerasFromPlanEstudio
); // Asumo permiso 'editar_carreras'
// --- FIN RUTA existente ---

export default router;
