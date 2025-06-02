// routes/examen.routes.js
import { Router } from 'express';
import {
  getAllExamenes,
  getExamenById,
  createExamen,
  updateExamen,
  deleteExamen,
  getAllExamenesForSelect,
} from '../controllers/examen.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js';

const router = Router();

router.get('/para-selector', authMiddleware, getAllExamenesForSelect); // Para el dropdown, usualmente no requiere permiso específico más allá de estar logueado

// Para la lista general de exámenes (usado en la página de gestión de exámenes)
router.get(
  '/',
  authMiddleware,
  checkPermission(['VIEW_EXAMENES']), // ID_PERMISO: 33
  getAllExamenes
);

router.get(
  '/:id',
  authMiddleware,
  checkPermission(['VIEW_EXAMENES']), // Usualmente, si puedes ver la lista, puedes ver el detalle. O crea 'VIEW_EXAMEN_DETAIL'.
  getExamenById
);

router.post(
  '/',
  authMiddleware,
  checkPermission(['CREATE_EXAMENES']), // ID_PERMISO: 46
  createExamen
);
router.put(
  '/:id',
  authMiddleware,
  checkPermission(['EDIT_EXAMENES']), // ID_PERMISO: 47
  updateExamen
);
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['DELETE_EXAMENES']), // ID_PERMISO: 48
  deleteExamen
);

export default router;
