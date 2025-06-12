import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { deleteReserva } from '../services/reservaService';

export function useModals(reservas, selectedSala, setReservas, setExamenes) {
  // Estados de modales
  const [showSalaFilterModal, setShowSalaFilterModal] = useState(false);
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados de datos de modales
  const [reservaModalData, setReservaModalData] = useState(null);
  const [reservaToDelete, setReservaToDelete] = useState(null);

  // Estados de carga
  const [loadingReservaModal, setLoadingReservaModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estados de mensajes
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  // Función para mostrar modal de eliminación - CORREGIDA
  const handleShowDeleteModal = useCallback(
    (examenAsignado) => {
      // Buscar la reserva completa sin importar el estado de confirmación
      const reservaCompleta = reservas.find(
        (r) =>
          r.ID_EXAMEN === examenAsignado.examen?.ID_EXAMEN &&
          r.ID_SALA === selectedSala?.ID_SALA &&
          format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') ===
            examenAsignado.fecha
      );

      if (reservaCompleta) {
        // Verificar estados que SÍ permiten eliminación
        const estadosEliminables = [
          'EN_CURSO',
          'PENDIENTE',
          'REQUIERE_REVISION',
          'CONFIRMADO',
        ];

        const estadoActual = reservaCompleta.ESTADO_CONFIRMACION_DOCENTE;

        if (estadosEliminables.includes(estadoActual)) {
          setReservaToDelete(reservaCompleta);
          setShowDeleteModal(true);
        } else if (estadoActual === 'DESCARTADO') {
          alert('Esta reserva ya ha sido descartada y no puede eliminarse.');
        } else {
          alert(`La reserva en estado "${estadoActual}" no puede eliminarse.`);
        }
      } else {
        // Si no encuentra la reserva completa, verificar si es una reserva válida
        if (examenAsignado.examen && examenAsignado.fecha) {
          console.warn('No se encontró la reserva completa:', {
            examenId: examenAsignado.examen.ID_EXAMEN,
            salaId: selectedSala?.ID_SALA,
            fecha: examenAsignado.fecha,
            reservasDisponibles: reservas.map((r) => ({
              id: r.ID_RESERVA,
              examen: r.ID_EXAMEN,
              sala: r.ID_SALA,
              fecha: format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd'),
            })),
          });
        }
        alert('Error: No se pudo encontrar la reserva para eliminar.');
      }
    },
    [reservas, selectedSala]
  );

  // Función para cerrar modal de eliminación
  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setReservaToDelete(null);
  }, []);

  // Función para confirmar eliminación
  const handleConfirmDelete = useCallback(async () => {
    if (!reservaToDelete) return;

    setLoadingDelete(true);
    try {
      await deleteReserva(reservaToDelete.ID_RESERVA);

      // Actualizar lista de reservas
      setReservas((prev) =>
        prev.filter((r) => r.ID_RESERVA !== reservaToDelete.ID_RESERVA)
      );

      // Devolver examen a la lista de pendientes
      if (reservaToDelete.Examen) {
        setExamenes((prev) => {
          const yaExiste = prev.some(
            (e) => e.ID_EXAMEN === reservaToDelete.ID_EXAMEN
          );
          return yaExiste ? prev : [...prev, reservaToDelete.Examen];
        });
      }

      handleCloseDeleteModal();
      alert(
        'Reserva eliminada exitosamente. El examen ha vuelto a la lista de pendientes.'
      );
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      alert(
        `Error al eliminar la reserva: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setLoadingDelete(false);
    }
  }, [reservaToDelete, handleCloseDeleteModal, setReservas, setExamenes]);

  // Función para cerrar modal de reserva
  const handleCloseReservaModal = useCallback(() => {
    setShowReservaModal(false);
    setReservaModalData(null);
    setModalError(null);
    setModalSuccess(null);
  }, []);

  // Función para mostrar modal de reserva
  const handleShowReservaModal = useCallback((data) => {
    setReservaModalData(data);
    setShowReservaModal(true);
    setModalError(null);
    setModalSuccess(null);
  }, []);

  // Función para actualizar datos del modal de reserva
  const updateReservaModalData = useCallback((updates) => {
    setReservaModalData((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    // Estados de modales
    showSalaFilterModal,
    setShowSalaFilterModal,
    showReservaModal,
    setShowReservaModal,
    showDeleteModal,

    // Datos de modales
    reservaModalData,
    setReservaModalData,
    reservaToDelete,

    // Estados de carga
    loadingReservaModal,
    setLoadingReservaModal,
    loadingDelete,

    // Estados de mensajes
    modalError,
    setModalError,
    modalSuccess,
    setModalSuccess,

    // Funciones
    handleShowDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleCloseReservaModal,
    handleShowReservaModal,
    updateReservaModalData,
  };
}
