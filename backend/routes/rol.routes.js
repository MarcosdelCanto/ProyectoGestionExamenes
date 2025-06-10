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
// y luego por checkPermission con los permisos específicos (ej: 'VIEW_ROLES', 'CREATE_ROLES', etc.)

router.get('/', authMiddleware, checkPermission(['VIEW_ROLES']), fetchAllRoles);
router.get(
  '/:id',
  authMiddleware,
  checkPermission(['VIEW_ROLES']),
  getRoleById
); // O un permiso 'VIEW_ROL_DETAIL'
router.post('/', authMiddleware, checkPermission(['CREATE_ROLES']), createRole);
router.put('/:id', authMiddleware, checkPermission(['EDIT_ROLES']), updateRole);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['DELETE_ROLES']),
  deleteRole
);

export default router;
