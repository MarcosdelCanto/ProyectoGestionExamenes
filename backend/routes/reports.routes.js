import { Router } from 'express';
import {
  getReporteDetalladoExamenes,
  getReporteAlumnosReservas,
} from '../controllers/reports.controller.js'; // Verifica esta ruta

const router = Router();

router.get('/detalle-examenes', getReporteDetalladoExamenes);
router.get('/alumnos-reservas', getReporteAlumnosReservas);

export default router;
