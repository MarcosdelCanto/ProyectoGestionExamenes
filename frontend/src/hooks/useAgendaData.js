import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchReservaById } from '../services/reservaService';
import { useDispatch, useSelector } from 'react-redux';
import {
  cargarReservasGlobal,
  agregarReserva,
  eliminarReserva,
} from '../store/reservasSlice';
import api from '../services/api';

export function useAgendaData() {
  const [salas, setSalas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);

  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  const dispatch = useDispatch();
  const { lista: reservas, estadoCarga: estadoCargaReservas } = useSelector(
    (state) => state.reservas
  );

  const procesarReservaParaFrontend = useCallback(
    (reservaPlana, todosExamenesDisponibles) => {
      let procesada = { ...reservaPlana };
      let examenCompletoAnidado = null;
      if (procesada.ID_EXAMEN) {
        const examenOriginal = todosExamenesDisponibles.find(
          (e) => e.ID_EXAMEN === procesada.ID_EXAMEN
        );
        if (examenOriginal) {
          examenCompletoAnidado = { ...examenOriginal };
          if (reservaPlana.NOMBRE_DOCENTE_ASIGNADO) {
            examenCompletoAnidado.NOMBRE_DOCENTE =
              reservaPlana.NOMBRE_DOCENTE_ASIGNADO;
          } else if (reservaPlana.NOMBRE_DOCENTE_PRINCIPAL) {
            // Fallback por consistencia
            examenCompletoAnidado.NOMBRE_DOCENTE =
              reservaPlana.NOMBRE_DOCENTE_PRINCIPAL;
          }
        } else {
          examenCompletoAnidado = {
            ID_EXAMEN: procesada.ID_EXAMEN,
            NOMBRE_EXAMEN: procesada.NOMBRE_EXAMEN,
            CANTIDAD_MODULOS_EXAMEN: procesada.CANTIDAD_MODULOS_EXAMEN,
            NOMBRE_ASIGNATURA: procesada.NOMBRE_ASIGNATURA,
            NOMBRE_DOCENTE: procesada.NOMBRE_DOCENTE_ASIGNADO, // Asegurarse de pasarlo si existe
          };
        }
      }
      procesada.Examen = examenCompletoAnidado;
      procesada = {
        ...procesada,
        MODULOS_RESERVA_COUNT: procesada.MODULOS?.length || 0,
        Examen: {
          ...(procesada.Examen || {}),
          MODULOS_RESERVA:
            procesada.MODULOS?.length ||
            procesada.Examen?.CANTIDAD_MODULOS_EXAMEN ||
            3,
        },
      };
      return procesada;
    },
    []
  );

  useEffect(() => {
    dispatch(cargarReservasGlobal());

    async function loadInitialData() {
      try {
        const [
          salasRes,
          examenesRes,
          modulosRes,
          sedesRes,
          edificiosRes,
          examenesDisponiblesRes,
        ] = await Promise.all([
          api.get('/sala'),
          api.get('/examen'), // <-- 1. Obtenemos TODOS los exámenes para la lista maestra
          api.get('/modulo'),
          api.get('/sede'),
          api.get('/edificio'),
          api.get('/examen/examenes/disponibles'), // <-- 2. Obtenemos los DISPONIBLES para el selector
        ]);

        const edificiosData = edificiosRes.data || [];
        setEdificiosDisponibles(edificiosData);

        const salasData = salasRes.data || [];
        const salasEnriquecidas = salasData.map((sala) => {
          const edificioDeSala = edificiosData.find(
            (edificio) => edificio.ID_EDIFICIO === sala.EDIFICIO_ID_EDIFICIO
          );
          return {
            ...sala,
            ID_SEDE: edificioDeSala ? edificioDeSala.SEDE_ID_SEDE : null,
            NOMBRE_EDIFICIO: edificioDeSala
              ? edificioDeSala.NOMBRE_EDIFICIO
              : sala.NOMBRE_EDIFICIO || 'N/A',
          };
        });
        setSalas(salasEnriquecidas);

        setSedesDisponibles(sedesRes.data || []);
        setModulos(modulosRes.data || []);

        // La lista maestra ahora tiene TODOS los exámenes con todos sus datos
        const todosLosExamenes = examenesRes.data || [];
        setTodosLosExamenesOriginal(todosLosExamenes);

        // La lista para el selector de la izquierda solo contiene los disponibles
        const examenesParaSelector = examenesDisponiblesRes.data || [];
        setExamenes(examenesParaSelector); // <-- Usamos los disponibles para el selector
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
  }, [dispatch]);

  const reservasProcesadas = useMemo(() => {
    if (
      estadoCargaReservas === 'succeeded' &&
      todosLosExamenesOriginal.length > 0
    ) {
      return reservas.map((r) =>
        procesarReservaParaFrontend(r, todosLosExamenesOriginal)
      );
    }
    return [];
  }, [
    reservas,
    estadoCargaReservas,
    todosLosExamenesOriginal,
    procesarReservaParaFrontend,
  ]);

  useEffect(() => {
    if (estadoCargaReservas === 'succeeded') {
      setIsLoadingReservas(false);
    }
  }, [estadoCargaReservas]);

  // Ya no necesitamos el useEffect para filtrar examenes, `loadInitialData` lo hace.
  // El resto de los efectos (loadExamenesYReservas, handleReservaCreada, etc.) deberían funcionar correctamente
  // o pueden ser simplificados si la lógica de `loadInitialData` es suficiente.

  // ... (El resto de los hooks: loadExamenesYReservas y el listener de eventos se mantienen igual)
  const loadExamenesYReservas = useCallback(async () => {
    try {
      setIsLoadingExamenes(true);
      const [examenesMaestrosRes, examenesDisponiblesRes] = await Promise.all([
        api.get('/examen'),
        api.get('/examen/examenes/disponibles'),
      ]);
      dispatch(cargarReservasGlobal());

      setTodosLosExamenesOriginal(examenesMaestrosRes.data || []);
      setExamenes(examenesDisponiblesRes.data || []);
    } catch (error) {
      console.error('[useAgendaData] Error al recargar exámenes:', error);
    } finally {
      setIsLoadingExamenes(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const handleReservaCreada = async (event) => {
      const { reserva: reservaBasica, examenId } = event.detail;
      if (reservaBasica?.id_reserva) {
        try {
          const nuevaReservaPlana = await fetchReservaById(
            reservaBasica.id_reserva
          );
          const nuevaReservaProcesada = procesarReservaParaFrontend(
            nuevaReservaPlana,
            todosLosExamenesOriginal
          );
          dispatch(agregarReserva(nuevaReservaProcesada));
          setExamenes((prev) => prev.filter((ex) => ex.ID_EXAMEN !== examenId));
        } catch (error) {
          loadExamenesYReservas();
        }
      }
    };
    const handleExamenesActualizados = async (event) => {
      const { accion, examenId, reservaId } = event.detail;
      if (accion === 'reserva_descartada' || accion === 'reserva_cancelada') {
        dispatch(eliminarReserva(reservaId));
        if (examenId) {
          const examenAReactivar = todosLosExamenesOriginal.find(
            (ex) => ex.ID_EXAMEN === examenId
          );
          if (examenAReactivar) {
            setExamenes((prev) =>
              prev.some((ex) => ex.ID_EXAMEN === examenAReactivar.ID_EXAMEN)
                ? prev
                : [...prev, examenAReactivar]
            );
          } else {
            loadExamenesYReservas();
          }
        } else {
          loadExamenesYReservas();
        }
      }
    };
    window.addEventListener('reservaCreada', handleReservaCreada);
    window.addEventListener('examenesActualizados', handleExamenesActualizados);
    return () => {
      window.removeEventListener('reservaCreada', handleReservaCreada);
      window.removeEventListener(
        'examenesActualizados',
        handleExamenesActualizados
      );
    };
  }, [
    loadExamenesYReservas,
    todosLosExamenesOriginal,
    dispatch,
    procesarReservaParaFrontend,
  ]);

  return {
    salas,
    setSalas,
    examenes,
    setExamenes,
    todosLosExamenesOriginal,
    modulos,
    reservas: reservasProcesadas,
    sedesDisponibles,
    edificiosDisponibles,
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas: estadoCargaReservas === 'loading',
    loadExamenes: loadExamenesYReservas,
  };
}
