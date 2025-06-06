import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from 'react-bootstrap';
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector';
import CalendarGrid from './CalendarGrid';
import FilterModalSalas from './FilterModalSalas';
import ReservaForm from '../reservas/ReservaForm';
import {
  crearReservaParaExamenExistenteService,
  fetchAllReservas,
  fetchReservaById,
  deleteReserva, // ← AGREGAR ESTA LÍNEA
} from '../../services/reservaService';
import './styles/AgendaSemanal.css';

export default function AgendaSemanal({
  draggedExamen,
  dropTargetCell,
  onDropProcessed,
}) {
  // Estados
  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [searchTermSala, setSearchTermSala] = useState('');
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [showSalaFilterModal, setShowSalaFilterModal] = useState(false);
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState('');
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [selectedExamInternal, setSelectedExamInternal] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaBase, setFechaBase] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [examenesAsignados, setExamenesAsignados] = useState([]);
  const [examenesConModulosModificados, setExamenesConModulosModificados] =
    useState({});
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [lastProcessedDrop, setLastProcessedDrop] = useState(null);
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [reservaModalData, setReservaModalData] = useState(null);
  const [loadingReservaModal, setLoadingReservaModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Carga de datos inicial
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingSalas(true);
      setIsLoadingExamenes(true);
      setIsLoadingModulos(true);
      setIsLoadingReservas(true);

      try {
        const [salasRes, examenesRes, modulosRes, sedesRes, edificiosRes] =
          await Promise.all([
            fetch('/api/salas'),
            fetch('/api/examenes'),
            fetch('/api/modulos'),
            fetch('/api/sede'),
            fetch('/api/edificio'),
          ]);

        if (!salasRes.ok) throw new Error('Error cargando salas');
        setSalas(await salasRes.json());

        if (!examenesRes.ok) throw new Error('Error cargando exámenes');
        const todosLosExamenes = await examenesRes.json();
        setTodosLosExamenesOriginal(todosLosExamenes);

        if (!modulosRes.ok) throw new Error('Error cargando módulos');
        const modulosData = await modulosRes.json();
        setModulos(modulosData);

        if (!sedesRes.ok) throw new Error('Error cargando sedes');
        setSedesDisponibles(await sedesRes.json());

        if (!edificiosRes.ok) throw new Error('Error cargando edificios');
        setEdificiosDisponibles(await edificiosRes.json());

        // Cargar reservas
        try {
          const reservasData = await fetchAllReservas();
          const reservasCompletas = await Promise.all(
            reservasData.map(async (reserva) => {
              try {
                const reservacompleta = await fetchReservaById(
                  reserva.ID_RESERVA
                );
                return reservacompleta;
              } catch (error) {
                return reserva;
              }
            })
          );

          const reservasConExamenes = reservasCompletas.map((reserva) => {
            if (!reserva.Examen && reserva.ID_EXAMEN) {
              const examenCompleto = todosLosExamenes.find(
                (e) => e.ID_EXAMEN === reserva.ID_EXAMEN
              );
              return {
                ...reserva,
                Examen: examenCompleto,
              };
            }
            return reserva;
          });

          setReservas(reservasConExamenes);

          const examenesConReserva = reservasConExamenes.map(
            (r) => r.ID_EXAMEN
          );
          const examenesSinReserva = todosLosExamenes.filter(
            (examen) => !examenesConReserva.includes(examen.ID_EXAMEN)
          );

          setExamenes(examenesSinReserva);
        } catch (reservasError) {
          setReservas([]);
          setExamenes(todosLosExamenes);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        setIsLoadingSalas(false);
        setIsLoadingExamenes(false);
        setIsLoadingModulos(false);
        setIsLoadingReservas(false);
      }
    }

    loadInitialData();
  }, []);

  // Funciones de utilidad
  const getWeekDates = (currentDate, selectedDate) => {
    if (!isValid(new Date(currentDate))) {
      currentDate = new Date();
    }
    // Obtener el lunes de la semana
    const start = startOfWeek(new Date(currentDate), {
      weekStartsOn: 1,
      locale: es,
    });
    // convertir la fecha seleccionada a formato de comparacion
    const selectedDateStr = selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : null;

    // Generar 7 días a partir del lunes
    return eachDayOfInterval({
      start,
      end: addDays(start, 6), // 5 días después del lunes = sábado
    })
      .map((date) => {
        const fechaStr = format(date, 'yyyy-MM-dd');
        return {
          fecha: fechaStr,
          diaNumero: format(date, 'd'),
          diaNombre: format(date, 'EEEE', { locale: es }),
          esHoy: fechaStr === format(new Date(), 'yyyy-MM-dd'),
          esSeleccionado: fechaStr === selectedDateStr,
        };
      })
      .filter((fecha) => fecha.diaNombre.toLowerCase() !== 'domingo');
  };

  const fechas = useMemo(
    () => getWeekDates(fechaBase, fechaSeleccionada),
    [fechaBase, fechaSeleccionada]
  );

  // Filtros
  const filteredSalas = useMemo(() => {
    let tempSalas = salas;
    if (selectedSede) {
      tempSalas = tempSalas.filter((s) => s.ID_SEDE === parseInt(selectedSede));
    }
    if (selectedEdificio) {
      tempSalas = tempSalas.filter(
        (s) => s.ID_EDIFICIO === parseInt(selectedEdificio)
      );
    }
    if (searchTermSala) {
      const term = searchTermSala.toLowerCase();
      tempSalas = tempSalas.filter(
        (s) =>
          (s.COD_SALA?.toLowerCase() ?? '').includes(term) ||
          (s.NOMBRE_SALA?.toLowerCase() ?? '').includes(term) ||
          (s.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term)
      );
    }
    return tempSalas;
  }, [salas, searchTermSala, selectedSede, selectedEdificio]);

  const filteredExamenes = useMemo(() => {
    if (!examenes) return [];
    return examenes.filter((examen) => {
      const matchesSearchTerm =
        !searchTermExamenes ||
        examen.NOMBRE_ASIGNATURA?.toLowerCase().includes(
          searchTermExamenes.toLowerCase()
        ) ||
        examen.NOMBRE_SECCION?.toLowerCase().includes(
          searchTermExamenes.toLowerCase()
        );
      return matchesSearchTerm;
    });
  }, [examenes, searchTermExamenes]);

  // Handlers
  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setSelectedExamInternal(null);
    setModulosSeleccionados([]);
  }, []);

  const agregarExamenATabla = useCallback(
    (examen, fecha, moduloOrden, cantidadModulos) => {
      setExamenesAsignados((prev) => [
        ...prev,
        {
          id: `${examen.ID_EXAMEN}-${fecha}-${moduloOrden}`,
          examen,
          fecha,
          moduloInicial: moduloOrden,
          moduloscount: cantidadModulos,
        },
      ]);
    },
    []
  );

  const actualizarModulosExamen = useCallback((examenId, nuevosCant) => {
    setExamenesAsignados((prev) =>
      prev.map((asignado) =>
        asignado.examen.ID_EXAMEN === examenId
          ? { ...asignado, moduloscount: nuevosCant }
          : asignado
      )
    );
  }, []);

  const eliminarExamen = useCallback(
    (examenId) => {
      setExamenesAsignados((prev) => {
        const examenesActualizados = prev.filter(
          (asignado) => asignado.examen.ID_EXAMEN !== examenId
        );
        return examenesActualizados;
      });
      if (selectedExamInternal && selectedExamInternal.ID_EXAMEN === examenId) {
        setSelectedExamInternal(null);
        setModulosSeleccionados([]);
      }
      setExamenesConModulosModificados((prev) => {
        const { [examenId]: _, ...rest } = prev;
        return rest;
      });
    },
    [selectedExamInternal]
  );

  const obtenerExamenParaCelda = useCallback(
    (fecha, moduloOrden) => {
      // Primero verificar reservas confirmadas
      for (const reserva of reservas) {
        if (
          reserva.ID_SALA === selectedSala?.ID_SALA &&
          format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd') === fecha
        ) {
          const modulosReserva = reserva.MODULOS || reserva.Modulos || [];

          // Verificar si este módulo es parte de la reserva
          const perteneceAReserva = modulosReserva.some((m) => {
            const orden = m.ID_MODULO
              ? modulos.find((mod) => mod.ID_MODULO === m.ID_MODULO)?.ORDEN
              : m.ORDEN;
            return orden === moduloOrden;
          });

          if (perteneceAReserva) {
            // Calcular el módulo inicial correctamente
            const moduloInicial = Math.min(
              ...modulosReserva
                .map((m) => {
                  const orden = m.ID_MODULO
                    ? modulos.find((mod) => mod.ID_MODULO === m.ID_MODULO)
                        ?.ORDEN
                    : m.ORDEN;
                  return orden;
                })
                .filter((orden) => orden !== undefined)
            );

            const cantidadModulos = modulosReserva.length;

            return {
              examen: reserva.Examen,
              moduloscount: cantidadModulos,
              esReservaConfirmada: true,
              fecha,
              moduloInicial: moduloInicial,
            };
          }
        }
      }

      // Luego verificar exámenes temporales
      if (selectedExamInternal && modulosSeleccionados.length > 0) {
        const perteneceASeleccion = modulosSeleccionados.some(
          (m) => m.fecha === fecha && m.numero === moduloOrden
        );

        if (perteneceASeleccion) {
          const moduloInicialTemporal = Math.min(
            ...modulosSeleccionados.map((m) => m.numero)
          );

          return {
            examen: selectedExamInternal,
            moduloscount: modulosSeleccionados.length,
            esReservaConfirmada: false,
            fecha,
            moduloInicial: moduloInicialTemporal,
          };
        }
      }

      return null;
    },
    [
      reservas,
      selectedSala,
      selectedExamInternal,
      modulosSeleccionados,
      modulos,
    ]
  );

  // Procesamiento de drag and drop
  useEffect(() => {
    if (!draggedExamen || !dropTargetCell || !selectedSala) {
      return;
    }

    const dropId = `${draggedExamen.ID_EXAMEN}-${dropTargetCell.fecha}-${dropTargetCell.modulo.ORDEN}`;

    if (isProcessingDrop || lastProcessedDrop === dropId) {
      return;
    }

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

          const hayExamenAsignado = obtenerExamenParaCelda(fecha, ordenActual);
          if (hayExamenAsignado) {
            conflictos.push(
              `Módulo ${ordenActual} ya tiene un examen asignado`
            );
            hayConflicto = true;
            continue;
          }

          const estaReservado = reservas.some(
            (r) =>
              r.ID_SALA === selectedSala.ID_SALA &&
              format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
              r.Modulos?.some((m) => {
                const moduloReservado = modulos.find(
                  (mod) => mod.ID_MODULO === m.ID_MODULO
                );
                return moduloReservado && moduloReservado.ORDEN === ordenActual;
              })
          );

          if (estaReservado) {
            conflictos.push(`Módulo ${ordenActual} ya está reservado`);
            hayConflicto = true;
          }
        }

        if (!hayConflicto) {
          const modulosParaReserva = [];
          for (let i = 0; i < modulosNecesarios; i++) {
            const ordenActual = modulo.ORDEN + i;
            const moduloObj = modulos.find((m) => m.ORDEN === ordenActual);
            if (moduloObj) {
              modulosParaReserva.push(moduloObj.ID_MODULO);
            }
          }

          setReservaModalData({
            examenId: draggedExamen.ID_EXAMEN,
            fechaReserva: fecha,
            salaId: selectedSala.ID_SALA,
            modulosIds: modulosParaReserva,
            examenNombre:
              draggedExamen.NOMBRE_ASIGNATURA || draggedExamen.NOMBRE_EXAMEN,
            salaNombre: selectedSala.NOMBRE_SALA,
            modulosTexto: `Módulos ${modulo.ORDEN} - ${modulo.ORDEN + modulosNecesarios - 1}`,
            examenCompleto: draggedExamen,
            moduloInicialOrden: modulo.ORDEN,
            cantidadModulosOriginal: modulosNecesarios,
          });

          setShowReservaModal(true);
        } else {
          alert(
            `No se puede colocar el examen aquí:\n${conflictos.join('\n')}`
          );
        }
      } catch (error) {
        console.error('Error procesando drop:', error);
        alert('Error al procesar el examen. Inténtalo de nuevo.');
      } finally {
        setIsProcessingDrop(false);
        setTimeout(() => {
          if (onDropProcessed) {
            onDropProcessed();
          }
        }, 100);
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
    obtenerExamenParaCelda,
    onDropProcessed,
  ]);

  useEffect(() => {
    setLastProcessedDrop(null);
    setIsProcessingDrop(false);
  }, [selectedSala?.ID_SALA]);

  // Handlers para módulos y reservas
  const handleSelectModulo = useCallback(
    (fecha, orden) => {
      if (!selectedExamInternal) {
        alert('Primero arrastra un examen a una celda del calendario.');
        return;
      }
      setModulosSeleccionados((prev) => {
        if (prev.length && prev[0].fecha !== fecha) {
          alert('Módulos deben estar en el mismo día');
          return [{ fecha, numero: orden }];
        }
        if (prev.length > 0 && prev[0].fecha !== fecha) {
          alert('Todos los módulos deben ser del mismo día.');
          return [{ fecha, numero: orden }];
        }
        if (prev.length >= selectedExamInternal.CANTIDAD_MODULOS_EXAMEN) {
          alert(
            `Este examen solo requiere ${selectedExamInternal.CANTIDAD_MODULOS_EXAMEN} módulos.`
          );
          return prev;
        }
        const nuevos = [...prev, { fecha, numero: orden }].sort(
          (a, b) => a.numero - b.numero
        );
        for (let i = 0; i < nuevos.length - 1; i++) {
          if (nuevos[i + 1].numero !== nuevos[i].numero + 1) {
            alert('Módulos no consecutivos');
            return [{ fecha, numero: orden }];
          }
        }
        return nuevos;
      });
    },
    [selectedExamInternal]
  );

  const payloadForReserva = useCallback(() => {
    if (
      !selectedSala ||
      !selectedExamInternal ||
      !modulosSeleccionados ||
      modulosSeleccionados.length === 0
    ) {
      return null;
    }
    const modulosParaAPI = modulosSeleccionados
      .map((mSel) => {
        const modOriginal = modulos.find((mod) => mod.ORDEN === mSel.numero);
        return modOriginal ? { ID_MODULO: modOriginal.ID_MODULO } : null;
      })
      .filter((m) => m !== null);

    if (
      modulosParaAPI.length !== selectedExamInternal.CANTIDAD_MODULOS_EXAMEN
    ) {
      console.error('Discrepancia en la cantidad de módulos para la API');
      return null;
    }

    return {
      FECHA_RESERVA: modulosSeleccionados[0].fecha,
      ID_SALA: selectedSala.ID_SALA,
      ID_EXAMEN: selectedExamInternal.ID_EXAMEN,
      Modulos: modulosParaAPI,
    };
  }, [selectedSala, selectedExamInternal, modulosSeleccionados, modulos]);

  const handleExamenModulosChange = useCallback((examenId, newModulosCount) => {
    setExamenesConModulosModificados((prev) => ({
      ...prev,
      [examenId]: newModulosCount,
    }));
  }, []);

  const handleConfirmReserva = useCallback(async () => {
    const payload = payloadForReserva();
    if (!payload) {
      alert('Error: No se pueden confirmar los datos de la reserva.');
      return;
    }
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
        `Reserva para ${selectedExamInternal?.NOMBRE_ASIGNATURA} CONFIRMADO!`
      );
      setSelectedExamInternal(null);
      setModulosSeleccionados([]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      alert(`Error al confirmar reserva: ${error.message}`);
    }
  }, [payloadForReserva, selectedExamInternal]);

  const verificarConflictoAlRedimensionar = useCallback(
    (examenAsignado, nuevaCantidadModulos) => {
      const { fecha, moduloInicial } = examenAsignado;
      const moduloFinal = moduloInicial + nuevaCantidadModulos - 1;
      const moduloMaximo = Math.max(...modulos.map((m) => m.ORDEN));

      if (moduloFinal > moduloMaximo) {
        return {
          hayConflicto: true,
          mensaje: `No hay suficientes módulos disponibles. Se necesitan ${nuevaCantidadModulos} módulos pero solo hay hasta el módulo ${moduloMaximo}.`,
        };
      }

      // ... resto del código igual, PERO también corregir aquí:
      for (
        let i = moduloInicial;
        i < moduloInicial + nuevaCantidadModulos;
        i++
      ) {
        const estaReservado = reservas.some(
          (r) =>
            r.ID_SALA === selectedSala?.ID_SALA &&
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
            r.MODULOS?.some((m) => {
              // CAMBIO: MODULOS en mayúscula
              // CAMBIO: Usar la estructura correcta
              const moduloReservado = modulos.find(
                (mod) => mod.ID_MODULO === m.ID_MODULO
              );
              return moduloReservado && moduloReservado.ORDEN === i;
            })
        );

        if (estaReservado) {
          return {
            hayConflicto: true,
            mensaje: `Conflicto en el módulo ${i}: El módulo ya está reservado.`,
          };
        }
      }

      return {
        hayConflicto: false,
        mensaje: null,
      };
    },
    [modulos, examenesAsignados, reservas, selectedSala]
  );

  // Handlers de modal
  const handleCloseReservaModal = () => {
    setShowReservaModal(false);
    setReservaModalData(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCreateReserva = async (formDataPayload) => {
    setLoadingReservaModal(true);
    setModalError(null);
    setModalSuccess(null);

    const payloadFinal = {
      ...formDataPayload,
      // Si reservaModalData tiene datos actualizados, usarlos
      modulos:
        reservaModalData.modulosIds && reservaModalData.modulosIds.length > 0
          ? reservaModalData.modulosIds
          : formDataPayload.modulos,
    };

    try {
      const response =
        await crearReservaParaExamenExistenteService(payloadFinal);

      if (reservaModalData) {
        const cantidadModulosActual = payloadFinal.modulos.length;

        // Limpiar examenesAsignados antes de agregar a reservas
        setExamenesAsignados((prevAsignados) => {
          const examenesLimpiados = prevAsignados.filter(
            (asignado) =>
              asignado.examen.ID_EXAMEN !==
              (payloadFinal.examen_id_examen || reservaModalData.examenId)
          );
          return examenesLimpiados;
        });

        // Remover de la lista de exámenes pendientes
        setExamenes((prevExamenes) =>
          prevExamenes.filter(
            (examen) =>
              examen.ID_EXAMEN !==
              (payloadFinal.examen_id_examen || reservaModalData.examenId)
          )
        );

        // Crear la nueva reserva
        const nuevaReserva = {
          ID_RESERVA: response.data?.ID_RESERVA || Date.now(),
          ID_SALA: payloadFinal.sala_id_sala || reservaModalData.salaId,
          FECHA_RESERVA:
            payloadFinal.fecha_reserva || reservaModalData.fechaReserva,
          ID_EXAMEN: payloadFinal.examen_id_examen || reservaModalData.examenId,
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
            ID_EXAMEN:
              payloadFinal.examen_id_examen || reservaModalData.examenId,
            NOMBRE_ASIGNATURA: reservaModalData.examenNombre,
            CANTIDAD_MODULOS_EXAMEN: cantidadModulosActual,
          },
        };

        // Agregar a reservas confirmadas
        setReservas((prevReservas) => [...prevReservas, nuevaReserva]);
      }

      setModalSuccess(
        response.message || 'Reserva creada exitosamente y programada.'
      );

      setTimeout(() => {
        handleCloseReservaModal();
      }, 2000);
    } catch (err) {
      setModalError(err.details || err.error || 'Error al crear la reserva.');
    } finally {
      setLoadingReservaModal(false);
    }
  };

  const handleShowDeleteModal = useCallback(
    (examenAsignado) => {
      if (examenAsignado.esReservaConfirmada) {
        const reservacompleta = reservas.find(
          (r) =>
            r.ID_EXAMEN === examenAsignado.examen.ID_EXAMEN &&
            r.ID_SALA === selectedSala.ID_SALA &&
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') ===
              examenAsignado.fecha
        );

        if (reservacompleta) {
          setReservaToDelete(reservacompleta);
          setShowDeleteModal(true);
        } else {
          alert('Error: No se pudo encontrar la reserva para eliminar.');
        }
      } else {
        alert('Error: Solo se pueden eliminar reservas confirmadas.');
      }
    },
    [reservas, selectedSala]
  );

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setReservaToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!reservaToDelete) return;

    setLoadingDelete(true);

    try {
      await deleteReserva(reservaToDelete.ID_RESERVA);

      setReservas((prevReservas) =>
        prevReservas.filter((r) => r.ID_RESERVA !== reservaToDelete.ID_RESERVA)
      );

      if (reservaToDelete.Examen) {
        setExamenes((prevExamenes) => {
          const yaExiste = prevExamenes.some(
            (e) => e.ID_EXAMEN === reservaToDelete.ID_EXAMEN
          );

          if (!yaExiste) {
            return [...prevExamenes, reservaToDelete.Examen];
          }
          return prevExamenes;
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
  }, [reservaToDelete, handleCloseDeleteModal]);

  const handleAplicarFiltrosSalas = () => {
    setShowSalaFilterModal(false);
  };

  const puedeConfirmar =
    selectedExamInternal && modulosSeleccionados.length > 0 && selectedSala;

  return (
    <div className="agenda-semanal-container">
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
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setFechaSeleccionada(newDate);
                const weekStart = startOfWeek(newDate, {
                  weekStartsOn: 1,
                  locale: es,
                });
                setFechaBase(weekStart);
              }}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                const today = new Date();
                setFechaSeleccionada(today);
                const weekStart = startOfWeek(today, {
                  weekStartsOn: 1,
                  locale: es,
                });
                setFechaBase(weekStart);
              }}
              title="Ir a hoy"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

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
              onExamenModulosChange={handleExamenModulosChange}
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
            {isLoadingModulos || isLoadingSalas ? (
              <p className="aviso-seleccion">
                Cargando datos del calendario...
              </p>
            ) : selectedSala ? (
              <>
                <CalendarGrid
                  fechas={fechas}
                  modulos={modulos}
                  selectedSala={selectedSala}
                  selectedExam={selectedExamInternal}
                  reservas={reservas}
                  modulosSeleccionados={modulosSeleccionados}
                  onSelectModulo={handleSelectModulo}
                  onModulosChange={actualizarModulosExamen}
                  onRemoveExamen={eliminarExamen}
                  onDeleteReserva={handleShowDeleteModal}
                  onCheckConflict={verificarConflictoAlRedimensionar}
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

      <FilterModalSalas
        isOpen={showSalaFilterModal}
        onClose={() => setShowSalaFilterModal(false)}
        sedesDisponibles={sedesDisponibles}
        selectedSede={selectedSede}
        onSetSelectedSede={setSelectedSede}
        edificiosDisponibles={edificiosDisponibles}
        selectedEdificio={selectedEdificio}
        onSetSelectedEdificio={setSelectedEdificio}
        onAplicarFiltros={handleAplicarFiltrosSalas}
      />

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
            {loadingDelete ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Eliminando...
              </>
            ) : (
              'Confirmar Eliminación'
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal existente de reserva */}
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
                setReservaModalData((prev) => {
                  const datosActualizados = {
                    ...prev,
                    modulosIds: nuevosModulosIds,
                    cantidadModulosOriginal: nuevaCantidad,
                    modulosTexto: `Módulos ${prev.moduloInicialOrden} - ${prev.moduloInicialOrden + nuevaCantidad - 1}`,
                  };
                  return datosActualizados;
                });
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
    </div>
  );
}
