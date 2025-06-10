import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
} from '../controllers/moduloUsuarios.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { listRoles } from '../controllers/moduloUsuarios.controller.js';

const router = Router();

// Middleware de autenticación
router.use(authMiddleware);
// Rutas para la gestión de usuarios
router.get('/', listUsuarios);
router.get('/roles', listRoles);
router.post('/', createUsuario);
router.put('/:id_usuario', updateUsuario);
router.delete('/:id_usuario', deleteUsuario);
router.put('/:id_usuario', resetPassword);

export default router;
