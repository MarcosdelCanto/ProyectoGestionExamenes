import express from 'express';
const { Router } = express;
import {
  getAllAyudas,
  getAyudaByClave,
  getAyudaByRuta,
  createAyuda,
  updateAyuda,
  deleteAyuda,
} from '../controllers/ayuda.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js';

const router = Router();

// Cualquier usuario autenticado puede leer ayuda (para mostrar en el sistema)
router.get('/clave/:clave', authMiddleware, getAyudaByClave);
router.get('/ruta', authMiddleware, getAyudaByRuta);

// Solo admins con VER ROLES gestionan el mantenedor
router.get('/', authMiddleware, checkPermission(['VER ROLES']), getAllAyudas);
router.post('/', authMiddleware, checkPermission(['VER ROLES']), createAyuda);
router.put('/:id', authMiddleware, checkPermission(['VER ROLES']), updateAyuda);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['VER ROLES']),
  deleteAyuda
);

export default router;
