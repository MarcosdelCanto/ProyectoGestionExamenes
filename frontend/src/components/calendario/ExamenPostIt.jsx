import React, { useState, useEffect } from 'react';
import {
  Badge,
  Modal,
  Button,
  Form,
  Spinner,
  ListGroup,
} from 'react-bootstrap';
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
import './styles/PostIt.css';
import { usePermission } from '../../hooks/usePermission';

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
  examenAsignadoCompleto, // Contiene datos completos de la reserva si es un examen arrastrado a la agenda
  onReservaStateChange,
  ...props
}) {
  const dispatch = useDispatch();
  // console.log( // Descomenta para depurar los datos de la reserva/examen
  //   `[ExamenPostIt] Renderizando Post-it para examen: "${examen?.NOMBRE_ASIGNATURA || 'Desconocido'}"`,
  //   {
  //     "Prop 'examen' (datos base):": examen,
  //     "Prop 'examenAsignadoCompleto' (datos de reserva):": examenAsignadoCompleto,
  //   }
  // );

  const { hasCareerPermission, currentUser: user } = usePermission();
  const [moduloscountState, setModuloscountState] = useState(
    moduloscount ||
      examen?.MODULOS?.length ||
      examen?.CANTIDAD_MODULOS_EXAMEN ||
      3
  );
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [selectedDocente, setSelectedDocente] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    selectedDocente?.label ||
    examenAsignadoCompleto?.reservaCompleta?.NOMBRE_DOCENTE_ASIGNADO ||
    examenAsignadoCompleto?.reservaCompleta?.NOMBRE_DOCENTE_PRINCIPAL ||
    examenAsignadoCompleto?.reservaCompleta?.NOMBRE_DOCENTE ||
    examen.NOMBRE_DOCENTE ||
    'No asignado';

  // Obtener el nombre de la sala si está en la reserva completa
  const nombreSalaMostrada =
    examenAsignadoCompleto?.reservaCompleta?.NOMBRE_SALA ||
    examenAsignadoCompleto?.NOMBRE_SALA; // Por si viene directo en examenAsignadoCompleto sin anidamiento

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
      // Prioridad: docente ya asignado a la reserva (si existe examenAsignadoCompleto)
      if (examenAsignadoCompleto?.reservaCompleta?.NOMBRE_DOCENTE_ASIGNADO) {
        try {
          const nombreDocente =
            examenAsignadoCompleto.reservaCompleta.NOMBRE_DOCENTE_ASIGNADO;
          const resultadoBusqueda = await searchDocentes(nombreDocente);
          if (resultadoBusqueda.length > 0) {
            const docenteEncontrado =
              resultadoBusqueda.find(
                (d) => d.NOMBRE_USUARIO === nombreDocente
              ) || resultadoBusqueda[0];
            setSelectedDocente({
              value: docenteEncontrado.ID_USUARIO,
              label: docenteEncontrado.NOMBRE_USUARIO,
            });
          }
        } catch (error) {
          console.error('Error buscando docente inicial de reserva:', error);
        }
      } else if (examen?.NOMBRE_DOCENTE) {
        // Si no, intentar con el docente original del examen
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
          console.error('Error buscando docente inicial de examen:', error);
        }
      }
    };
    if (!isPreview && !isDragOverlay) {
      cargarDocenteInicial();
    }
  }, [examen, isPreview, isDragOverlay, examenAsignadoCompleto]);

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
        results.map((d) => ({
          value: d.ID_USUARIO,
          label: d.NOMBRE_USUARIO,
          secciones: d.SECCIONES,
        }))
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
      setShowCancelModal(false);

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
    if (user?.nombre_rol !== 'ADMINISTRADOR') {
      const carreraDelExamenId =
        examenAsignadoCompleto?.reservaCompleta?.ID_CARRERA ||
        examenAsignadoCompleto?.ID_CARRERA ||
        examen?.ID_CARRERA;

      const puedeGestionar = hasCareerPermission(carreraDelExamenId);

      if (!puedeGestionar) {
        return null;
      }
    }
    const estadoConfirmacion = getEstadoConfirmacion();

    switch (estadoConfirmacion) {
      case 'EN_CURSO':
        return (
          <div className="action-buttons">
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
      case 'REQUIERE_REVISION':
        return (
          <div className="action-buttons">
            <span
              className="status-indicator requiere-revision"
              title="Requiere revisión por parte del docente"
            >
              🔍 Requiere Revisión
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
    // Si el objeto 'examen' ya contiene las propiedades de color de fondo y borde, las usamos directamente.
    // Esto es posible porque el hook 'useAgendaData' se encarga de enriquecer el objeto 'examen' con estos colores.
    if (examen?.COLOR_BACKGROUND && examen?.COLOR_BORDER) {
      return { bg: examen.COLOR_BACKGROUND, border: examen.COLOR_BORDER };
    }

    // Fallback a un color por defecto o basado en hash si los colores específicos no están presentes.
    const hash = examen?.NOMBRE_ASIGNATURA?.split('').reduce(
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
    // Se añade un color de borde por defecto para el fallback consistente
    return { bg: colors[hash % colors.length] || '#fffacd', border: '#ccc' };
  };

  const getStyles = () => {
    const { bg, border } = getPostItColor();
    return {
      backgroundColor: bg,
      height: isPreview ? '100%' : `${40 * moduloscountState}px`,
      width: isPreview ? '100%' : '100%',
      zIndex: isPreview ? 1 : 50,
      borderLeft: `4px solid ${border}`,
      ...style,
    };
  };

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
              {/* Título principal con ícono de libro */}
              <div className="examen-title fw-bold">
                <i className="bi bi-book me-2"></i>
                {examen.NOMBRE_ASIGNATURA ||
                  examen.NOMBRE_EXAMEN ||
                  'Sin nombre'}
              </div>
              <div className="examen-details align-items-start text-muted small">
                {/* Nombre de carrera (sin ícono, como en ReservaPostIt original) */}
                {examen.NOMBRE_CARRERA && (
                  <div className="d-flex fw-semibold">
                    <i className="bi bi-mortarboard me-1"></i>
                    <span>{examen.NOMBRE_CARRERA}</span>
                  </div>
                )}
                {/* Sección con ícono de diagrama */}
                {examen.NOMBRE_SECCION && (
                  <div className="d-flex">
                    <i className="bi bi-diagram-3 me-1"></i>
                    <span>{examen.NOMBRE_SECCION}</span>
                  </div>
                )}
                {/* Docente con ícono de persona */}
                <div className="docente-info d-flex">
                  <i className="bi bi-person me-1"></i>
                  <span>{nombreDocenteMostrado}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA SELECCIONAR DOCENTE */}
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
          <ListGroup
            className="docente-search-results"
            style={{ height: '250px', overflowY: 'auto' }}
          >
            {isSearchingDocentes ? (
              <ListGroup.Item className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                <div>
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Buscando...</span>
                </div>
              </ListGroup.Item>
            ) : docenteSearchResults.length > 0 ? (
              docenteSearchResults.map((docente) => (
                <ListGroup.Item
                  key={docente.value}
                  action
                  active={tempSelectedDocente?.value === docente.value}
                  onClick={() => setTempSelectedDocente(docente)}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{docente.label}</div>
                    {docente.secciones && (
                      <small className="text-muted">
                        Secciones: {docente.secciones}
                      </small>
                    )}
                  </div>
                  {tempSelectedDocente?.value === docente.value && (
                    <Badge bg="primary" pill>
                      ✓
                    </Badge>
                  )}
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                {docenteSearchTerm.length < 2
                  ? 'Ingresa al menos 2 caracteres para buscar.'
                  : 'No se encontraron docentes.'}
              </ListGroup.Item>
            )}
          </ListGroup>
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

      {/* Modal de Cancelación */}
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
