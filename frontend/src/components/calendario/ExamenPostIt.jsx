import React, { useState, useRef, useEffect } from 'react';
import { FaArrowsAltV } from 'react-icons/fa';
import { Badge } from 'react-bootstrap';
import {
  enviarReservaADocente,
  cancelarReservaCompleta, // Usar esta en lugar de descartarReservaService
} from '../../services/reservaService';
import { toast } from 'react-toastify'; // <-- AÑADIR IMPORTACIÓN SI NO ESTÁ
import { fetchAllDocentes } from '../../services/usuarioService';
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
  onCheckConflict,
  minModulos = 1,
  maxModulos = 12,
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
  const [moduloscountState, setModuloscountState] = useState(
    moduloscount ||
      examen?.MODULOS?.length ||
      examen?.CANTIDAD_MODULOS_EXAMEN ||
      3
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeError, setResizeError] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);

  // Agregar estado para selección de docente (para implementación futura)
  const [selectedDocenteId, setSelectedDocenteId] = useState(null);
  const [docentes, setDocentes] = useState([]);

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
    if (moduloscount !== undefined && moduloscount !== moduloscountState) {
      setModuloscountState(moduloscount);
    }
  }, [moduloscount, moduloscountState]);

  // Log para depurar la prop examen
  useEffect(() => {
    // Solo loguear para post-its reales en el calendario y no para vistas previas de arrastre
    if (!isPreview && !isDragOverlay && examen) {
      console.log(
        '[ExamenPostIt] Prop examen recibida/actualizada:',
        JSON.parse(JSON.stringify(examen)), // Loguear una copia para ver el estado actual
        'Reserva Asociada (estado confirmación):',
        examenAsignadoCompleto?.reservaCompleta?.ESTADO_CONFIRMACION_DOCENTE
      );
    }
  }, [examen, examenAsignadoCompleto, isPreview, isDragOverlay]);

  // RESIZE: Solo si NO es preview, NO es overlay y NO está siendo arrastrado
  const canResize = !isPreview && !isDragOverlay && !isBeingDragged;

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();

    const deltaY = e.clientY - startResizeRef.current;
    const newHeight = Math.max(40, startHeightRef.current + deltaY);
    const newModulosCount = Math.max(
      minModulos,
      Math.min(maxModulos, Math.round(newHeight / 40))
    );

    if (newModulosCount !== moduloscountState) {
      if (
        onCheckConflict &&
        typeof onCheckConflict === 'function' &&
        fecha &&
        moduloInicial
      ) {
        try {
          const hasConflict = onCheckConflict(
            examen.ID_EXAMEN,
            fecha,
            moduloInicial,
            newModulosCount
          );

          if (hasConflict) {
            setResizeError('Conflicto detectado');
            return;
          } else {
            setResizeError(null);
          }
        } catch (error) {
          console.error('Error verificando conflictos:', error);
          setResizeError('Error al verificar disponibilidad');
          return;
        }
      }

      setModuloscountState(newModulosCount);
      if (onModulosChange) {
        onModulosChange(examen.ID_EXAMEN, newModulosCount);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (!canResize) return;

    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();

    console.log('🎯 Resize start event captured');

    setIsResizing(true);
    startResizeRef.current = e.clientY;
    startHeightRef.current = e.currentTarget.parentElement.offsetHeight;

    document.body.style.pointerEvents = 'none';
    e.currentTarget.style.pointerEvents = 'auto';

    document.addEventListener('mousemove', handleResizeMove, {
      passive: false,
    });
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeEnd = () => {
    console.log('🏁 Resize end');
    setIsResizing(false);
    setResizeError(null);

    document.body.style.pointerEvents = '';

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

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
        toast.error('Error: No se puede procesar la reserva'); // <-- CAMBIO AQUÍ
        return;
      }

      console.log(`[ExamenPostIt] Enviando reserva ${reservaId} a docente`);

      const response = await enviarReservaADocente(reservaId);

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

      toast.success('✅ Reserva enviada a docente para confirmación'); // <-- CAMBIO AQUÍ
    } catch (error) {
      console.error('[ExamenPostIt] Error al enviar reserva a docente:', error);
      toast.error(`❌ Error: ${error.message}`); // <-- CAMBIO AQUÍ
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
        toast.error('Error: No se puede procesar la reserva'); // <-- CAMBIO AQUÍ
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
      toast.error(`❌ Error: ${error.message || 'Error desconocido'}`); // <-- CAMBIO AQUÍ
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
          <div className="action-buttons d-flex gap-1">
            <button
              className="btn btn-success btn-sm action-btn"
              onClick={handleEnviarADocente} // Ya tiene e.stopPropagation
              disabled={isProcessingAction}
              title="Enviar a docente para confirmación"
            >
              {isProcessingAction ? '⏳' : '✓'}
            </button>
            <button
              className="btn btn-danger btn-sm action-btn"
              onClick={handleCancelarReserva} // Ya tiene e.stopPropagation
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
            <button
              className="btn btn-outline-danger btn-sm action-btn"
              onClick={handleCancelarReserva} // Ya tiene e.stopPropagation
              disabled={isProcessingAction}
              title="Cancelar reserva"
            >
              {isProcessingAction ? '⏳' : '✕'}
            </button>
          </div>
        );

      case 'REQUIERE_REVISION':
        return (
          <div className="status-info d-flex align-items-center gap-2">
            <Badge bg="info" className="status-badge">
              📝 Revisión
            </Badge>
            <button
              className="btn btn-outline-danger btn-sm action-btn"
              onClick={handleCancelarReserva} // Ya tiene e.stopPropagation
              disabled={isProcessingAction}
              title="Cancelar reserva"
            >
              {isProcessingAction ? '⏳' : '✕'}
            </button>
          </div>
        );

      case 'CONFIRMADO':
        return (
          <div className="status-info">
            <Badge bg="success" className="status-badge">
              ✅ Confirmado
            </Badge>
          </div>
        );

      case 'DESCARTADO':
        return (
          <div className="status-info">
            <Badge bg="danger" className="status-badge">
              🗑️ Descartado
            </Badge>
          </div>
        );

      default:
        return (
          <button
            className="btn btn-outline-danger btn-sm action-btn"
            onClick={handleCancelarReserva} // Ya tiene e.stopPropagation
            disabled={isProcessingAction}
            title="Eliminar"
          >
            {isProcessingAction ? '⏳' : '✕'}
          </button>
        );
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

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

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
    zIndex: isResizing ? 100 : isPreview ? 1 : 50,
    ...style,
  });

  if (!examen) return null;

  return (
    <div
      ref={setNodeRef}
      style={getStyles()}
      className={`examen-post-it ${isBeingDragged ? 'being-dragged' : ''} ${
        isDragOverlay ? 'drag-overlay is-animating' : '' // Añadir is-animating aquí
      } ${isResizing ? 'resizing' : ''}`}
      data-estado={getEstadoConfirmacion()}
      {...props}
    >
      <div className="examen-content">
        <div className="examen-header d-flex justify-content-between align-items-start">
          <div className="examen-info flex-grow-1">
            <div className="examen-title">
              {examen.NOMBRE_ASIGNATURA || examen.NOMBRE_EXAMEN || 'Sin nombre'}
            </div>
            <div className="examen-details text-muted small">
              {examen.NOMBRE_CARRERA && <div>{examen.NOMBRE_CARRERA}</div>}
              {examen.NOMBRE_SECCION && (
                <div>Sección: {examen.NOMBRE_SECCION}</div>
              )}
            </div>
          </div>

          {/* Botones de acción según el estado */}
          <div className="action-container">{getActionButtons()}</div>
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

        {/* Mensaje de error si hay */}
        {resizeError && (
          <div className="alert alert-danger alert-sm mt-1">
            <small>{resizeError}</small>
          </div>
        )}

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

      {/* Handle de redimensión */}
      {!isPreview && !isDragOverlay && !esReservaConfirmada && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          title="Arrastrar para cambiar duración"
        >
          <FaArrowsAltV />
        </div>
      )}
    </div>
  );
}
