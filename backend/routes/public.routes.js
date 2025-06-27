// backend/routes/public.routes.js
import express from 'express'; // Importar express por defecto
import multer from 'multer'; // Para manejar archivos
const { Router } = express; // Extraer Router del objeto express
import {
  consultarReservasPublico,
  enviarPDFExamenesPorCorreo,
} from '../controllers/public.controller.js';

const router = Router();

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
});

// Usaremos POST para no exponer el RUT/email en la URL
router.post('/consultar-reservas', consultarReservasPublico);

// Nueva ruta para enviar PDF por correo
router.post(
  '/enviar-pdf-examenes',
  upload.single('pdf'),
  enviarPDFExamenesPorCorreo
);

export default router;
