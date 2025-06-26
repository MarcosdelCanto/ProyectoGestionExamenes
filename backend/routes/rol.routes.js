// routes/rol.routes.js
import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  fetchAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/rol.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js'; // Descomenta y usa cuando lo necesites

const router = Router();

// Todas estas rutas deberían estar protegidas al menos por authMiddleware
// y luego por checkPermission con los permisos específicos (ej: 'VER ROLES', 'CREAR ROLES', etc.)

router.get('/', authMiddleware, checkPermission(['VER ROLES']), fetchAllRoles);
router.get('/:id', authMiddleware, checkPermission(['VER ROLES']), getRoleById); // O un permiso 'VIEW_ROL_DETAIL'
router.post('/', authMiddleware, checkPermission(['CREAR ROLES']), createRole);
router.put(
  '/:id',
  authMiddleware,
  checkPermission(['EDITAR ROLES']),
  updateRole
);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['ELIMINAR ROLES']),
  deleteRole
);

export default router;
