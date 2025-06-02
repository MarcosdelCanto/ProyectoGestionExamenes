import { Router } from 'express';
import {
  getAllModulos,
  getModuloById,
  createModulo,
  updateModulo,
  deleteModulo,
} from '../controllers/modulo.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para los módulos
router.get('/', authMiddleware, getAllModulos); // Obtener todos los módulos
router.get('/:id', getModuloById); // Obtener un módulo por ID
router.post('/', createModulo); // Crear un nuevo módulo
router.put('/:id', updateModulo); // Actualizar un módulo por ID
router.delete('/:id', deleteModulo); // Eliminar un módulo por ID

// Exportar el router
export default router;
