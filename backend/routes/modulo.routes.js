import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getAllModulos,
  getModuloById,
  createModulo,
  updateModulo,
  deleteModulo,
  getAvailableModules,
} from '../controllers/modulo.controller.js';

const router = Router();

// Rutas para los módulos
router.get('/', authMiddleware, getAllModulos); // Obtener todos los módulos
router.get('/disponibles', authMiddleware, getAvailableModules);
router.post('/', createModulo); // Crear un nuevo módulo
router.get('/:id', getModuloById); // Obtener un módulo por ID
router.put('/:id', updateModulo); // Actualizar un módulo por ID
router.delete('/:id', deleteModulo); // Eliminar un módulo por ID
// Exportar el router
export default router;
