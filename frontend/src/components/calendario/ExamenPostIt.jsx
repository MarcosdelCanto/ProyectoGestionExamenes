import React, { useState, useEffect } from 'react';
import { Badge, Modal, Button, Form, Spinner } from 'react-bootstrap';
import {
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaUserEdit,
} from 'react-icons/fa';
import {
  enviarReservaADocente,
  cancelarReservaCompleta,
} from '../../services/reservaService';
import { toast } from 'react-toastify';
import { searchDocentes } from '../../services/usuarioService';
import { useDispatch } from 'react-redux';
import { actualizarModulosReservaLocalmente } from '../../store/reservasSlice';
import AsyncSelect from 'react-select/async';
import './styles/PostIt.css';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  moduloscount,
  onModulosChange,
  onCheckConflict,
  minModulos = 1,
  maxModulos = 12,
  isPreview = false,
  isDragOverlay = false,
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

  // Estados para selección de docente
  const [selectedDocente, setSelectedDocente] = useState(null); // Almacena el objeto { value, label }
  const [showCancelModal, setShowCancelModal] = useState(false);

  // --- NUEVOS ESTADOS PARA EL MODAL DE DOCENTE ---
  const [showDocenteModal, setShowDocenteModal] = useState(false);
  const [docenteSearchTerm, setDocenteSearchTerm] = useState('');
  const [docenteSearchResults, setDocenteSearchResults] = useState([]);
  const [isSearchingDocentes, setIsSearchingDocentes] = useState(false);
  const [tempSelectedDocente, setTempSelectedDocente] = useState(null);

  const getEstadoConfirmacion = () => {
    return (
      examenAsignadoCompleto?.reservaCompleta?.ESTADO_CONFIRMACION_DOCENTE ||
      examenAsignadoCompleto?.ESTADO_CONFIRMACION_DOCENTE ||
      examen?.ESTADO_CONFIRMACION_DOCENTE ||
      'EN_CURSO'
    );
  };

  const nombreDocenteMostrado =
    selectedDocente?.label || // 1. Prioridad: El docente recién seleccionado en el modal
    examenAsignadoCompleto?.reservaCompleta?.NOMBRE_DOCENTE_ASIGNADO || // 2. El docente de la reserva (viene del socket)
    examenAsignadoCompleto?.NOMBRE_DOCENTE_ASIGNADO || // Fallback por si la estructura cambia
    examen.NOMBRE_DOCENTE || // 3. El docente original sugerido por el examen
    'No asignado'; // 4. Valor por defecto

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

  useEffect(() => {
    const cargarDocenteInicial = async () => {
      if (examen?.NOMBRE_DOCENTE) {
        try {
          const resultadoBusqueda = await searchDocentes(examen.NOMBRE_DOCENTE);
          if (resultadoBusqueda.length > 0) {
            const docenteEncontrado =
              resultadoBusqueda.find(
                (d) => d.NOMBRE_USUARIO === examen.NOMBRE_DOCENTE
              ) || resultadoBusqueda[0];
            setSelectedDocente({
              value: docenteEncontrado.ID_USUARIO,
              label: docenteEncontrado.NOMBRE_USUARIO,
            });
          }
        } catch (error) {
          console.error('Error buscando docente inicial:', error);
        }
      }
    };
    if (!isPreview && !isDragOverlay) {
      cargarDocenteInicial();
    }
  }, [examen, isPreview, isDragOverlay]);

  const handleOpenDocenteModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setTempSelectedDocente(selectedDocente);
    setDocenteSearchResults([]);
    setDocenteSearchTerm('');
    setShowDocenteModal(true);
  };

  const handleDocenteSearch = async (term) => {
    setDocenteSearchTerm(term);
    if (term.length < 2) {
      setDocenteSearchResults([]);
      return;
    }
    setIsSearchingDocentes(true);
    try {
      const results = await searchDocentes(term);
      setDocenteSearchResults(
        results.map((d) => ({ value: d.ID_USUARIO, label: d.NOMBRE_USUARIO }))
      );
    } catch (error) {
      console.error('Error buscando docentes', error);
      setDocenteSearchResults([]);
    } finally {
      setIsSearchingDocentes(false);
    }
  };

  const handleConfirmDocenteSelection = () => {
    setSelectedDocente(tempSelectedDocente);
    setShowDocenteModal(false);
  };

  const handleEnviarADocente = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isProcessingAction) return;

    if (!selectedDocente) {
      toast.error('Por favor, asigne un docente antes de enviar.');
      return;
    }

    setIsProcessingAction(true);
    try {
      const reservaId =
        examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
        examenAsignadoCompleto?.ID_RESERVA;
      if (!reservaId) {
        toast.error('Error: No se puede procesar la reserva sin ID.');
        return;
      }

      await enviarReservaADocente(reservaId, {
        nuevaCantidadModulos: moduloscountState,
        docente_id: selectedDocente.value,
      });

      if (onReservaStateChange) {
        onReservaStateChange(reservaId, 'PENDIENTE', {
          message: 'Reserva enviada a docente para confirmación',
          docenteNombre: selectedDocente.label,
        });
      }
      toast.success(`✅ Reserva enviada a ${selectedDocente.label}`);
    } catch (error) {
      toast.error(`❌ Error al enviar reserva: ${error.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // (Las demás funciones como handleAumentarModulo, handleDisminuirModulo, etc., se mantienen sin cambios)
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
  const getActionButtons = () => {
    if (isPreview || isDragOverlay) return null;
    const estadoConfirmacion = getEstadoConfirmacion();

    switch (estadoConfirmacion) {
      case 'EN_CURSO':
        return (
          <div className="action-buttons">
            {/* -- NUEVO BOTÓN PARA ABRIR EL MODAL DE DOCENTE -- */}
            <button
              className={`btn btn-sm btn-outline-primary action-btn docente-btn ${selectedDocente ? 'docente-asignado' : ''}`}
              onClick={handleOpenDocenteModal}
              disabled={isProcessingAction}
              title={
                selectedDocente
                  ? `Docente: ${selectedDocente.label}`
                  : 'Asignar Docente'
              }
            >
              <FaUserEdit />
            </button>

            <div className="modulos-controls">
              <button
                className="btn btn-sm btn-outline-secondary action-btn"
                onClick={handleDisminuirModulo}
                disabled={isProcessingAction || moduloscountState <= minModulos}
                title="Reducir módulos"
              >
                <FaMinus size={8} />
              </button>
              <span className="modulos-count">{moduloscountState}</span>
              <button
                className="btn btn-sm btn-outline-secondary action-btn"
                onClick={handleAumentarModulo}
                disabled={isProcessingAction || moduloscountState >= maxModulos}
                title="Aumentar módulos"
              >
                <FaPlus size={8} />
              </button>
            </div>

            <button
              className="btn btn-success btn-sm action-btn"
              onClick={handleEnviarADocente}
              disabled={isProcessingAction || !selectedDocente}
              title={
                selectedDocente
                  ? `Enviar a ${selectedDocente.label} para confirmación`
                  : 'Asigna un docente primero'
              }
            >
              {isProcessingAction ? '⏳' : !selectedDocente ? '⚠️' : '✓'}
            </button>

            <button
              className="btn btn-danger btn-sm action-btn"
              onClick={() => setShowCancelModal(true)}
              disabled={isProcessingAction}
              title="Cancelar reserva"
            >
              ✕
            </button>
          </div>
        );
      //... otros cases se mantienen igual
      case 'PENDIENTE':
        return (
          <div className="action-buttons">
            <span
              className="status-indicator pendiente"
              title="Esperando confirmación del docente"
            >
              ⏳ Pendiente
            </span>
          </div>
        );

      case 'CONFIRMADO':
        return (
          <div className="action-buttons">
            <span
              className="status-indicator confirmado"
              title="Confirmado por el docente"
            >
              ✅ Confirmado
            </span>
          </div>
        );

      case 'RECHAZADO':
        return (
          <div className="action-buttons">
            <span
              className="status-indicator rechazado"
              title="Rechazado por el docente"
            >
              ❌ Rechazado
            </span>
          </div>
        );

      default:
        return (
          <div className="action-buttons">
            <span className="status-indicator unknown">
              ❓ Estado desconocido
            </span>
          </div>
        );
    }
  };

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
        data-modulos={moduloscountState}
        {...props}
      >
        <div className="controls-anchor">{getActionButtons()}</div>
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
                {/* Mostrar docente seleccionado o el inicial */}
                <div className="docente-info">
                  Docente:{nombreDocenteMostrado}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL PARA SELECCIONAR DOCENTE --- */}
      <Modal
        show={showDocenteModal}
        onHide={() => setShowDocenteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Asignar Docente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Buscar por nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Comience a escribir para buscar..."
              value={docenteSearchTerm}
              onChange={(e) => handleDocenteSearch(e.target.value)}
              autoFocus
            />
          </Form.Group>
          <div
            className="docente-search-results border rounded p-2"
            style={{
              minHeight: '150px',
              maxHeight: '250px',
              overflowY: 'auto',
            }}
          >
            {isSearchingDocentes ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
              </div>
            ) : docenteSearchResults.length > 0 ? (
              docenteSearchResults.map((docente) => (
                <Form.Check
                  type="radio"
                  key={docente.value}
                  id={`docente-modal-${docente.value}`}
                  label={docente.label}
                  name="docenteSelection"
                  checked={tempSelectedDocente?.value === docente.value}
                  onChange={() => setTempSelectedDocente(docente)}
                  className="p-2"
                />
              ))
            ) : (
              <p className="text-muted text-center m-3">
                {docenteSearchTerm.length < 2
                  ? 'Ingrese al menos 2 caracteres.'
                  : 'No se encontraron docentes.'}
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDocenteModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmDocenteSelection}
            disabled={!tempSelectedDocente}
          >
            Asignar Docente
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Cancelación (se mantiene igual) */}
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
        <Modal.Body>
          <p>
            ¿Estás seguro de que quieres <strong>cancelar esta reserva</strong>?
          </p>
          <ul className="small text-muted mb-0 ps-3">
            <li>Se eliminará la reserva en desarrollo.</li>
            <li>Se liberarán los módulos ocupados.</li>
            <li>El examen volverá a la lista de pendientes.</li>
            <li className="text-danger">Esta acción no se puede deshacer.</li>
          </ul>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowCancelModal(false)}
            disabled={isProcessingAction}
          >
            No, mantener
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmarCancelacion}
            disabled={isProcessingAction}
          >
            {isProcessingAction ? 'Cancelando...' : 'Sí, cancelar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
