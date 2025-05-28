import { Router } from 'express';
import {
  fetchAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/rol.controller.js'; // Asegúrate de que estos nombres coincidan con tu controlador

const router = Router();

/**
 * GET /api/roles
 * Devuelve la lista de todos los roles disponibles.
 */
router.get('/', fetchAllRoles);

/**
 * GET /api/roles/:id
 * Devuelve un rol específico por su ID.
 */
router.get('/:id', getRoleById);

/**
 * POST /api/roles
 * Crea un nuevo rol.
 */
router.post('/', createRole);

/**
 * PUT /api/roles/:id
 * Actualiza un rol existente por su ID.
 */
router.put('/:id', updateRole);

/**
 * DELETE /api/roles/:id
 * Elimina un rol existente por su ID.
 */
router.delete('/:id', deleteRole);

export default router;
