// routes/auth.routes.js
import express from 'express';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

// Ruta de registro (excepcional/administrativa)
// router.post('/register', register);

// Ruta de login (principal)
router.post('/login', login);

export default router;
