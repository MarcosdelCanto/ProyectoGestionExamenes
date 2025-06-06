import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
  set,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from 'react-bootstrap'; // Agregar import de Modal
import SalaSelector from './SalaSelector';
import ExamenSelector from './ExamenSelector';
import CalendarGrid from './CalendarGrid';
import FilterModalSalas from './FilterModalSalas';
import ReservaForm from '../reservas/ReservaForm';
import {
  crearReservaParaExamenExistenteService,
  fetchAllReservas,
  fetchReservaById, // Agregar esta importación
} from '../../services/reservaService'; // Agregar import del servicio
import './styles/AgendaSemanal.css';

export default function AgendaSemanal({
  draggedExamen,
  dropTargetCell,
  onDropProcessed,
}) {
  // Estados para Salas
  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [searchTermSala, setSearchTermSala] = useState('');
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [showSalaFilterModal, setShowSalaFilterModal] = useState(false);
  const [selectedSede, setSelectedSede] = useState(''); // Para el filtro de sede en el modal
  const [selectedEdificio, setSelectedEdificio] = useState(''); // Para el filtro de edificio en el modal

  // Estados para las opciones de los filtros de sala
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);

  // Estados para Exámenes
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]); // NUEVO: Array completo de exámenes
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);

  // Estados para el Calendario y la lógica de reserva
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [selectedExamInternal, setSelectedExamInternal] = useState(null); // Examen seleccionado para la reserva
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [fechaBase, setFechaBase] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  // Nuevo estado para exámenes asignados a la tabla
  const [examenesAsignados, setExamenesAsignados] = useState([]);
  const [examenesConModulosModificados, setExamenesConModulosModificados] =
    useState({});

  // Nuevo estado para controlar el procesamiento
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [lastProcessedDrop, setLastProcessedDrop] = useState(null);

  // Nuevos estados para la modal de reserva
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [reservaModalData, setReservaModalData] = useState(null);
  const [loadingReservaModal, setLoadingReservaModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  // Carga de datos inicial (salas, exámenes, módulos, reservas)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingSalas(true);
      setIsLoadingExamenes(true);
      setIsLoadingModulos(true);
      setIsLoadingReservas(true);

      try {
        // Cargar datos que no requieren autenticación primero
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
        console.log('Todos los exámenes cargados:', todosLosExamenes);

        // NUEVO: Mantener una referencia completa de todos los exámenes
        setTodosLosExamenesOriginal(todosLosExamenes);

        if (!modulosRes.ok) throw new Error('Error cargando módulos');
        const modulosData = await modulosRes.json();
        console.log('Módulos cargados:', modulosData);
        setModulos(modulosData);

        if (!sedesRes.ok) throw new Error('Error cargando sedes');
        setSedesDisponibles(await sedesRes.json());

        if (!edificiosRes.ok) throw new Error('Error cargando edificios');
        setEdificiosDisponibles(await edificiosRes.json());

        // Cargar reservas por separado usando el servicio (con autenticación)
        try {
          const reservasData = await fetchAllReservas();
          console.log('Reservas cargadas desde API:', reservasData);

          // Cargar detalles completos de cada reserva
          const reservasCompletas = await Promise.all(
            reservasData.map(async (reserva) => {
              try {
                const reservaCompleta = await fetchReservaById(
                  reserva.ID_RESERVA
                );
                console.log(
                  `Reserva completa ${reserva.ID_RESERVA}:`,
                  reservaCompleta
                );
                return reservaCompleta;
              } catch (error) {
                console.error(
                  `Error cargando detalles de reserva ${reserva.ID_RESERVA}:`,
                  error
                );
                return reserva;
              }
            })
          );

          // NUEVO: Procesar reservas para incluir información completa del examen
          const reservasConExamenes = reservasCompletas.map((reserva) => {
            if (!reserva.Examen && reserva.ID_EXAMEN) {
              const examenCompleto = todosLosExamenes.find(
                (e) => e.ID_EXAMEN === reserva.ID_EXAMEN
              );
              console.log(
                `Asociando examen ${reserva.ID_EXAMEN} a reserva ${reserva.ID_RESERVA}:`,
                examenCompleto
              );
              return {
                ...reserva,
                Examen: examenCompleto,
              };
            }
            return reserva;
          });

          console.log('Reservas procesadas con exámenes:', reservasConExamenes);
          setReservas(reservasConExamenes);

          // Filtrar exámenes que ya tienen reservas confirmadas
          const examenesConReserva = reservasConExamenes.map(
            (r) => r.ID_EXAMEN
          );
          console.log('IDs de exámenes con reserva:', examenesConReserva);

          const examenesSinReserva = todosLosExamenes.filter(
            (examen) => !examenesConReserva.includes(examen.ID_EXAMEN)
          );
          console.log(
            'Exámenes sin reserva (para mostrar en selector):',
            examenesSinReserva
          );

          setExamenes(examenesSinReserva);
        } catch (reservasError) {
          console.error('Error cargando reservas:', reservasError);
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
  const handleDateChange = useCallback((e) => {
    const selectedDate = new Date(e.target.value);

    const startOfSelectedWeek = startOfWeek(selectedDate, {
      weekStartsOn: 1, // Lunes como primer día de la semana
      locale: es,
    });
    setFechaBase(startOfSelectedWeek);
  }, []);

  //funcion para obtener las fechas de la semana actual
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

  // Filtrado de salas
  const filteredSalas = useMemo(() => {
    let tempSalas = salas;

    if (selectedSede) {
      // Asumimos que cada objeto 'sala' tiene una propiedad ID_SEDE
      tempSalas = tempSalas.filter((s) => s.ID_SEDE === parseInt(selectedSede));
    }

    if (selectedEdificio) {
      // Asumimos que cada objeto 'sala' tiene una propiedad ID_EDIFICIO
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
          // Si las salas tienen nombre de edificio directamente, o si necesitas buscar en una lista aparte:
          (s.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term) // Ejemplo si sala.NOMBRE_EDIFICIO existe
      );
    }
    return tempSalas;
  }, [salas, searchTermSala, selectedSede, selectedEdificio]);
  // Filtrado de exámenes
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
  const handleSelectSala = useCallback((sala) => {
    setSelectedSala(sala);
    setSelectedExamInternal(null); // Limpiar examen seleccionado al cambiar de sala
    setModulosSeleccionados([]); // Limpiar módulos seleccionados
  }, []);

  // funcion para añadir un examen a la tabla
  const agregarExamenATabla = useCallback(
    (examen, fecha, moduloOrden, cantidadModulos) => {
      console.log('agregando examen a tabla:', {
        examen,
        fecha,
        moduloOrden,
        cantidadModulos,
      });
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
  // funcion para actualizar modulos de un examen existente
  const actualizarModulosExamen = useCallback(
    (examenId, nuevosCant) => {
      setExamenesAsignados((prev) =>
        prev.map((asignado) =>
          asignado.examen.ID_EXAMEN === examenId
            ? { ...asignado, moduloscount: nuevosCant }
            : asignado
        )
      );
    },
    [setExamenesAsignados]
  );
  // funcion para eliminar un examen de la tabla
  const eliminarExamen = useCallback(
    (examenId) => {
      setExamenesAsignados((prev) => {
        const examenesActualizados = prev.filter(
          (asignado) => asignado.examen.ID_EXAMEN !== examenId
        );
        return examenesActualizados;
      });
      if (selectedExamInternal && selectedExamInternal.ID_EXAMEN === examenId) {
        setSelectedExamInternal(null); // Limpiar examen seleccionado si es el que se elimina
        setModulosSeleccionados([]);
      }
      setExamenesConModulosModificados((prev) => {
        const { [examenId]: _, ...rest } = prev; // Eliminar la entrada del examen eliminado
        return rest;
      });
    },
    [selectedExamInternal]
  );

  // Modificar la función obtenerExamenParaCelda para simplificar y debuggear
  const obtenerExamenParaCelda = useCallback(
    (fecha, ordenModulo) => {
      console.log('Buscando examen para celda:', {
        fecha,
        ordenModulo,
        selectedSala: selectedSala?.ID_SALA,
      });
      console.log('Reservas disponibles:', reservas);

      // Primero buscar en exámenes asignados localmente (drag & drop temporal)
      const examenAsignado = examenesAsignados.find(
        (asignado) =>
          asignado.fecha === fecha &&
          ordenModulo >= asignado.moduloInicial &&
          ordenModulo < asignado.moduloInicial + asignado.moduloscount
      );

      if (examenAsignado) {
        console.log('Encontrado examen asignado localmente:', examenAsignado);
        return examenAsignado;
      }

      // Si no hay sala seleccionada, no buscar en reservas
      if (!selectedSala) {
        return null;
      }

      // Buscar en reservas confirmadas
      const reservaEncontrada = reservas.find((reserva) => {
        const mismaSala = reserva.ID_SALA === selectedSala.ID_SALA;
        const mismaFecha =
          format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd') === fecha;

        console.log('Verificando reserva:', {
          reservaId: reserva.ID_RESERVA,
          mismaSala,
          mismaFecha,
          fechaReserva: format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd'),
          fechaBuscada: fecha,
          salaReserva: reserva.ID_SALA,
          salaBuscada: selectedSala.ID_SALA,
        });

        if (!mismaSala || !mismaFecha) {
          return false;
        }

        // AQUÍ ESTÁ EL PROBLEMA: Los módulos vienen con diferente estructura
        // Los módulos de la reserva son objetos completos: {ID_MODULO: 46, NOMBRE_MODULO: "Modulo 19", ...}
        // No necesitas buscar en el array de módulos, solo comparar directamente
        const tieneModulo = reserva.MODULOS?.some((moduloReserva) => {
          // CAMBIO: Comparar directamente el nombre del módulo con el orden
          // El NOMBRE_MODULO viene como "Modulo 19", necesitamos extraer el número
          const numeroModulo = parseInt(
            moduloReserva.NOMBRE_MODULO.replace('Modulo ', '')
          );
          const coincide = numeroModulo === ordenModulo;

          console.log('Verificando módulo:', {
            moduloReserva: moduloReserva,
            numeroModuloExtraido: numeroModulo,
            ordenBuscado: ordenModulo,
            coincide,
          });

          return coincide;
        });

        return tieneModulo;
      });

      if (reservaEncontrada) {
        console.log('Encontrada reserva:', reservaEncontrada);

        // Obtener la información del examen
        let examenInfo = reservaEncontrada.Examen;

        // Si no hay información del examen en la reserva, buscarla en el array completo
        if (!examenInfo && reservaEncontrada.ID_EXAMEN) {
          examenInfo = todosLosExamenesOriginal.find(
            (e) => e.ID_EXAMEN === reservaEncontrada.ID_EXAMEN
          );
          console.log('Examen encontrado en array original:', examenInfo);
        }

        if (examenInfo) {
          // CAMBIO: Calcular el módulo inicial usando el nombre del módulo
          const ordenesModulos = reservaEncontrada.MODULOS.map(
            (moduloReserva) => {
              const numeroModulo = parseInt(
                moduloReserva.NOMBRE_MODULO.replace('Modulo ', '')
              );
              return numeroModulo;
            }
          ).filter((orden) => !isNaN(orden));

          const moduloInicial = Math.min(...ordenesModulos);

          console.log('Módulos de la reserva:', {
            ordenesModulos,
            moduloInicial,
            ordenBuscado: ordenModulo,
          });

          // Solo mostrar el examen en el primer módulo de la reserva
          if (ordenModulo === moduloInicial) {
            const resultado = {
              id: `reserva-${reservaEncontrada.ID_RESERVA}-${fecha}-${moduloInicial}`,
              examen: examenInfo,
              fecha: fecha,
              moduloInicial: moduloInicial,
              moduloscount: reservaEncontrada.MODULOS.length, // Cambio: usar MODULOS en mayúscula
              esReservaConfirmada: true,
            };
            console.log('Retornando examen de reserva:', resultado);
            return resultado;
          }
        }
      }

      return null;
    },
    [
      examenesAsignados,
      reservas,
      selectedSala,
      modulos,
      todosLosExamenesOriginal,
    ]
  );

  // Efecto optimizado para procesar drops
  useEffect(() => {
    // Verificar si hay datos válidos para procesar
    if (!draggedExamen || !dropTargetCell || !selectedSala) {
      return;
    }

    // Crear un identificador único para este drop
    const dropId = `${draggedExamen.ID_EXAMEN}-${dropTargetCell.fecha}-${dropTargetCell.modulo.ORDEN}`;

    // Evitar procesar el mismo drop múltiples veces
    if (isProcessingDrop || lastProcessedDrop === dropId) {
      return;
    }

    console.log('Procesando drop de examen:', {
      draggedExamen,
      dropTargetCell,
      dropId,
    });

    const procesarDrop = async () => {
      setIsProcessingDrop(true);
      setLastProcessedDrop(dropId);

      try {
        const { fecha, modulo } = dropTargetCell;
        const modulosNecesarios = draggedExamen.CANTIDAD_MODULOS_EXAMEN;

        // Validación inicial
        if (!modulosNecesarios || modulosNecesarios <= 0) {
          alert('Error: El examen no tiene una cantidad válida de módulos.');
          return;
        }

        let hayConflicto = false;
        const conflictos = [];

        // Verificar conflictos de manera más eficiente
        for (let i = 0; i < modulosNecesarios; i++) {
          const ordenActual = modulo.ORDEN + i;

          // Verificar si el módulo existe
          const moduloExiste = modulos.some((m) => m.ORDEN === ordenActual);
          if (!moduloExiste) {
            conflictos.push(`Módulo ${ordenActual} no existe`);
            hayConflicto = true;
            continue;
          }

          // Verificar si ya hay un examen asignado
          const hayExamenAsignado = obtenerExamenParaCelda(fecha, ordenActual);
          if (hayExamenAsignado) {
            conflictos.push(
              `Módulo ${ordenActual} ya tiene un examen asignado`
            );
            hayConflicto = true;
            continue;
          }

          // Verificar reservas existentes
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
          // En lugar de agregar directamente, preparar datos para la modal
          const modulosParaReserva = [];
          for (let i = 0; i < modulosNecesarios; i++) {
            const ordenActual = modulo.ORDEN + i;
            const moduloObj = modulos.find((m) => m.ORDEN === ordenActual);
            if (moduloObj) {
              modulosParaReserva.push(moduloObj.ID_MODULO);
            }
          }

          // Preparar datos para la modal
          setReservaModalData({
            examenId: draggedExamen.ID_EXAMEN,
            fechaReserva: fecha,
            salaId: selectedSala.ID_SALA,
            modulosIds: modulosParaReserva,
            examenNombre:
              draggedExamen.NOMBRE_ASIGNATURA || draggedExamen.NOMBRE_EXAMEN,
            salaNombre: selectedSala.NOMBRE_SALA,
            modulosTexto: `Módulos ${modulo.ORDEN} - ${modulo.ORDEN + modulosNecesarios - 1}`,
          });

          setShowReservaModal(true);
          console.log('Modal de reserva abierta con datos:', reservaModalData);
        } else {
          // Mostrar conflictos específicos
          alert(
            `No se puede colocar el examen aquí:\n${conflictos.join('\n')}`
          );
        }
      } catch (error) {
        console.error('Error procesando drop:', error);
        alert('Error al procesar el examen. Inténtalo de nuevo.');
      } finally {
        setIsProcessingDrop(false);

        // Limpiar estados después de un pequeño delay
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

  // Limpiar el estado cuando se cambie de sala o se resetee
  useEffect(() => {
    setLastProcessedDrop(null);
    setIsProcessingDrop(false);
  }, [selectedSala?.ID_SALA]);

  const handleSelectModulo = useCallback(
    (fecha, orden) => {
      // Esta función podría ya no ser necesaria si la selección de módulos
      // se maneja completamente a través del drag-and-drop.
      // Si se mantiene, asegurarse que selectedExamInternal esté seteado.
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
          return [{ fecha, numero: orden }]; // Inicia nueva selección
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
    [selectedExamInternal] // Depende del examen activo
  );

  // Construir payload para reserva
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

  // manejo los cambios en los módulos del examen seleccionado
  const handleExamenModulosChange = useCallback((examenId, newModulosCount) => {
    setExamenesConModulosModificados((prev) => ({
      ...prev,
      [examenId]: newModulosCount,
    }));
  }, []);

  // Confirmar reserva al backend
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
        `Reserva para ${selectedExamInternal?.NOMBRE_ASIGNATURA}  CONFIRMADO!`
      );
      setSelectedExamInternal(null);
      setModulosSeleccionados([]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      alert(`Error al confirmar reserva: ${error.message}`);
    }
  }, [payloadForReserva, selectedExamInternal]);

  const handleAplicarFiltrosSalas = () => {
    setShowSalaFilterModal(false);
    // La re-filtración de salas ocurrirá automáticamente debido a los cambios en selectedSede/selectedEdificio
  };
  // Función para verificar conflictos al redimensionar un examen
  const verificarConflictoAlRedimensionar = useCallback(
    (examenAsignado, nuevaCantidadModulos) => {
      const { fecha, moduloInicial } = examenAsignado;

      // Verificar que los nuevos módulos no excedan el rango disponible
      const moduloFinal = moduloInicial + nuevaCantidadModulos - 1;
      const moduloMaximo = Math.max(...modulos.map((m) => m.ORDEN));

      if (moduloFinal > moduloMaximo) {
        return {
          hayConflicto: true,
          mensaje: `No hay suficientes módulos disponibles. Se necesitan ${nuevaCantidadModulos} módulos pero solo hay hasta el módulo ${moduloMaximo}.`,
        };
      }

      // Verificar que no haya conflictos con otros exámenes asignados
      for (
        let i = moduloInicial;
        i < moduloInicial + nuevaCantidadModulos;
        i++
      ) {
        const examenEnModulo = examenesAsignados.find(
          (asignado) =>
            asignado.fecha === fecha &&
            asignado.examen.ID_EXAMEN !== examenAsignado.examen.ID_EXAMEN &&
            i >= asignado.moduloInicial &&
            i < asignado.moduloInicial + asignado.moduloscount
        );

        if (examenEnModulo) {
          return {
            hayConflicto: true,
            mensaje: `Conflicto en el módulo ${i}: Ya hay un examen asignado (${examenEnModulo.examen.NOMBRE_ASIGNATURA}).`,
          };
        }
      }

      // Verificar conflictos con reservas existentes
      for (
        let i = moduloInicial;
        i < moduloInicial + nuevaCantidadModulos;
        i++
      ) {
        const estaReservado = reservas.some(
          (r) =>
            r.ID_SALA === selectedSala?.ID_SALA &&
            format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
            r.Modulos?.some((m) => {
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

    try {
      const response =
        await crearReservaParaExamenExistenteService(formDataPayload);

      // Agregar el examen al calendario visualmente
      if (reservaModalData) {
        agregarExamenATabla(
          {
            ID_EXAMEN: reservaModalData.examenId,
            NOMBRE_ASIGNATURA: reservaModalData.examenNombre,
            CANTIDAD_MODULOS_EXAMEN: reservaModalData.modulosIds.length,
          },
          reservaModalData.fechaReserva,
          modulos.find((m) => reservaModalData.modulosIds.includes(m.ID_MODULO))
            ?.ORDEN || 1,
          reservaModalData.modulosIds.length
        );

        // NUEVO: Remover el examen del selector de exámenes
        setExamenes((prevExamenes) =>
          prevExamenes.filter(
            (examen) => examen.ID_EXAMEN !== reservaModalData.examenId
          )
        );

        // NUEVO: Actualizar el estado de reservas para persistencia
        const nuevaReserva = {
          ID_RESERVA: response.data?.ID_RESERVA || Date.now(), // Usar ID real o temporal
          ID_SALA: reservaModalData.salaId,
          FECHA_RESERVA: reservaModalData.fechaReserva,
          ID_EXAMEN: reservaModalData.examenId,
          Modulos: reservaModalData.modulosIds.map((moduloId) => ({
            ID_MODULO: moduloId,
          })),
          // Agregar información del examen para mostrarlo en el calendario
          Examen: {
            ID_EXAMEN: reservaModalData.examenId,
            NOMBRE_ASIGNATURA: reservaModalData.examenNombre,
            CANTIDAD_MODULOS_EXAMEN: reservaModalData.modulosIds.length,
          },
        };

        setReservas((prevReservas) => [...prevReservas, nuevaReserva]);
      }

      setModalSuccess(
        response.message || 'Reserva creada exitosamente y programada.'
      );

      // Cerrar modal después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        handleCloseReservaModal();
      }, 2000);
    } catch (err) {
      setModalError(err.details || err.error || 'Error al crear la reserva.');
    } finally {
      setLoadingReservaModal(false);
    }
  };

  const puedeConfirmar =
    selectedExamInternal &&
    modulosSeleccionados.length > 0 &&
    modulosSeleccionados.length ===
      selectedExamInternal.CANTIDAD_MODULOS_EXAMEN;

  return (
    <div className="agenda-semanal-container">
      {/* Fila de selectores de sala y semana */}
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

                //calcular el inicio de la semana para la fecha seleccionada
                const weekStart = startOfWeek(newDate, {
                  weekStartsOn: 1, // Lunes como primer día de la semana
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

                // Establecer el inicio de la semana actual
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

      {/* Contenido principal: exámenes y calendario */}
      <div className="main-content mb-3">
        {/* Sección de exámenes pendientes */}
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

        {/* Sección de calendario */}
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
                  obtenerExamenParaCelda={obtenerExamenParaCelda}
                  onModulosChange={actualizarModulosExamen}
                  onRemoveExamen={eliminarExamen}
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

      {/* Modales */}
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

      {/* Nueva Modal de Reserva */}
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
              }}
              onSubmit={handleCreateReserva}
              onCancel={handleCloseReservaModal}
              isLoadingExternamente={loadingReservaModal}
              submitButtonText="Crear Reserva"
              isEditMode={true} // Para que los campos vengan pre-llenados y algunos deshabilitados
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
