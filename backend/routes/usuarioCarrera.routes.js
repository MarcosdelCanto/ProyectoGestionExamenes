import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import {
  listUsuarioCarreras,
  createUsuarioCarrera,
  deleteUsuarioCarrera,
  getCarrerasByUsuario, // Importar la nueva función del controlador
} from '../controllers/usuarioCarrera.controller.js';

const router = Router();

router.get('/', listUsuarioCarreras);
router.post('/', createUsuarioCarrera);
// La ruta para DELETE debe capturar ambos IDs
router.delete('/:usuarioId/:carreraId', deleteUsuarioCarrera);
// Nueva ruta para obtener carreras por usuario
router.get('/usuario/:usuarioId', getCarrerasByUsuario);

export default router;
