import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek } from 'date-fns';
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

// Estilos
import './styles/AgendaSemanal.css';

export default function AgendaSemanal({
  draggedExamen, // ← Para procesar el drop final
  dropTargetCell, // ← Para procesar el drop final
  hoverTargetCell, // ← NUEVA: Para preview en tiempo real
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
          examenCompleto: draggedExamen, // ← Incluir examen completo con docentes
          moduloInicialOrden: modulo.ORDEN,
          cantidadModulosOriginal: modulosNecesarios,
          // ← AGREGAR información de docentes si está disponible
          docenteIds:
            draggedExamen.DOCENTES_ASIGNADOS?.map((d) => d.ID_USUARIO) ||
            draggedExamen.DOCENTE_IDS ||
            [], // Array vacío si no hay docentes
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

        // Determinar los módulos a utilizar (el módulo de drop y siguientes según requisitos del examen)
        const modulosNecesarios = determinarModulosParaExamen(
          draggedExamen,
          modulo, // Usar el objeto módulo completo
          modulos
        );

        if (modulosNecesarios.length === 0) {
          toast.error('No se pueden determinar los módulos para este examen');
          onDropProcessed();
          return;
        }

        // Preparar payload para la creación de la reserva
        const payload = {
          examen_id_examen: draggedExamen.ID_EXAMEN,
          fecha_reserva: fecha,
          sala_id_sala: salaId || selectedSala.ID_SALA,
          modulos_ids: modulosNecesarios,
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

  // IMPLEMENTAR: Función para manejar cambios de módulos
  const handleModulosChange = useCallback(
    (examenId, nuevaCantidadModulos) => {
      console.log('📝 Cambio de módulos recibido:', {
        examenId,
        nuevaCantidadModulos,
      });

      // Actualizar reservas confirmadas
      const reservaAfectada = reservas.find(
        (r) => r.ID_EXAMEN === examenId || r.Examen?.ID_EXAMEN === examenId
      );

      if (reservaAfectada) {
        console.log('📝 Actualizando reserva:', reservaAfectada.ID_RESERVA);

        setReservas((prevReservas) =>
          prevReservas.map((reserva) => {
            if (reserva.ID_RESERVA === reservaAfectada.ID_RESERVA) {
              const updatedReserva = {
                ...reserva,
                CANTIDAD_MODULOS_RESERVA: nuevaCantidadModulos,
              };

              // Si tiene examen asociado, actualizarlo también
              if (reserva.Examen) {
                updatedReserva.Examen = {
                  ...reserva.Examen,
                  CANTIDAD_MODULOS_EXAMEN: nuevaCantidadModulos,
                };
              }

              console.log('✅ Reserva actualizada:', updatedReserva);
              return updatedReserva;
            }
            return reserva;
          })
        );

        // TODO: Aquí deberías hacer una llamada al backend para persistir el cambio
        // updateReservaModulos(reservaAfectada.ID_RESERVA, nuevaCantidadModulos);
      }

      // Actualizar exámenes pendientes si es necesario
      if (selectedExamInternal?.ID_EXAMEN === examenId) {
        console.log('📝 Actualizando examen pendiente seleccionado');
        // Lógica para exámenes pendientes...
      }
    },
    [reservas, setReservas, selectedExamInternal]
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
                  onSelectModulo={handleSelectModulo}
                  onModulosChange={handleModulosChange}
                  onRemoveExamen={eliminarExamen}
                  onDeleteReserva={handleShowDeleteModal}
                  onCheckConflict={() => {}} // ← Ya no se usa aquí, se maneja en el hook
                  draggedExamen={draggedExamen}
                  dropTargetCell={dropTargetCell}
                  hoverTargetCell={hoverTargetCell}
                  // ← AGREGAR ESTAS NUEVAS PROPS
                  setReservas={setReservas}
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
