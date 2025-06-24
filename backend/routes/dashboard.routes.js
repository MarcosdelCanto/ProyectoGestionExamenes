import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  getDashboardSummary,
  getExamenesPorCarreraChartData,
  getModulosAgendadosChartData,
  getUsoSalasChartData,
  getExamenesPorDiaChartData,
} from '../controllers/dashboard.controller.js';
// Aquí podrías añadir middlewares de autenticación/autorización si son necesarios
// import { authRequired } from '../middlewares/auth.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js'; // <-- 1. Importar middleware de autenticación
import { checkPermission } from '../middlewares/permission.middleware.js'; // <-- 2. Importar middleware de permisos

const router = Router();
router.use(authMiddleware, checkPermission(['VIEW_DASHBOARD']));

router.get('/summary', getDashboardSummary); // authRequired,
router.get('/charts/examenes-por-carrera', getExamenesPorCarreraChartData);
router.get('/charts/modulos-agendados', getModulosAgendadosChartData);
router.get('/charts/uso-salas', getUsoSalasChartData);
router.get('/charts/examenes-por-dia', getExamenesPorDiaChartData);

export default router;
