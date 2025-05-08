import { Router } from 'express';
import multer from 'multer';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
  importUsuarios,
} from '../controllers/moduloUsuarios.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { listRoles } from '../controllers/moduloUsuarios.controller.js';

const upload = multer({ dest: 'tmp/' });
const router = Router();

// Middleware de autenticación
router.use(authMiddleware);
// Rutas para la gestión de usuarios
router.get('/', listUsuarios);
router.get('/roles', listRoles);
router.post('/', createUsuario);
router.put('/:id_usuario', updateUsuario);
router.delete('/:id_usuario', deleteUsuario);
router.post('/import', upload.single('file'), importUsuarios);
router.put('/:id_usuario', resetPassword);

export default router;
