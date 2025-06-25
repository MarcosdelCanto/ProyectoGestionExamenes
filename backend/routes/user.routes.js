import express from 'express';
const { Router } = express;
import { authMiddleware } from '../middlewares/auth.middleware.js'; // CAMBIO: Importar authMiddleware
import { checkPermission } from '../middlewares/permission.middleware.js';
import {
  getProfile,
  importUsuarios,
  getUsuarios,
  getDocentes,
  searchDocentes,
  deleteUser, // Importar la función para eliminar un solo usuario
  deleteMultipleUsers, // Importar la nueva función para eliminar múltiples usuarios
} from '../controllers/user.controller.js';

const router = Router();

// GET /api/usuarios/profile
router.get(
  '/profile',
  authMiddleware,
  checkPermission(['VIEW_USUARIOS']),
  getProfile
); // CAMBIO: Usar authMiddleware

// POST /api/usuarios/import
router.post(
  '/import',
  authMiddleware,
  checkPermission(['CREATE_USUARIOS']),
  importUsuarios
); // CAMBIO: Usar authMiddleware

// Ruta para obtener usuarios docentes
// GET /api/usuarios/docentes
router.get(
  '/docentes',
  authMiddleware,
  checkPermission(['VIEW_USUARIOS']),
  getDocentes
); // CAMBIO: Usar authMiddleware

// GET /api/usuarios
router.get(
  '/',
  authMiddleware,
  checkPermission(['VIEW_USUARIOS']),
  getUsuarios
); // CAMBIO: Usar authMiddleware

// NUEVA RUTA PROTEGIDA PARA BÚSQUEDA
router.get(
  '/docentes/search',
  authMiddleware,
  checkPermission(['VIEW_USUARIOS']),
  searchDocentes
); // CAMBIO: Usar authMiddleware

// Ruta para eliminar un SOLO usuario (ya existente)
// DELETE /api/usuarios/:id
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['DELETE_USUARIOS']),
  deleteUser
); // CAMBIO: Usar authMiddleware

// --- NUEVA RUTA para eliminar MÚLTIPLES usuarios ---
// POST /api/usuarios/bulk-delete
router.post(
  '/bulk-delete',
  authMiddleware,
  checkPermission(['DELETE_USUARIOS']),
  deleteMultipleUsers
); // CAMBIO: Usar authMiddleware
// --- FIN NUEVA RUTA ---

export default router;
