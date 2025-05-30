import { Router } from 'express';
import { getReporteDetalladoExamenes } from '../controllers/reports.controller.js'; // Verifica esta ruta

const router = Router();

router.get('/detalle-examenes', getReporteDetalladoExamenes);

export default router;
