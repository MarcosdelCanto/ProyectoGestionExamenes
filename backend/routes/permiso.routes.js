import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  fetchAllPermisos,
  fetchPermisosByRol,
  updatePermisosRol,
} from '../controllers/permiso.controller.js';

const router = Router();

// Obtener todos los permisos
router.get('/', fetchAllPermisos);

// Obtener permisos de un rol específico
router.get('/rol/:idRol', fetchPermisosByRol);

// Actualizar permisos de un rol (sobrescribe todos los permisos del rol)
router.put('/rol/:idRol', updatePermisosRol);

export default router;
