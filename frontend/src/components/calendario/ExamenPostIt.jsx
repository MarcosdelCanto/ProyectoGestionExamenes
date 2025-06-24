import React, { useState, useRef, useEffect } from 'react';
import { Badge, Modal, Button } from 'react-bootstrap'; // Agregar Modal y Button
import { FaPlus, FaMinus, FaExclamationTriangle } from 'react-icons/fa'; // Agregar icono de advertencia
import {
  enviarReservaADocente,
  cancelarReservaCompleta, // Usar esta en lugar de descartarReservaService
} from '../../services/reservaService';
import { toast } from 'react-toastify'; // <-- AÑADIR IMPORTACIÓN SI NO ESTÁ
import { fetchAllDocentes } from '../../services/usuarioService';
import { useDispatch, useSelector } from 'react-redux'; // Agregar esta importación
import { actualizarModulosReservaLocalmente } from '../../store/reservasSlice'; // Agregar esta importación
import './styles/PostIt.css';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  moduloscount,
  esReservaConfirmada = false,
  onModulosChange,
  onRemove,
  onDeleteReserva,
  onCheckConflict, // Necesario para validar el cambio de módulos
  minModulos = 1, // Límite inferior para módulos
  maxModulos = 12, // Límite superior para módulos
  isPreview = false,
  isDragOverlay = false,
  dragHandleListeners,
  isBeingDragged,
  fecha,
  moduloInicial,
  examenAsignadoCompleto,
  onReservaStateChange,
  ...props
}) {
  const dispatch = useDispatch();
  const [moduloscountState, setModuloscountState] = useState(
    moduloscount ||
      examen?.MODULOS?.length ||
      examen?.CANTIDAD_MODULOS_EXAMEN ||
      3
  );
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Estado para selección de docente
  const [selectedDocenteId, setSelectedDocenteId] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  /**
   * Obtiene el estado de confirmación docente de la reserva
   */
  const getEstadoConfirmacion = () => {
    const estado =
      examenAsignadoCompleto?.reservaCompleta?.ESTADO_CONFIRMACION_DOCENTE ||
      examenAsignadoCompleto?.ESTADO_CONFIRMACION_DOCENTE ||
      examen?.ESTADO_CONFIRMACION_DOCENTE ||
      'EN_CURSO';

    return estado;
  };

  // Sincronizar con prop externa
  useEffect(() => {
    const nuevaCantidad =
      moduloscount ||
      examen?.MODULOS?.length ||
      examen?.CANTIDAD_MODULOS_EXAMEN ||
      examenAsignadoCompleto?.Examen?.CANTIDAD_MODULOS_EXAMEN ||
      examenAsignadoCompleto?.MODULOS?.length ||
      3;

    if (nuevaCantidad !== moduloscountState) {
      setModuloscountState(nuevaCantidad);
    }
  }, [moduloscount, examen, examenAsignadoCompleto]);

  // Log para depurar la prop examen - AGREGAR VERIFICACIÓN DE POSICIÓN
  useEffect(() => {
    if (!isPreview && !isDragOverlay && examenAsignadoCompleto) {
      console.log('[ExamenPostIt] Estado actual del post-it:', {
        ID_RESERVA: examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA,
        fecha: fecha,
        moduloInicial: moduloInicial,
        modulosActuales: moduloscountState,
        modulosEnReserva: examenAsignadoCompleto?.MODULOS?.length || 0,
        ordenesModulos:
          examenAsignadoCompleto?.MODULOS?.map((m) => m.ORDEN).sort(
            (a, b) => a - b
          ) || [],
      });
    }
  }, [
    examen,
    examenAsignadoCompleto,
    isPreview,
    isDragOverlay,
    fecha,
    moduloInicial,
    moduloscountState,
  ]);

  /**
   * Handler para enviar reserva a docente (EN_CURSO → PENDIENTE)
   */
  const handleEnviarADocente = async (e) => {
    // IMPORTANTE: Evitar que se propague el evento
    e.stopPropagation();
    e.preventDefault();

    if (isProcessingAction) return;

    try {
      setIsProcessingAction(true);

      const reservaId =
        examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
        examenAsignadoCompleto?.ID_RESERVA;

      if (!reservaId) {
        console.error('No se encontró ID de reserva');
        toast.error('Error: No se puede procesar la reserva');
        return;
      }

      console.log(
        `[ExamenPostIt] Preparando para enviar reserva ${reservaId} a docente. moduloscountState actual: ${moduloscountState}`
      );

      console.log(`[ExamenPostIt] Enviando reserva ${reservaId} a docente`);

      const response = await enviarReservaADocente(
        reservaId,
        moduloscountState
      ); // Enviar moduloscountState

      console.log('[ExamenPostIt] Reserva enviada exitosamente:', response);

      if (onReservaStateChange) {
        // console.log(
        //   '[ExamenPostIt] Calling onReservaStateChange with PENDIENTE for reservaId:',
        //   reservaId,
        //   '. Typeof onReservaStateChange:',
        //   typeof onReservaStateChange
        // );
        onReservaStateChange(reservaId, 'PENDIENTE', {
          message: 'Reserva enviada a docente para confirmación',
          previousState: 'EN_CURSO',
        });
      }

      toast.success('✅ Reserva enviada a docente para confirmación');
    } catch (error) {
      console.error('[ExamenPostIt] Error al enviar reserva a docente:', error);
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  /**
   * Handler para cancelar reserva completa (cualquier estado → ELIMINADO)
   */
  const handleCancelarReserva = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isProcessingAction) return;

    const confirmacion = window.confirm(
      '¿Estás seguro de que quieres cancelar esta reserva?\n\n' +
        'Esta acción:\n' +
        '• Eliminará la reserva completamente\n' +
        '• Liberará los módulos ocupados\n' +
        '• Volverá el examen al selector\n' +
        '• No se puede deshacer'
    );

    if (!confirmacion) return;

    try {
      setIsProcessingAction(true);

      const reservaId =
        examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
        examenAsignadoCompleto?.ID_RESERVA;

      if (!reservaId) {
        console.error('No se encontró ID de reserva');
        toast.error('Error: No se puede procesar la reserva');
        return;
      }

      console.log(`[ExamenPostIt] Cancelando reserva ${reservaId}`);

      const response = await cancelarReservaCompleta(reservaId); // USAR ESTA FUNCIÓN

      console.log('[ExamenPostIt] Reserva cancelada exitosamente:', response);

      if (onReservaStateChange) {
        onReservaStateChange(reservaId, 'ELIMINADO', {
          message: 'Reserva cancelada y examen reactivado',
          previousState: getEstadoConfirmacion(),
          examen_id: response.examen_id,
        });
      }
      toast.success('Reserva cancelada y examen reactivado'); // <-- AÑADIR TOAST DE ÉXITO
    } catch (error) {
      console.error('[ExamenPostIt] Error al cancelar reserva:', error);
      toast.error(`❌ Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAumentarModulo = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (moduloscountState >= maxModulos) {
      toast.warn(`No se pueden asignar más de ${maxModulos} módulos.`);
      return;
    }

    const reservaId =
      examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
      examenAsignadoCompleto?.ID_RESERVA;

    const nuevaCantidad = moduloscountState + 1;

    // Verificación de conflictos
    if (fecha && moduloInicial && onCheckConflict) {
      try {
        const hasConflict = onCheckConflict({
          examenId: examen.ID_EXAMEN,
          reservaId: reservaId,
          fecha: fecha,
          moduloInicial: moduloInicial,
          cantidadModulos: nuevaCantidad,
        });

        if (hasConflict) {
          toast.error(
            'Conflicto detectado. Ya existe otra reserva en ese horario.'
          );
          return;
        }
      } catch (error) {
        console.error('Error en checkConflict:', error);
        return;
      }
    }

    // Ejecutar el cambio
    if (reservaId) {
      setModuloscountState(nuevaCantidad);

      dispatch(
        actualizarModulosReservaLocalmente({
          id_reserva: reservaId,
          nuevaCantidadModulos: nuevaCantidad,
          moduloInicialActual: moduloInicial,
        })
      );

      if (onModulosChange) {
        onModulosChange(reservaId, nuevaCantidad);
      }

      toast.success(`Módulos aumentados a ${nuevaCantidad}`);
    }
  };

  const handleDisminuirModulo = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (moduloscountState <= minModulos) {
      toast.warn(`La reserva debe tener al menos ${minModulos} módulo.`);
      return;
    }

    const nuevaCantidad = moduloscountState - 1;

    const reservaId =
      examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
      examenAsignadoCompleto?.ID_RESERVA;

    if (reservaId) {
      setModuloscountState(nuevaCantidad);

      dispatch(
        actualizarModulosReservaLocalmente({
          id_reserva: reservaId,
          nuevaCantidadModulos: nuevaCantidad,
          moduloInicialActual: moduloInicial,
        })
      );

      if (onModulosChange) {
        onModulosChange(reservaId, nuevaCantidad);
      }

      toast.success(`Módulos reducidos a ${nuevaCantidad}`);
    } else {
      console.warn(
        '[ExamenPostIt] No se pudo obtener reservaId para disminuir módulos'
      );
    }
  };

  /**
   * Handler para mostrar modal de confirmación
   */
  const handleClickCancelar = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCancelModal(true);
  };

  /**
   * Handler para cancelar reserva después de confirmación
   */
  const handleConfirmarCancelacion = async () => {
    if (isProcessingAction) return;

    try {
      setIsProcessingAction(true);
      setShowCancelModal(false); // Cerrar modal

      const reservaId =
        examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
        examenAsignadoCompleto?.ID_RESERVA;

      if (!reservaId) {
        console.error('No se encontró ID de reserva');
        toast.error('Error: No se puede procesar la reserva');
        return;
      }

      const response = await cancelarReservaCompleta(reservaId);

      if (onReservaStateChange) {
        onReservaStateChange(reservaId, 'ELIMINADO', {
          message: 'Reserva cancelada y examen reactivado',
          previousState: getEstadoConfirmacion(),
          examen_id: response.examen_id,
        });
      }
      toast.success('Reserva cancelada y examen reactivado');
    } catch (error) {
      console.error('[ExamenPostIt] Error al cancelar reserva:', error);
      toast.error(`❌ Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  /**
   * Genera los botones de acción según el estado de confirmación docente
   */
  const getActionButtons = () => {
    if (isPreview || isDragOverlay) return null;

    const estadoConfirmacion = getEstadoConfirmacion();

    switch (estadoConfirmacion) {
      case 'EN_CURSO':
        return (
          <div className="action-buttons d-flex align-items-center gap-1">
            <button
              className="btn btn-outline-secondary btn-sm action-btn"
              onClick={handleDisminuirModulo}
              disabled={isProcessingAction || moduloscountState <= minModulos}
              title="Disminuir módulos"
            >
              <FaMinus />
            </button>
            <span className="mx-1 text-muted" style={{ fontSize: '0.8em' }}>
              {moduloscountState}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm action-btn"
              onClick={handleAumentarModulo}
              disabled={isProcessingAction || moduloscountState >= maxModulos}
              title="Aumentar módulos"
            >
              <FaPlus />
            </button>

            <button
              className="btn btn-success btn-sm action-btn"
              onClick={handleEnviarADocente}
              disabled={isProcessingAction}
              title="Enviar a docente para confirmación"
            >
              {isProcessingAction ? '⏳' : '✓'}
            </button>
            {/* CANCELAR SOLO EN EN_CURSO */}
            <button
              className="btn btn-danger btn-sm action-btn"
              onClick={handleClickCancelar}
              disabled={isProcessingAction}
              title="Cancelar reserva"
            >
              {isProcessingAction ? '⏳' : '✕'}
            </button>
          </div>
        );

      case 'PENDIENTE':
        return (
          <div className="status-info d-flex align-items-center gap-2">
            <Badge bg="warning" text="dark" className="status-badge">
              📋 Pendiente
            </Badge>
            {/* NO HAY BOTÓN DE CANCELAR EN PENDIENTE */}
          </div>
        );

      case 'REQUIERE_REVISION':
        return (
          <div className="status-info d-flex align-items-center gap-2">
            <Badge bg="info" className="status-badge">
              📝 Revisión
            </Badge>
            {/* NO HAY BOTÓN DE CANCELAR EN REQUIERE_REVISION */}
          </div>
        );

      case 'CONFIRMADO':
        return (
          <div className="status-info d-flex align-items-center gap-2">
            <Badge bg="success" className="status-badge">
              ✅ Confirmado
            </Badge>
            {/* NO HAY BOTÓN DE CANCELAR EN CONFIRMADO */}
          </div>
        );

      case 'RECHAZADO':
        return (
          <div className="status-info d-flex align-items-center gap-2">
            <Badge bg="danger" className="status-badge">
              ❌ Rechazado
            </Badge>
            {/* NO HAY BOTÓN DE CANCELAR EN RECHAZADO */}
          </div>
        );

      default:
        // Para estados desconocidos, no mostrar botones
        return null;
    }
  };

  // Cargar docentes disponibles al montar el componente
  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        // Usar la función existente que ya está correctamente implementada
        const docentesData = await fetchAllDocentes();
        setDocentes(docentesData);

        if (docentesData.length > 0) {
          setSelectedDocenteId(docentesData[0].ID_USUARIO);
        }
      } catch (error) {
        console.error('Error al cargar docentes:', error);
      }
    };

    // Solo cargar docentes si este post-it es editable y no es una vista previa
    if (!isPreview && !isDragOverlay && !esReservaConfirmada) {
      cargarDocentes();
    }
  }, [isPreview, isDragOverlay, esReservaConfirmada]);

  // Color y estilos
  const getPostItColor = () => {
    if (!examen) return '#fffacd';
    const hash = examen.NOMBRE_ASIGNATURA?.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    const colors = [
      '#ffcccc',
      '#ffddaa',
      '#ffffcc',
      '#ccffcc',
      '#ccffff',
      '#ccccff',
      '#ffccff',
    ];
    return colors[hash % colors.length] || '#fffacd';
  };

  const getStyles = () => ({
    backgroundColor: getPostItColor(),
    height: isPreview ? '100%' : `${40 * moduloscountState}px`, // Tomar 100% de la altura del padre en preview
    width: isPreview ? '100%' : '100%', // Tomar 100% del ancho del padre en preview
    zIndex: isPreview ? 1 : 50, // zIndex ya no depende de isResizing
    ...style,
  });

  if (!examen) return null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={getStyles()}
        className={`examen-post-it ${isBeingDragged ? 'being-dragged' : ''} ${
          isDragOverlay ? 'drag-overlay is-animating' : ''
        }`}
        data-estado={getEstadoConfirmacion()}
        data-modulos={moduloscountState} // ← AGREGAR ESTA LÍNEA
        {...props}
      >
        {/* **CONTROLES ANCLADOS ARRIBA** */}
        <div className="controls-anchor">{getActionButtons()}</div>

        {/* **CONTENIDO ORIGINAL** */}
        <div className="examen-content">
          <div className="examen-header d-flex justify-content-between align-items-start">
            <div className="examen-info flex-grow-1">
              <div className="examen-title">
                {examen.NOMBRE_ASIGNATURA ||
                  examen.NOMBRE_EXAMEN ||
                  'Sin nombre'}
              </div>
              <div className="examen-details text-muted small">
                {examen.NOMBRE_CARRERA && <div>{examen.NOMBRE_CARRERA}</div>}
                {examen.NOMBRE_SECCION && (
                  <div>Sección: {examen.NOMBRE_SECCION}</div>
                )}
              </div>
            </div>

            {/* **REMOVER LOS CONTROLES DE AQUÍ** */}
            {/* <div className="action-container">{getActionButtons()}</div> */}
          </div>

          {/* Información de módulos */}
          <div className="modulos-info mt-2">
            <small className="text-muted">
              Módulos: {moduloscountState}
              {fecha && moduloInicial && (
                <span>
                  {' '}
                  | {fecha} - Módulo {moduloInicial}
                </span>
              )}
            </small>
          </div>

          {/* Selector de docente (para implementación futura) */}
          {docentes.length > 0 && (
            <select
              value={selectedDocenteId}
              onChange={(e) => setSelectedDocenteId(e.target.value)}
              className="form-select form-select-sm mt-2"
            >
              <option value="">Seleccionar docente</option>
              {docentes.map((docente) => (
                <option key={docente.ID_USUARIO} value={docente.ID_USUARIO}>
                  {docente.NOMBRE} {docente.APELLIDO}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Modal de confirmación - solo se muestra si está EN_CURSO */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center text-danger">
            <FaExclamationTriangle className="me-2" />
            Confirmar Cancelación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div className="mb-3">
            <p className="mb-2">
              ¿Estás seguro de que quieres{' '}
              <strong>cancelar esta reserva</strong>?
            </p>

            {/* Información de la reserva */}
            <div className="alert alert-light border-start border-4 border-warning">
              <div className="fw-semibold text-dark mb-1">
                {examen.NOMBRE_ASIGNATURA || 'Reserva'}
              </div>
              <small className="text-muted">
                {fecha && `📅 ${fecha}`}
                {moduloInicial && ` • 🕒 Módulo ${moduloInicial}`}
                {moduloscountState && ` • 📊 ${moduloscountState} módulos`}
              </small>
            </div>

            {/* Consecuencias */}
            <div className="mb-3">
              <small className="text-muted fw-semibold">Esta acción:</small>
              <ul className="small text-muted mb-0 ps-3">
                <li>Eliminará la reserva en desarrollo</li>
                <li>Liberará los módulos ocupados</li>
                <li>Volverá el examen al selector</li>
                <li className="text-danger">No se puede deshacer</li>
              </ul>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowCancelModal(false)}
            disabled={isProcessingAction}
          >
            No, mantener reserva
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmarCancelacion}
            disabled={isProcessingAction}
          >
            {isProcessingAction ? '⏳ Cancelando...' : 'Sí, cancelar reserva'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
