import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek } from 'date-fns';
import { useDispatch } from 'react-redux'; // <-- AÑADIR ESTA LÍNEA
import { es } from 'date-fns/locale';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Componentes
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector';
import CalendarGrid from './CalendarGrid';
import FilterModalSalas from './FilterModalSalas';
import ReservaForm from '../reservas/ReservaForm';

// Hooks personalizados
import { useAgendaData } from '../../hooks/useAgendaData';
import { useDateManagement } from '../../hooks/useDateManagement';
import { useFilters } from '../../hooks/useFilters';
import { useModals } from '../../hooks/useModals';

// Servicios
import {
  crearReservaParaExamenExistenteService,
  crearReservaEnCursoService, // ← AGREGAR ESTA IMPORTACIÓN
} from '../../services/reservaService';
import {
  agregarReserva,
  actualizarModulosReservaLocalmente,
} from '../../store/reservasSlice'; // <-- IMPORTAR ACCIÓN DE REDUX

// Estilos
import './styles/AgendaSemanal.css';

export default function AgendaSemanal({
  draggedExamen, // ← Para procesar el drop final
  dropTargetCell, // ← Para procesar el drop final
  hoverTargetCell, // ← NUEVA: Para preview en tiempo real
  onDropProcessed, // Prop que viene de CalendarioPage
  onModulosChange, // <--- ESTA ES LA PROP QUE VIENE DE CalendarioPage.jsx (handleModulosChangeGlobal)
}) {
  // HOOKS PERSONALIZADOS - Toda la lógica compleja separada
  const {
    salas,
    examenes,
    setExamenes,
    modulos,
    reservas,
    // setReservas,
    sedesDisponibles,
    edificiosDisponibles,
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas,
    loadExamenes,
  } = useAgendaData();

  const { fechas, fechaSeleccionada, handleDateChange, goToToday } =
    useDateManagement();

  const {
    searchTermSala,
    setSearchTermSala,
    searchTermExamenes,
    setSearchTermExamenes,
    selectedSede,
    setSelectedSede,
    selectedEdificio,
    setSelectedEdificio,
    filteredSalas,
    filteredExamenes,
  } = useFilters(salas, examenes);

  // ESTADOS LOCALES PRIMERO - Antes de usarlos en otros hooks
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedExamInternal, setSelectedExamInternal] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [lastProcessedDrop, setLastProcessedDrop] = useState(null);

  const dispatch = useDispatch(); // <-- OBTENER DISPATCH

  // HOOK DE MODALES - Después de definir selectedSala
  const {
    showSalaFilterModal,
    setShowSalaFilterModal,
    showReservaModal,
    showDeleteModal,
    reservaModalData,
    setReservaModalData,
    reservaToDelete,
    loadingReservaModal,
    setLoadingReservaModal,
    loadingDelete,
    modalError,
    setModalError,
    modalSuccess,
    setModalSuccess,
    handleShowDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleCloseReservaModal,
    handleShowReservaModal,
  } = useModals(reservas, selectedSala, setExamenes);

  // FUNCIONES SIMPLIFICADAS
  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setSelectedExamInternal(null);
    setModulosSeleccionados([]);
  }, []);

  const eliminarExamen = useCallback(() => {
    setSelectedExamInternal(null);
    setModulosSeleccionados([]);
  }, []);

  const handleSelectModulo = useCallback(
    (fecha, orden) => {
      if (!selectedExamInternal) {
        alert('Primero selecciona un examen.');
        return;
      }

      setModulosSeleccionados((prev) => {
        const yaSeleccionado = prev.some(
          (m) => m.fecha === fecha && m.numero === orden
        );

        if (yaSeleccionado) {
          return prev.filter((m) => !(m.fecha === fecha && m.numero === orden));
        } else {
          return [...prev, { fecha, numero: orden }];
        }
      });
    },
    [selectedExamInternal]
  );

  // Efecto para procesar el drop directamente sin mostrar modal
  useEffect(() => {
    if (!draggedExamen || !dropTargetCell || isProcessingDrop) return;

    const procesarDropDirecto = async () => {
      try {
        setIsProcessingDrop(true);

        // Validar que tenemos un objeto módulo completo
        if (!dropTargetCell.modulo || !dropTargetCell.modulo.ORDEN) {
          console.error(
            'Error: Datos incompletos en el módulo seleccionado',
            dropTargetCell
          );
          toast.error('No se pudo determinar el módulo seleccionado');
          onDropProcessed();
          return;
        }

        // Extraer información de la celda donde se hizo drop
        const { fecha, moduloId, salaId, modulo } = dropTargetCell;

        // Determinar los IDs de los módulos a utilizar
        const modulosIdsParaReserva = determinarModulosParaExamen(
          draggedExamen,
          modulo, // Usar el objeto módulo completo
          modulos
        );

        if (modulosIdsParaReserva.length === 0) {
          toast.error(
            'No se pudieron determinar los módulos para este examen.'
          );
          onDropProcessed();
          return;
        }

        // --- INICIO DE LÓGICA DE DETECCIÓN DE CONFLICTOS ---
        let hayConflicto = false;
        const mensajesConflicto = [];

        for (const moduloIdAUsar of modulosIdsParaReserva) {
          const moduloObj = modulos.find((m) => m.ID_MODULO === moduloIdAUsar);
          if (!moduloObj) {
            mensajesConflicto.push(`Módulo con ID ${moduloIdAUsar} no existe.`);
            hayConflicto = true;
            continue;
          }
          const ordenActual = moduloObj.ORDEN;

          const yaReservado = reservas.some(
            (r) =>
              r.ID_SALA === (salaId || selectedSala.ID_SALA) &&
              format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
              r.MODULOS?.some(
                (mReserva) =>
                  modulos.find(
                    (modGlobal) => modGlobal.ID_MODULO === mReserva.ID_MODULO
                  )?.ORDEN === ordenActual
              )
          );

          if (yaReservado) {
            mensajesConflicto.push(`Módulo ${ordenActual} ya está reservado.`);
            hayConflicto = true;
          }
        }

        if (hayConflicto) {
          toast.error(
            `No se puede crear la reserva:\n${mensajesConflicto.join('\n')}`
          );
          onDropProcessed(); // Limpiar estados de drag
          setIsProcessingDrop(false); // Asegurar que se resetea el estado de procesamiento
          return; // Detener la ejecución aquí
        }
        // --- FIN DE LÓGICA DE DETECCIÓN DE CONFLICTOS ---
        // Preparar payload para la creación de la reserva
        const payload = {
          examen_id_examen: draggedExamen.ID_EXAMEN,
          fecha_reserva: fecha,
          sala_id_sala: salaId || selectedSala.ID_SALA,
          modulos_ids: modulosIdsParaReserva,
          // Por ahora usamos un docente por defecto, luego lo haremos seleccionable
          docente_ids: [1], // ID de docente por defecto, luego lo cambiaremos
        };

        console.log('Creando reserva directamente con payload:', payload);

        // Llamar al servicio para crear la reserva
        const response = await crearReservaEnCursoService(payload);

        toast.success('Examen programado exitosamente');

        // Notificar que el drop se ha procesado (para limpiar estados)
        onDropProcessed();
      } catch (error) {
        console.error('Error al crear reserva directa:', error);
        toast.error(`Error al programar examen: ${error.message}`);
        onDropProcessed();
      } finally {
        setIsProcessingDrop(false);
      }
    };

    procesarDropDirecto();
  }, [draggedExamen, dropTargetCell]);

  // Función auxiliar para determinar los módulos contiguos necesarios
  const determinarModulosParaExamen = (examen, modulo, todosLosModulos) => {
    // Si no tenemos un módulo válido, retornar un array vacío
    if (!modulo || !modulo.ORDEN) {
      console.error(
        'Error en determinarModulosParaExamen: módulo inválido',
        modulo
      );
      return [];
    }

    // Cantidad de módulos requerida por el examen
    const cantidadModulos = examen.CANTIDAD_MODULOS_EXAMEN || 1;

    // Encontrar todos los módulos del mismo día ordenados por ORDEN
    const modulosDelDia = todosLosModulos.sort((a, b) => a.ORDEN - b.ORDEN);

    // Encontrar el índice del módulo inicial
    const indiceModuloInicial = modulosDelDia.findIndex(
      (m) => m.ID_MODULO === modulo.ID_MODULO
    );

    if (indiceModuloInicial === -1) {
      console.error(
        'Error: No se encontró el módulo inicial en la lista de módulos'
      );
      return [];
    }

    // Obtener los módulos consecutivos necesarios
    const modulosSeleccionados = [];
    for (let i = 0; i < cantidadModulos; i++) {
      const indiceActual = indiceModuloInicial + i;
      if (indiceActual < modulosDelDia.length) {
        modulosSeleccionados.push(modulosDelDia[indiceActual].ID_MODULO);
      }
    }

    console.log('Módulos seleccionados:', modulosSeleccionados);
    return modulosSeleccionados;
  };

  // FUNCIONES AUXILIARES
  const puedeConfirmar =
    selectedExamInternal && modulosSeleccionados.length > 0 && selectedSala;

  const handleConfirmReserva = useCallback(async () => {
    if (
      !selectedExamInternal ||
      !modulosSeleccionados.length ||
      !selectedSala
    ) {
      alert('Error: Faltan datos para confirmar la reserva.');
      return;
    }

    const modulosParaAPI = modulosSeleccionados
      .map((mSel) => {
        const modOriginal = modulos.find((mod) => mod.ORDEN === mSel.numero);
        return modOriginal ? modOriginal.ID_MODULO : null;
      })
      .filter((m) => m !== null);

    const payload = {
      FECHA_RESERVA: modulosSeleccionados[0].fecha,
      ID_SALA: selectedSala.ID_SALA,
      ID_EXAMEN: selectedExamInternal.ID_EXAMEN,
      Modulos: modulosParaAPI.map((id) => ({ ID_MODULO: id })),
    };

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la reserva');
      }

      const nuevaReserva = await response.json();
      dispatch(agregarReserva(nuevaReserva)); // <-- USAR DISPATCH
      toast.success(
        // <-- CAMBIO AQUÍ
        `Reserva para ${selectedExamInternal?.NOMBRE_ASIGNATURA} CONFIRMADA!`
      );
      setSelectedExamInternal(null);
      setModulosSeleccionados([]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      toast.error(`Error al confirmar reserva: ${error.message}`); // <-- CAMBIO AQUÍ
    }
  }, [
    selectedExamInternal,
    modulosSeleccionados,
    selectedSala,
    modulos,
    dispatch, // <-- AÑADIR DISPATCH COMO DEPENDENCIA
  ]);

  // Esta es la función que se pasa como prop a CalendarGrid
  // Ahora simplemente llamará a la función onModulosChange recibida de CalendarioPage.jsx
  const handleModulosChangeLocal = useCallback(
    (reservaId, nuevaCantidadModulos) => {
      console.log('📝 [AgendaSemanal] handleModulosChangeLocal llamado con:', {
        reservaId,
        nuevaCantidadModulos,
      });
      // Llamar a la función onModulosChange que viene de CalendarioPage (que es handleModulosChangeGlobal)
      if (onModulosChange) {
        onModulosChange(reservaId, nuevaCantidadModulos);
      } else {
        console.error(
          '[AgendaSemanal] onModulosChange (prop de CalendarioPage) no está definida.'
        );
      }
    },
    [onModulosChange] // Dependencia de la prop de CalendarioPage
  );

  // RENDERIZADO SIMPLIFICADO
  if (
    isLoadingSalas ||
    isLoadingExamenes ||
    isLoadingModulos ||
    isLoadingReservas
  ) {
    return (
      <div className="agenda-semanal-container">
        <div className="loading-container">
          <p>Cargando datos del calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-semanal">
      {/* CONTROLES SUPERIORES */}
      <div className="selectors-row mt-3">
        <div className="selector-container">
          <div className="selector-label">Seleccionar Sala</div>
          <SalaSelector
            salas={salas}
            searchTerm={searchTermSala}
            onSearch={(e) => setSearchTermSala(e.target.value)}
            filteredSalas={filteredSalas}
            selectedSala={selectedSala}
            onSelectSala={handleSelectSala}
            isLoadingSalas={isLoadingSalas}
            onOpenFilterModal={() => setShowSalaFilterModal(true)}
          />
        </div>

        <div className="selector-container">
          <div className="selector-label">Seleccionar Semana</div>
          <div className="input-group">
            <input
              type="date"
              className="form-control"
              value={format(fechaSeleccionada, 'yyyy-MM-dd')}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={goToToday}
              title="Ir a hoy"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content mb-3">
        <div className="examenes-pendientes">
          <div className="examenes-title">
            <h4>Exámenes Pendientes</h4>
            <span className="badge">{filteredExamenes?.length || 0}</span>
          </div>
          <div className="examenes-content">
            <ExamenSelector
              examenes={filteredExamenes}
              isLoadingExamenes={isLoadingExamenes}
              onExamenModulosChange={() => {}} // Implementar si es necesario
              searchTerm={searchTermExamenes}
              setSearchTerm={setSearchTermExamenes}
            />
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-title">
            <h4>Calendario Semanal</h4>
          </div>
          <div className="calendar-content">
            {selectedSala ? (
              <>
                <CalendarGrid
                  fechas={fechas}
                  modulos={modulos}
                  selectedSala={selectedSala}
                  selectedExam={selectedExamInternal}
                  reservas={reservas}
                  modulosSeleccionados={modulosSeleccionados}
                  onSelectModulo={handleSelectModulo} // Esto es para seleccionar módulos al crear, no para +/-
                  onModulosChange={handleModulosChangeLocal} // Pasar la función local que llama a la global
                  onRemoveExamen={eliminarExamen}
                  onDeleteReserva={handleShowDeleteModal}
                  onCheckConflict={() => {}} // ← Ya no se usa aquí, se maneja en el hook
                  draggedExamen={draggedExamen}
                  dropTargetCell={dropTargetCell}
                  hoverTargetCell={hoverTargetCell}
                  // ← AGREGAR ESTAS NUEVAS PROPS
                  // setReservas={setReservas}
                  refreshExamenesDisponibles={() => {
                    // Función para recargar exámenes disponibles
                    loadExamenes();
                  }}
                />
                {puedeConfirmar && (
                  <button
                    onClick={handleConfirmReserva}
                    className="btn btn-primary btn-confirmar-reserva"
                  >
                    Confirmar Reserva para
                    {selectedExamInternal?.NOMBRE_ASIGNATURA}
                  </button>
                )}
              </>
            ) : (
              <p className="aviso-seleccion">
                Selecciona una sala para ver disponibilidad
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODALES */}
      <FilterModalSalas
        isOpen={showSalaFilterModal}
        onClose={() => setShowSalaFilterModal(false)}
        sedesDisponibles={sedesDisponibles}
        selectedSede={selectedSede}
        onSetSelectedSede={setSelectedSede}
        edificiosDisponibles={edificiosDisponibles}
        selectedEdificio={selectedEdificio}
        onSetSelectedEdificio={setSelectedEdificio}
        onAplicarFiltros={() => setShowSalaFilterModal(false)}
      />

      {/* Modal de Eliminación */}
      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar esta reserva?</p>
          {reservaToDelete && (
            <div className="alert alert-warning">
              <strong>Examen:</strong>
              {reservaToDelete.Examen?.NOMBRE_ASIGNATURA || 'Sin nombre'}
              <br />
              <strong>Fecha:</strong>
              {new Date(reservaToDelete.FECHA_RESERVA).toLocaleDateString(
                'es-CL'
              )}
              <br />
              <strong>Módulos:</strong> {reservaToDelete.MODULOS?.length || 0}
            </div>
          )}
          <p className="text-muted">
            <small>
              Esta acción no se puede deshacer. El examen volverá a aparecer en
              la lista de exámenes pendientes.
            </small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCloseDeleteModal}
            disabled={loadingDelete}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={loadingDelete}
          >
            {loadingDelete ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
