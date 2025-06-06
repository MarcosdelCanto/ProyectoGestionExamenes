import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from 'react-bootstrap';

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
import { crearReservaParaExamenExistenteService } from '../../services/reservaService';

// Estilos
import './styles/AgendaSemanal.css';

export default function AgendaSemanal({
  draggedExamen,
  dropTargetCell,
  onDropProcessed,
}) {
  // HOOKS PERSONALIZADOS - Toda la lógica compleja separada
  const {
    salas,
    examenes,
    setExamenes,
    modulos,
    reservas,
    setReservas,
    sedesDisponibles,
    edificiosDisponibles,
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas,
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
  } = useModals(reservas, selectedSala, setReservas, setExamenes);

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

  // LÓGICA DE DRAG & DROP SIMPLIFICADA
  useEffect(() => {
    if (!draggedExamen || !dropTargetCell || !selectedSala) return;

    const dropId = `${draggedExamen.ID_EXAMEN}-${dropTargetCell.fecha}-${dropTargetCell.modulo.ORDEN}`;
    if (isProcessingDrop || lastProcessedDrop === dropId) return;

    const procesarDrop = async () => {
      setIsProcessingDrop(true);
      setLastProcessedDrop(dropId);

      try {
        const { fecha, modulo } = dropTargetCell;
        const modulosNecesarios = draggedExamen.CANTIDAD_MODULOS_EXAMEN;

        if (!modulosNecesarios || modulosNecesarios <= 0) {
          alert('Error: El examen no tiene una cantidad válida de módulos.');
          return;
        }

        // Verificar conflictos básicos
        let hayConflicto = false;
        const conflictos = [];

        for (let i = 0; i < modulosNecesarios; i++) {
          const ordenActual = modulo.ORDEN + i;
          const moduloExiste = modulos.some((m) => m.ORDEN === ordenActual);

          if (!moduloExiste) {
            conflictos.push(`Módulo ${ordenActual} no existe`);
            hayConflicto = true;
            continue;
          }

          // Verificar si ya está reservado
          const yaReservado = reservas.some(
            (r) =>
              r.ID_SALA === selectedSala.ID_SALA &&
              format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
              r.MODULOS?.some(
                (m) =>
                  modulos.find((mod) => mod.ID_MODULO === m.ID_MODULO)
                    ?.ORDEN === ordenActual
              )
          );

          if (yaReservado) {
            conflictos.push(`Módulo ${ordenActual} ya está reservado`);
            hayConflicto = true;
          }
        }

        if (hayConflicto) {
          alert(`No se puede crear la reserva:\n${conflictos.join('\n')}`);
          return;
        }

        // Preparar datos del modal
        const modulosParaReserva = [];
        for (let i = 0; i < modulosNecesarios; i++) {
          const ordenActual = modulo.ORDEN + i;
          const moduloObj = modulos.find((m) => m.ORDEN === ordenActual);
          if (moduloObj) {
            modulosParaReserva.push(moduloObj.ID_MODULO);
          }
        }

        const modalData = {
          examenId: draggedExamen.ID_EXAMEN,
          fechaReserva: fecha,
          salaId: selectedSala.ID_SALA,
          modulosIds: modulosParaReserva,
          examenNombre:
            draggedExamen.NOMBRE_ASIGNATURA || draggedExamen.NOMBRE_EXAMEN,
          salaNombre: selectedSala.NOMBRE_SALA,
          modulosTexto: `Módulos ${modulo.ORDEN} - ${
            modulo.ORDEN + modulosNecesarios - 1
          }`,
          examenCompleto: draggedExamen,
          moduloInicialOrden: modulo.ORDEN,
          cantidadModulosOriginal: modulosNecesarios,
        };

        handleShowReservaModal(modalData);
      } catch (error) {
        console.error('Error procesando drop:', error);
        alert('Error al procesar el examen. Inténtalo de nuevo.');
      } finally {
        setIsProcessingDrop(false);
        if (onDropProcessed) onDropProcessed();
      }
    };

    procesarDrop();
  }, [
    draggedExamen?.ID_EXAMEN,
    dropTargetCell?.fecha,
    dropTargetCell?.modulo?.ORDEN,
    selectedSala?.ID_SALA,
    isProcessingDrop,
    lastProcessedDrop,
    modulos,
    reservas,
    onDropProcessed,
    handleShowReservaModal,
  ]);

  // FUNCIÓN PARA CREAR RESERVA
  const handleCreateReserva = async (formDataPayload) => {
    setLoadingReservaModal(true);
    setModalError(null);
    setModalSuccess(null);

    const payloadFinal = {
      ...formDataPayload,
      modulos:
        reservaModalData.modulosIds && reservaModalData.modulosIds.length > 0
          ? reservaModalData.modulosIds
          : formDataPayload.modulos,
    };

    try {
      const response =
        await crearReservaParaExamenExistenteService(payloadFinal);

      if (reservaModalData) {
        // Remover de exámenes pendientes
        setExamenes((prev) =>
          prev.filter(
            (examen) => examen.ID_EXAMEN !== reservaModalData.examenId
          )
        );

        // Crear nueva reserva
        const nuevaReserva = {
          ID_RESERVA: response.data?.ID_RESERVA || Date.now(),
          ID_SALA: reservaModalData.salaId,
          FECHA_RESERVA: reservaModalData.fechaReserva,
          ID_EXAMEN: reservaModalData.examenId,
          MODULOS: payloadFinal.modulos.map((moduloId) => {
            const moduloInfo = modulos.find((m) => m.ID_MODULO === moduloId);
            return {
              ID_MODULO: moduloId,
              NOMBRE_MODULO:
                moduloInfo?.NOMBRE_MODULO ||
                `Modulo ${moduloInfo?.ORDEN || ''}`,
            };
          }),
          Examen: {
            ID_EXAMEN: reservaModalData.examenId,
            NOMBRE_ASIGNATURA: reservaModalData.examenNombre,
            CANTIDAD_MODULOS_EXAMEN: payloadFinal.modulos.length,
          },
        };

        setReservas((prev) => [...prev, nuevaReserva]);
      }

      setModalSuccess(
        response.message || 'Reserva creada exitosamente y programada.'
      );
      setTimeout(() => handleCloseReservaModal(), 2000);
    } catch (err) {
      setModalError(err.details || err.error || 'Error al crear la reserva.');
    } finally {
      setLoadingReservaModal(false);
    }
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
      setReservas((prev) => [...prev, nuevaReserva]);
      alert(
        `Reserva para ${selectedExamInternal?.NOMBRE_ASIGNATURA} CONFIRMADA!`
      );
      setSelectedExamInternal(null);
      setModulosSeleccionados([]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      alert(`Error al confirmar reserva: ${error.message}`);
    }
  }, [
    selectedExamInternal,
    modulosSeleccionados,
    selectedSala,
    modulos,
    setReservas,
  ]);

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
    <div className="agenda-semanal-container">
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
                  onSelectModulo={handleSelectModulo}
                  onModulosChange={() => {}} // Implementar si es necesario
                  onRemoveExamen={eliminarExamen}
                  onDeleteReserva={handleShowDeleteModal}
                  onCheckConflict={() => {}} // Implementar si es necesario
                  draggedExamen={draggedExamen}
                  dropTargetCell={dropTargetCell}
                />
                {puedeConfirmar && (
                  <button
                    onClick={handleConfirmReserva}
                    className="btn btn-primary btn-confirmar-reserva"
                  >
                    Confirmar Reserva para{' '}
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

      {/* Modal de Reserva */}
      {reservaModalData && (
        <Modal
          show={showReservaModal}
          onHide={handleCloseReservaModal}
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Crear Reserva de Examen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 p-3 bg-light rounded">
              <h6>Resumen del examen a programar:</h6>
              <p className="mb-1">
                <strong>Examen:</strong> {reservaModalData.examenNombre}
              </p>
              <p className="mb-1">
                <strong>Sala:</strong> {reservaModalData.salaNombre}
              </p>
              <p className="mb-1">
                <strong>Fecha:</strong>{' '}
                {new Date(reservaModalData.fechaReserva).toLocaleDateString(
                  'es-CL'
                )}
              </p>
              <p className="mb-0">
                <strong>Horario:</strong> {reservaModalData.modulosTexto}
              </p>
            </div>

            {modalSuccess && (
              <div className="alert alert-success" role="alert">
                {modalSuccess}
              </div>
            )}
            {modalError && (
              <div className="alert alert-danger" role="alert">
                {modalError}
              </div>
            )}

            <ReservaForm
              initialData={{
                ID_EXAMEN: reservaModalData.examenId,
                FECHA_RESERVA: reservaModalData.fechaReserva,
                ID_SALA: reservaModalData.salaId,
                MODULOS_IDS: reservaModalData.modulosIds,
                EXAMEN_COMPLETO: reservaModalData.examenCompleto,
                CANTIDAD_MODULOS_EXAMEN:
                  reservaModalData.cantidadModulosOriginal,
                MODULO_INICIAL_ORDEN: reservaModalData.moduloInicialOrden,
              }}
              onModulosChange={(nuevaCantidad, nuevosModulosIds) => {
                setReservaModalData((prev) => ({
                  ...prev,
                  modulosIds: nuevosModulosIds,
                  cantidadModulosOriginal: nuevaCantidad,
                  modulosTexto: `Módulos ${prev.moduloInicialOrden} - ${prev.moduloInicialOrden + nuevaCantidad - 1}`,
                }));
              }}
              modulosDisponibles={modulos}
              onSubmit={handleCreateReserva}
              onCancel={handleCloseReservaModal}
              isLoadingExternamente={loadingReservaModal}
              submitButtonText="Crear Reserva"
              isEditMode={true}
            />
          </Modal.Body>
        </Modal>
      )}

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
              <strong>Examen:</strong>{' '}
              {reservaToDelete.Examen?.NOMBRE_ASIGNATURA || 'Sin nombre'}
              <br />
              <strong>Fecha:</strong>{' '}
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
