import React, { useState, useRef, useEffect } from 'react';
import { Badge, Modal, Button } from 'react-bootstrap'; // Agregar Modal y Button
import { FaPlus, FaMinus, FaExclamationTriangle } from 'react-icons/fa'; // Agregar icono de advertencia
import {
  enviarReservaADocente,
  cancelarReservaCompleta,
  updateReserva, // **ASEGURAR QUE ESTE IMPORT EXISTE**
} from '../../services/reservaService';
import { toast } from 'react-toastify'; // <-- AÑADIR IMPORTACIÓN SI NO ESTÁ
import {
  searchDocentes, // ← Mantener solo este para buscar por nombre
} from '../../services/usuarioService';
import { useDispatch, useSelector } from 'react-redux'; // Agregar esta importación
import { actualizarModulosReservaLocalmente } from '../../store/reservasSlice'; // Agregar esta importación
import AsyncSelect from 'react-select/async';
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
  console.log('Datos del examen que llegan al PostIt:', examen);

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
  const [defaultDocenteOptions, setDefaultDocenteOptions] = useState([]); // <-- Estado agregado

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

      // Validar que hay un docente seleccionado
      if (!selectedDocenteId) {
        toast.error(
          'Por favor selecciona un docente antes de enviar la reserva'
        );
        return;
      }

      console.log(
        `[ExamenPostIt] Preparando para enviar reserva ${reservaId} a docente. moduloscountState actual: ${moduloscountState}, docente: ${selectedDocenteId?.label}`
      );

      // **ENVIAR TANTO MÓDULOS COMO DOCENTE**
      const response = await enviarReservaADocente(reservaId, {
        nuevaCantidadModulos: moduloscountState, // ← Módulos actuales
        docente_id: selectedDocenteId.value, // ← ID del docente seleccionado
      });

      console.log('[ExamenPostIt] Reserva enviada exitosamente:', response);

      if (onReservaStateChange) {
        onReservaStateChange(reservaId, 'PENDIENTE', {
          message: 'Reserva enviada a docente para confirmación',
          previousState: 'EN_CURSO',
          docenteId: selectedDocenteId.value,
          docenteNombre: selectedDocenteId.label,
          modulosActualizados: response.modulos_actualizados,
          nuevaCantidadModulos: response.nueva_cantidad_modulos,
        });
      }

      toast.success(
        `✅ Reserva enviada a ${selectedDocenteId.label} para confirmación`
      );
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
          <div className="action-buttons">
            {/* **SELECTOR DE DOCENTE COMPACTO** */}
            {renderDocenteSelector()}

            {/* **CONTROLES DE MÓDULOS** */}
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

            {/* **BOTÓN ENVIAR A DOCENTE** */}
            <button
              className="btn btn-success btn-sm action-btn"
              onClick={handleEnviarADocente}
              disabled={isProcessingAction || !selectedDocenteId}
              title={
                selectedDocenteId
                  ? `Enviar a ${selectedDocenteId.label} para confirmación`
                  : 'Selecciona un docente primero'
              }
            >
              {isProcessingAction ? '⏳' : !selectedDocenteId ? '⚠️' : '✓'}
            </button>

            {/* **BOTÓN CANCELAR** */}
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

  // Función para cargar opciones de docentes - actualizar
  const loadDocenteOptions = (inputValue, callback) => {
    if (!inputValue) {
      callback(defaultDocenteOptions); // ← Usar defaultDocenteOptions cuando no hay input
      return;
    }
    searchDocentes(inputValue)
      .then((data) => {
        callback(
          data.map((d) => ({
            value: d.ID_USUARIO,
            label: d.NOMBRE_USUARIO, // ← Usar NOMBRE_USUARIO (consistente con backend)
            SECCIONES: d.SECCIONES,
          }))
        );
      })
      .catch(() => {
        callback([]);
      });
  };

  // Función para asignar docente a la reserva
  const handleAsignarDocente = async (docenteSeleccionado) => {
    if (!docenteSeleccionado || isProcessingAction) return;

    setIsProcessingAction(true);
    try {
      const reservaId =
        examenAsignadoCompleto?.reservaCompleta?.ID_RESERVA ||
        reservacompleta?.ID_RESERVA;

      if (!reservaId) {
        throw new Error('No se encontró ID de reserva');
      }

      // Usar la misma lógica que ReservaForm para actualizar docente
      const payloadForBackend = {
        docente_ids: [docenteSeleccionado.value],
      };

      // Llamar al servicio de actualización (el mismo que usa ReservaForm)
      await updateReserva(reservaId, payloadForBackend);

      // Actualizar estado local
      setSelectedDocenteId(docenteSeleccionado);

      toast.success(
        `Docente ${docenteSeleccionado.label} asignado exitosamente`
      );

      // Notificar cambio al componente padre si existe
      if (onReservaStateChange) {
        onReservaStateChange(reservaId, 'DOCENTE_ASIGNADO', {
          message: 'Docente asignado exitosamente',
          docenteId: docenteSeleccionado.value,
          docenteNombre: docenteSeleccionado.label,
        });
      }
    } catch (error) {
      console.error('Error al asignar docente:', error);
      toast.error(error.message || 'Error al asignar docente');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Cargar docentes disponibles al montar el componente
  useEffect(() => {
    const cargarDocenteInicial = async () => {
      console.log(`[PostIt DEBUG] Cargando docente inicial:`, {
        examen: examen?.NOMBRE_ASIGNATURA,
        nombreDocente: examen?.NOMBRE_DOCENTE,
        isPreview,
        isDragOverlay,
        examenAsignadoCompleto: !!examenAsignadoCompleto,
      });

      try {
        let docenteInicialSeleccionado = null;

        // **PRIORIDAD 1: Verificar si hay docente asignado en la reserva**
        const docenteAsignado =
          examenAsignadoCompleto?.reservaCompleta?.DOCENTE_ASIGNADO ||
          examenAsignadoCompleto?.DOCENTE_ASIGNADO ||
          null;

        if (docenteAsignado) {
          console.log(
            `[PostIt DEBUG] Docente asignado en reserva:`,
            docenteAsignado
          );

          const docenteFormateado = {
            value: docenteAsignado.ID_USUARIO,
            label: `${docenteAsignado.NOMBRE} ${docenteAsignado.APELLIDO}`,
            tipo: 'asignado',
          };
          setSelectedDocenteId(docenteFormateado);
          setDefaultDocenteOptions([docenteFormateado]); // **AGREGAR ESTA LÍNEA**
          console.log(
            `[PostIt DEBUG] Docente de reserva aplicado:`,
            docenteFormateado
          );
          return;
        }

        // **PRIORIDAD 2: Usar el docente del examen**
        if (examen?.NOMBRE_DOCENTE && !selectedDocenteId) {
          console.log(
            `[PostIt DEBUG] Usando docente del examen:`,
            examen.NOMBRE_DOCENTE
          );

          try {
            const resultadoBusqueda = await searchDocentes(
              examen.NOMBRE_DOCENTE
            );
            console.log(
              `[PostIt DEBUG] Resultado búsqueda docente:`,
              resultadoBusqueda
            );

            if (resultadoBusqueda.length > 0) {
              const docenteEncontrado =
                resultadoBusqueda.find(
                  (d) => d.NOMBRE_USUARIO === examen.NOMBRE_DOCENTE
                ) || resultadoBusqueda[0];

              docenteInicialSeleccionado = {
                value: docenteEncontrado.ID_USUARIO,
                label: docenteEncontrado.NOMBRE_USUARIO,
                SECCIONES: docenteEncontrado.SECCIONES,
                tipo: 'inicial',
              };

              setSelectedDocenteId(docenteInicialSeleccionado);
              setDefaultDocenteOptions([docenteInicialSeleccionado]); // **AGREGAR ESTA LÍNEA**

              console.log(
                `[PostIt DEBUG] Docente inicial del examen asignado:`,
                docenteInicialSeleccionado
              );
            } else {
              console.log(
                `[PostIt DEBUG] No se encontró el docente: ${examen.NOMBRE_DOCENTE}`
              );
              setDefaultDocenteOptions([]); // **AGREGAR ESTA LÍNEA**
            }
          } catch (error) {
            console.error(`[PostIt DEBUG] Error buscando docente:`, error);
            setDefaultDocenteOptions([]); // **AGREGAR ESTA LÍNEA**
          }
        } else {
          setDefaultDocenteOptions([]); // **AGREGAR ESTA LÍNEA**
        }

        console.log(`[PostIt DEBUG] Resultado final:`, {
          selectedDocenteId,
          defaultDocenteOptions,
          tipo: docenteInicialSeleccionado?.tipo || 'ninguno',
        });
      } catch (error) {
        console.error('[PostIt DEBUG] Error al cargar docente inicial:', error);
        setDefaultDocenteOptions([]); // **AGREGAR ESTA LÍNEA**
      }
    };

    if (!isPreview && !isDragOverlay) {
      console.log(`[PostIt DEBUG] Ejecutando carga de docente inicial...`);
      cargarDocenteInicial();
    } else {
      setDefaultDocenteOptions([]); // **AGREGAR ESTA LÍNEA**
    }
  }, [examen, examenAsignadoCompleto, isPreview, isDragOverlay]); // Eliminar dependencia de secciones

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

  // En ExamenPostIt.jsx - Agregar función para renderizar selector compacto
  const renderDocenteSelector = () => {
    if (isPreview || isDragOverlay || getEstadoConfirmacion() !== 'EN_CURSO') {
      return null;
    }

    return (
      <div
        className="docente-selector-control"
        title={
          selectedDocenteId
            ? `Docente: ${selectedDocenteId.label} (${selectedDocenteId.tipo === 'inicial' ? 'Sugerido' : selectedDocenteId.tipo === 'asignado' ? 'Confirmado' : 'Seleccionado'})`
            : examen.NOMBRE_DOCENTE
              ? `Docente del examen: ${examen.NOMBRE_DOCENTE}`
              : 'Seleccionar docente'
        }
      >
        <AsyncSelect
          styles={{
            control: (provided) => ({
              ...provided,
              fontSize: '7px',
              minHeight: '20px',
              height: '20px',
              backgroundColor: selectedDocenteId
                ? selectedDocenteId.tipo === 'asignado'
                  ? '#e8f5e8' // Verde para asignado
                  : '#e3f2fd' // Azul claro para inicial
                : 'white',
              border: '1px solid #ccc',
              borderRadius: '3px',
              boxShadow: 'none',
              '&:hover': {
                borderColor: '#007bff',
              },
            }),
            valueContainer: (provided) => ({
              ...provided,
              height: '20px',
              padding: '0 4px',
              fontSize: '7px',
            }),
            input: (provided) => ({
              ...provided,
              fontSize: '7px',
              height: '20px',
              margin: 0,
            }),
            placeholder: (provided) => ({
              ...provided,
              fontSize: '7px',
              color: '#999',
            }),
            singleValue: (provided) => ({
              ...provided,
              fontSize: '7px',
              color: '#333',
            }),
            indicatorsContainer: (provided) => ({
              ...provided,
              height: '20px',
              padding: 0,
            }),
            clearIndicator: (provided) => ({
              ...provided,
              padding: '2px',
              fontSize: '10px',
            }),
            menu: (provided) => ({
              ...provided,
              fontSize: '8px',
              zIndex: 1000,
            }),
            option: (provided) => ({
              ...provided,
              fontSize: '8px',
              padding: '4px 8px',
            }),
          }}
          cacheOptions
          defaultOptions={defaultDocenteOptions}
          value={selectedDocenteId}
          onChange={handleAsignarDocente}
          loadOptions={loadDocenteOptions}
          placeholder={
            selectedDocenteId
              ? selectedDocenteId.label
              : examen.NOMBRE_DOCENTE
                ? `${examen.NOMBRE_DOCENTE.split(' ')[0]}...` // Mostrar solo primer nombre
                : '👨‍🏫'
          }
          noOptionsMessage={() => 'Sin docentes'}
          isDisabled={isProcessingAction}
          isClearable={false} // No permitir limpiar desde el control compacto
          components={{
            DropdownIndicator: () => null, // Sin flecha
            IndicatorSeparator: () => null,
          }}
        />
      </div>
    );
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
                {examen.NOMBRE_DOCENTE && (
                  <div>Docente: {examen.NOMBRE_DOCENTE}</div>
                )}
              </div>
            </div>
          </div>

          {/* **SECCIÓN EXPANSIVA: Solo para 2+ módulos** */}
          {moduloscountState > 1 && (
            <div className="postit-expandable-section">
              <div className="postit-details">
                {examen.NOMBRE_CARRERA && (
                  <div className="postit-carrera">{examen.NOMBRE_CARRERA}</div>
                )}
                {/* {examen.NOMBRE_SECCION && (
                  <div className="postit-seccion">
                    Sección: {examen.NOMBRE_SECCION}
                  </div>
                )} */}
              </div>
            </div>
          )}

          {/* **INFORMACIÓN COMPACTA PARA 1 MÓDULO** */}
          {moduloscountState === 1 && (
            <div className="postit-compact-details">
              {examen.NOMBRE_CARRERA && (
                <span className="compact-carrera">{examen.NOMBRE_CARRERA}</span>
              )}
              {examen.NOMBRE_SECCION && (
                <span className="compact-seccion">
                  {' '}
                  | {examen.NOMBRE_SECCION}
                </span>
              )}
              {/* **MOSTRAR DOCENTE INICIAL DEL EXAMEN** */}
              {(selectedDocenteId || examen.NOMBRE_DOCENTE) && (
                <span className="docente-info">
                  {' '}
                  | 👨‍🏫 {selectedDocenteId?.label || examen.NOMBRE_DOCENTE}
                  {selectedDocenteId?.tipo === 'inicial' && ' (Sugerido)'}
                  {selectedDocenteId?.tipo === 'asignado' && ' (Confirmado)'}
                </span>
              )}
            </div>
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
