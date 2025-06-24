// routes/examen.routes.js
import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
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
import { getAvailableExamsForUser } from '../controllers/examen.controller.js'; // Asegúrate de que este controlador exista

const router = Router();

router.get(
  '/examenes/disponibles',
  authMiddleware,
  checkPermission(['CREATE_RESERVAS_EXAMEN']),
  getAvailableExamsForUser
);

router.get('/para-selector', authMiddleware, getAllExamenesForSelect); // Para el dropdown, usualmente no requiere permiso específico más allá de estar logueado

// Para la lista general de exámenes (usado en la página de gestión de exámenes)
router.get(
  '/',
  authMiddleware,
  checkPermission(['CREATE_RESERVAS_EXAMEN']), // ID_PERMISO: 33
  getAllExamenes
);

router.post(
  '/',
  authMiddleware,
  checkPermission(['CREATE_EXAMENES']), // ID_PERMISO: 46
  createExamen
);

router.get(
  '/:id',
  authMiddleware,
  checkPermission(['VIEW_EXAMENES']), // Usualmente, si puedes ver la lista, puedes ver el detalle. O crea 'VIEW_EXAMEN_DETAIL'.
  getExamenById
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
