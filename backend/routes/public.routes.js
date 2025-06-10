// backend/routes/public.routes.js
import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { consultarReservasPublico } from '../controllers/public.controller.js'; // Crearemos este controlador

const router = Router();

// Usaremos POST para no exponer el RUT/email en la URL
router.post('/consultar-reservas', consultarReservasPublico);

export default router;
