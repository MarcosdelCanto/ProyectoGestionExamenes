import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchReservaById } from '../services/reservaService';
import { useDispatch, useSelector } from 'react-redux';
import {
  cargarReservasGlobal,
  agregarReserva,
  eliminarReserva,
} from '../store/reservasSlice';
import api from '../services/api';
import { fetchAllEscuelas } from '../services/escuelaService'; // Importación necesaria

export function useAgendaData() {
  const [salas, setSalas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);
  const [allEscuelasWithColors, setAllEscuelasWithColors] = useState([]); // Nuevo estado para escuelas con colores

  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [isLoadingEscuelas, setIsLoadingEscuelas] = useState(true); // Nuevo estado de carga

  const dispatch = useDispatch();
  const { lista: reservas, estadoCarga: estadoCargaReservas } = useSelector(
    (state) => state.reservas
  );

  // Función auxiliar para obtener los colores de una escuela dado su nombre
  const getEscuelaColors = useCallback((schoolName, fetchedEscuelas) => {
    if (!schoolName || !fetchedEscuelas || fetchedEscuelas.length === 0) {
      return null;
    }
    const matchingEscuela = fetchedEscuelas.find(
      (esc) => esc.NOMBRE_ESCUELA === schoolName
    );
    if (
      matchingEscuela &&
      matchingEscuela.COLOR_BACKGROUND &&
      matchingEscuela.COLOR_BORDER
    ) {
      return {
        COLOR_BACKGROUND: matchingEscuela.COLOR_BACKGROUND,
        COLOR_BORDER: matchingEscuela.COLOR_BORDER,
      };
    }
    return null;
  }, []);

  // Función para enriquecer un objeto (reserva o examen) con los colores de su escuela
  const enrichObjectWithSchoolColors = useCallback(
    (obj, fetchedEscuelas) => {
      // Asume que obj tiene una propiedad NOMBRE_ESCUELA (o se puede derivar)
      if (!obj || !obj.NOMBRE_ESCUELA || !fetchedEscuelas) return obj;
      const colors = getEscuelaColors(obj.NOMBRE_ESCUELA, fetchedEscuelas);
      return colors ? { ...obj, ...colors } : obj;
    },
    [getEscuelaColors]
  );

  // `procesarReservaParaFrontend` ahora recibe `fetchedEscuelas` para enriquecer la reserva.
  const procesarReservaParaFrontend = useCallback(
    (reservaPlana, todosExamenesDisponibles, fetchedEscuelas) => {
      let procesada = { ...reservaPlana };
      let examenCompletoAnidado = null;
      if (procesada.ID_EXAMEN) {
        const examenOriginal = todosExamenesDisponibles.find(
          (e) => e.ID_EXAMEN === procesada.ID_EXAMEN
        );
        if (examenOriginal) {
          examenCompletoAnidado = { ...examenOriginal };
          if (procesada.NOMBRE_DOCENTE_ASIGNADO) {
            examenCompletoAnidado.NOMBRE_DOCENTE =
              procesada.NOMBRE_DOCENTE_ASIGNADO;
          } else if (procesada.NOMBRE_DOCENTE_PRINCIPAL) {
            examenCompletoAnidado.NOMBRE_DOCENTE =
              procesada.NOMBRE_DOCENTE_PRINCIPAL;
          }
        } else {
          examenCompletoAnidado = {
            ID_EXAMEN: procesada.ID_EXAMEN,
            NOMBRE_EXAMEN: procesada.NOMBRE_EXAMEN,
            CANTIDAD_MODULOS_EXAMEN: procesada.CANTIDAD_MODULOS_EXAMEN,
            NOMBRE_ASIGNATURA: procesada.NOMBRE_ASIGNATURA,
            NOMBRE_DOCENTE: procesada.NOMBRE_DOCENTE_ASIGNADO,
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

      // Adjuntar colores al objeto de reserva principal
      return enrichObjectWithSchoolColors(procesada, fetchedEscuelas);
    },
    [enrichObjectWithSchoolColors]
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
          escuelasRes, // Cargar escuelas con colores
        ] = await Promise.all([
          api.get('/sala'),
          api.get('/examen'),
          api.get('/modulo'),
          api.get('/sede'),
          api.get('/edificio'),
          api.get('/examen/examenes/disponibles'),
          fetchAllEscuelas(), // Llamada al servicio de escuelas
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

        const schoolsWithColors = escuelasRes.filter(Boolean);
        setAllEscuelasWithColors(schoolsWithColors);
        setIsLoadingEscuelas(false); // Marcar carga de escuelas como completada

        // Función para procesar cada examen y añadirle los colores de su escuela
        const processExamAndAddColors = (exam) => {
          // Asumimos que el objeto 'exam' ya tiene 'NOMBRE_ESCUELA' por JOINS en el backend.
          // Si no, se necesitaría una lógica para inferir el nombre de la escuela a partir de sus IDs de carrera/asignatura/sección.
          return enrichObjectWithSchoolColors(exam, schoolsWithColors);
        };

        const todosLosExamenes = (examenesRes.data || []).map(
          processExamAndAddColors
        );
        setTodosLosExamenesOriginal(todosLosExamenes);

        const examenesParaSelector = (examenesDisponiblesRes.data || []).map(
          processExamAndAddColors
        );
        setExamenes(examenesParaSelector); // Los exámenes ya tienen info de color
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
  }, [dispatch, enrichObjectWithSchoolColors]); // Añadir `enrichObjectWithSchoolColors` como dependencia

  const reservasProcesadas = useMemo(() => {
    if (
      estadoCargaReservas === 'succeeded' &&
      todosLosExamenesOriginal.length > 0 &&
      !isLoadingEscuelas // Asegurar que las escuelas ya estén cargadas
    ) {
      return reservas.map((r) =>
        procesarReservaParaFrontend(
          r,
          todosLosExamenesOriginal,
          allEscuelasWithColors
        )
      );
    }
    return [];
  }, [
    reservas,
    estadoCargaReservas,
    todosLosExamenesOriginal,
    procesarReservaParaFrontend,
    allEscuelasWithColors, // Asegurar que esté como dependencia
    isLoadingEscuelas,
  ]);

  // `loadExamenesYReservas` ahora también enriquece los exámenes recargados
  const loadExamenesYReservas = useCallback(async () => {
    try {
      setIsLoadingExamenes(true);
      const [examenesMaestrosRes, examenesDisponiblesRes] = await Promise.all([
        api.get('/examen'),
        api.get('/examen/examenes/disponibles'),
      ]);
      dispatch(cargarReservasGlobal());

      // Procesar exámenes maestros para añadir colores
      const processedExamenesMaestros = (examenesMaestrosRes.data || []).map(
        (exam) => enrichObjectWithSchoolColors(exam, allEscuelasWithColors)
      );
      setTodosLosExamenesOriginal(processedExamenesMaestros);

      // Procesar exámenes disponibles para añadir colores
      const processedExamenesDisponibles = (
        examenesDisponiblesRes.data || []
      ).map((exam) =>
        enrichObjectWithSchoolColors(exam, allEscuelasWithColors)
      );
      setExamenes(processedExamenesDisponibles);
    } catch (error) {
      console.error('[useAgendaData] Error al recargar exámenes:', error);
    } finally {
      setIsLoadingExamenes(false);
    }
  }, [dispatch, allEscuelasWithColors, enrichObjectWithSchoolColors]); // Añadir dependencias

  // `handleReservaCreada` y `handleExamenesActualizados` también se ajustan para usar los datos enriquecidos
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
            todosLosExamenesOriginal,
            allEscuelasWithColors
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
            // Asegurar que el examen reactivado también tenga información de color
            const processedExamenAReactivar = enrichObjectWithSchoolColors(
              examenAReactivar,
              allEscuelasWithColors
            );
            setExamenes((prev) =>
              prev.some(
                (ex) => ex.ID_EXAMEN === processedExamenAReactivar.ID_EXAMEN
              )
                ? prev
                : [...prev, processedExamenAReactivar]
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
    allEscuelasWithColors,
    enrichObjectWithSchoolColors,
  ]);

  return {
    salas,
    setSalas,
    examenes, // `examenes` ahora incluye `COLOR_BACKGROUND` y `COLOR_BORDER`
    setExamenes,
    todosLosExamenesOriginal,
    modulos,
    reservas: reservasProcesadas, // `reservas` ahora incluye `COLOR_BACKGROUND` y `COLOR_BORDER`
    sedesDisponibles,
    edificiosDisponibles,
    allEscuelasWithColors, // Exportar también las escuelas con colores
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas: estadoCargaReservas === 'loading',
    isLoadingEscuelas, // Exportar el estado de carga de las escuelas
    loadExamenes: loadExamenesYReservas,
  };
}
export default useAgendaData;
