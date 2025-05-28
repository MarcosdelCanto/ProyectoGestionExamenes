import { Router } from 'express';
import {
  listUsuarioSecciones,
  createUsuarioSeccion,
  deleteUsuarioSeccion,
  getSeccionesByUsuario, // Importar la nueva función del controlador
} from '../controllers/usuarioSeccion.controller.js';

const router = Router();

router.get('/', listUsuarioSecciones);
router.post('/', createUsuarioSeccion);
router.delete('/:usuarioId/:seccionId', deleteUsuarioSeccion);
// Nueva ruta para obtener secciones por usuario
router.get('/usuario/:usuarioId', getSeccionesByUsuario);

export default router;
