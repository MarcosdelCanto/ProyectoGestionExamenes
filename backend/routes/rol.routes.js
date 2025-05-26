import { Router } from 'express';
import { fetchAllRoles } from '../controllers/rol.controller.js';

const router = Router();

/**
 * GET /api/roles
 * Devuelve la lista de roles disponibles
 */
router.get('/', fetchAllRoles);

export default router;
