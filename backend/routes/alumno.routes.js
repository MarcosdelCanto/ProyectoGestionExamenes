import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js'; // Tu middleware de autenticación
// Importa la función del controlador que crearemos a continuación
import { getMisReservas CONFIRMADOs } from '../controllers/alumno.controller.js'; // O la ruta correcta a tu controlador

const router = Router();

// Ruta para que un alumno obtenga sus reservas de exámenes  CONFIRMADOs
router.get(
  '/mis-reservas- CONFIRMADOs', // o simplemente '/mis-reservas'
  authMiddleware, // Asegura que el usuario esté logueado
  // Aquí podrías añadir un checkPermission si quieres restringir solo a roles de alumno
  getMisReservas CONFIRMADOs
);

export default router;
