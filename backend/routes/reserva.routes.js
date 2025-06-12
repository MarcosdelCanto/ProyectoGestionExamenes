import express from 'express'; // Importar express por defecto
const { Router } = express; // Extraer Router del objeto express
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js';

// Asegúrate de importar TODOS los controladores que usas en este archivo
import {
  crearReservaParaExamenExistente,
  crearReservaEnCurso,
  enviarReservaADocente, // ← Agregar esta importación
  cancelarReservaCompleta, // ← Agregar esta importación
  getMisReservasPendientes,
  actualizarConfirmacionDocente,
  getAllReservas, // Controlador para GET /
  getReservaById, // Controlador para GET /:id
  createReserva, // Tu controlador original para POST /
  updateReserva, // Controlador para PUT /:id
  deleteReserva, // Controlador para DELETE /:id
  getMisAsignacionesDeReservas, // Controlador para GET /mis-asignaciones
  descartarReserva, // Importar el nuevo controlador
} from '../controllers/reserva.controller.js';

const router = Router();

// --- RUTAS PARA LA NUEVA FUNCIONALIDAD DE CREACIÓN Y CONFIRMACIÓN DE DOCENTES ---

// Nueva ruta para "Mis Asignaciones de Reservas" según rol
router.get(
  '/mis-asignaciones', // Un nombre genérico para el endpoint
  authMiddleware,
  // No se necesita un checkPermission específico aquí si la lógica del controlador ya filtra por rol.
  // O podrías tener un permiso genérico como 'VIEW_MIS_RESERVAS_ASIGNADAS'.
  getMisAsignacionesDeReservas
);

router.post(
  '/crear-para-examen-existente',
  authMiddleware,
  checkPermission(['CREATE_RESERVAS_EXAMEN']), // Ej: Permiso para coordinadores
  crearReservaParaExamenExistente
);

router.get(
  '/docente/pendientes',
  authMiddleware,
  checkPermission(['DOCENTE_VIEW_RESERVAS_PENDIENTES']), // Ej: Permiso para docentes
  getMisReservasPendientes
);

router.put(
  '/:idReserva/docente/confirmacion',
  authMiddleware,
  checkPermission(['DOCENTE_VIEW_RESERVAS_PENDIENTES']), // O un permiso más específico como 'ACTUALIZAR_CONFIRMACION_RESERVA'
  actualizarConfirmacionDocente
);

// Nueva ruta para crear reserva en curso (para drag & drop)
router.post(
  '/crear-en-curso',
  authMiddleware,
  checkPermission(['CREATE_RESERVAS_EXAMEN']),
  crearReservaEnCurso
);

// Nueva ruta para enviar reserva a docente (EN_CURSO → PENDIENTE)
router.put(
  '/:idReserva/enviar-a-docente',
  authMiddleware,
  checkPermission(['UPDATE_RESERVAS_EXAMEN']),
  enviarReservaADocente
);

// Nueva ruta para cancelar reserva completa (volver examen a ACTIVO)
router.delete(
  '/:idReserva/cancelar-completa',
  authMiddleware,
  checkPermission(['DELETE_RESERVAS_EXAMEN']),
  cancelarReservaCompleta
);

// --- RUTAS CRUD ESTÁNDAR PARA RESERVAS (EXISTENTES) ---
// Aplicando authMiddleware y checkPermission (con nombres de permisos de ejemplo)

router.get(
  '/',
  authMiddleware,
  checkPermission(['VIEW_ALL_RESERVAS']), // Ej: Permiso para ver todas las reservas
  getAllReservas
);
router.post(
  '/', // Tu ruta original para crear reservas
  authMiddleware,
  checkPermission(['CREATE_RESERVAS_EXAMEN']), // Permiso para el método original de creación
  createReserva
);
router.get(
  '/:id',
  authMiddleware,
  checkPermission(['VIEW_RESERVA_DETAIL']), // Ej: Permiso para ver detalle de una reserva
  getReservaById
);

router.put(
  '/actualizar/:id',
  authMiddleware,
  checkPermission(['UPDATE_RESERVA']), // Ej: Permiso para actualizar cualquier reserva
  updateReserva
);

router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['DELETE_RESERVA']), // Ej: Permiso para eliminar cualquier reserva
  deleteReserva
);
// --- RUTA PARA DESCARTAR RESERVA ---
router.put(
  '/:idReserva/descartar',
  authMiddleware,
  checkPermission(['UPDATE_RESERVA']), // Asumiendo que el mismo permiso de actualizar sirve para descartar
  descartarReserva
);

// --- RUTA PARA DESCARTAR RESERVA ---
router.put(
  '/:idReserva/descartar',
  authMiddleware,
  checkPermission(['UPDATE_RESERVA']), // Asumiendo que el mismo permiso de actualizar sirve para descartar
  descartarReserva
);

export default router;
