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

const router = Router();

router.get('/summary', getDashboardSummary); // authRequired,
router.get('/charts/examenes-por-carrera', getExamenesPorCarreraChartData);
router.get('/charts/modulos-agendados', getModulosAgendadosChartData);
router.get('/charts/uso-salas', getUsoSalasChartData);
router.get('/charts/examenes-por-dia', getExamenesPorDiaChartData);

export default router;
