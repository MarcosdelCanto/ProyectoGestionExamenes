import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllReservas, fetchReservaById } from '../services/reservaService';
import { useDispatch, useSelector } from 'react-redux'; // <-- IMPORTAR HOOKS DE REDUX
import {
  cargarReservasGlobal, // <-- THUNK PARA CARGAR RESERVAS
  setearReservas, // <-- ACCIÓN PARA SETEAR RESERVAS (si no usamos thunk para todo)
  actualizarEstadoConfirmacionReserva, // Para otros cambios locales si es necesario
  agregarReserva,
  eliminarReserva,
} from '../store/reservasSlice'; // <-- IMPORTAR ACCIONES Y THUNK

export function useAgendaData() {
  // Estados para datos
  const [salas, setSalas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]);
  const [modulos, setModulos] = useState([]);
  // const [reservas, setReservas] = useState([]); // <-- YA NO USAREMOS ESTADO LOCAL PARA RESERVAS
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);

  // Estados de carga
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  const dispatch = useDispatch(); // <-- OBTENER DISPATCH
  // Leer el estado de reservas desde Redux
  const {
    lista: reservas,
    estadoCarga: estadoCargaReservas,
    error: errorReservas,
  } = useSelector((state) => state.reservas);

  const procesarReservaParaFrontend = useCallback(
    (reservaPlana, todosExamenesDisponibles) => {
      let procesada = { ...reservaPlana };

      // Intentar encontrar el examen completo en todosLosExamenesOriginal
      // usando el ID_EXAMEN de la reservaPlana.
      let examenCompletoAnidado = null;
      if (procesada.ID_EXAMEN) {
        // ID_EXAMEN debe venir de la reservaPlana
        const examenOriginal = todosExamenesDisponibles.find(
          (e) => e.ID_EXAMEN === procesada.ID_EXAMEN
        );
        if (examenOriginal) {
          // Si encontramos el examen original, lo usamos como base
          examenCompletoAnidado = { ...examenOriginal };
        } else {
          examenCompletoAnidado = {
            ID_EXAMEN: procesada.ID_EXAMEN,
            NOMBRE_EXAMEN: procesada.NOMBRE_EXAMEN,
            CANTIDAD_MODULOS_EXAMEN: procesada.CANTIDAD_MODULOS_EXAMEN,
            NOMBRE_ASIGNATURA: procesada.NOMBRE_ASIGNATURA,
          };
        }
      }

      // Asignar el objeto Examen construido (o null si no hay ID_EXAMEN)
      procesada.Examen = examenCompletoAnidado;

      // Calcular otros campos
      procesada = {
        ...procesada,
        MODULOS_RESERVA_COUNT: procesada.MODULOS?.length || 0,
        Examen: {
          ...(procesada.Examen || {}), // Usar el Examen ya anidado o un objeto vacío
          MODULOS_RESERVA:
            procesada.MODULOS?.length ||
            procesada.Examen?.CANTIDAD_MODULOS_EXAMEN ||
            3,
        },
      };
      return procesada;
    },
    [] // Asumiendo que `todosExamenesDisponibles` se pasa como argumento y no cambia la referencia innecesariamente.
  );

  // Cargar datos iniciales cuando el componente se monta
  useEffect(() => {
    // Despachar el thunk para cargar reservas globales
    // Esto reemplazará la lógica de fetchAllReservas y fetchReservaById dentro de loadInitialData
    dispatch(cargarReservasGlobal());

    async function loadInitialData() {
      try {
        // Cargar todos los datos en paralelo (más eficiente)
        const [salasRes, examenesRes, modulosRes, sedesRes, edificiosRes] =
          await Promise.all([
            fetch('/api/salas'),
            fetch('/api/examenes'),
            fetch('/api/modulos'),
            fetch('/api/sede'),
            fetch('/api/edificio'),
          ]);

        // Procesar respuestas básicas y enriquecer salas
        const edificiosData = edificiosRes.ok ? await edificiosRes.json() : [];
        setEdificiosDisponibles(edificiosData);

        if (salasRes.ok) {
          const salasData = await salasRes.json();
          // Enriquecer cada sala con su ID_SEDE a través del edificio
          const salasEnriquecidas = salasData.map((sala) => {
            const edificioDeSala = edificiosData.find(
              (edificio) => edificio.ID_EDIFICIO === sala.EDIFICIO_ID_EDIFICIO
            );
            return {
              ...sala,
              ID_SEDE: edificioDeSala ? edificioDeSala.SEDE_ID_SEDE : null, // Añadir ID_SEDE
              // Conservar NOMBRE_EDIFICIO si ya lo tenías o añadirlo aquí también
              NOMBRE_EDIFICIO: edificioDeSala
                ? edificioDeSala.NOMBRE_EDIFICIO
                : sala.NOMBRE_EDIFICIO || 'N/A',
            };
          });
          setSalas(salasEnriquecidas);
        }
        if (sedesRes.ok) setSedesDisponibles(await sedesRes.json());
        if (modulosRes.ok) setModulos(await modulosRes.json());

        // Procesar exámenes y reservas (más complejo)
        if (examenesRes.ok) {
          const todosLosExamenes = await examenesRes.json();
          setTodosLosExamenesOriginal(todosLosExamenes);

          // La carga de reservas ahora la maneja el thunk `cargarReservasGlobal`
          // El estado `reservas` se actualizará desde el store de Redux.
          // Necesitamos esperar a que `estadoCargaReservas` sea 'succeeded' o 'failed'
          // para procesar los exámenes contra las reservas.
          // Esta parte de la lógica se moverá a un useEffect que dependa de `reservas` del store.

          // Por ahora, solo filtramos exámenes activos si la carga de reservas falla o está pendiente
          // La lógica de filtrar exámenes contra reservas se hará en otro useEffect
          const examenesActivosInicial = todosLosExamenes.filter(
            (examen) =>
              examen.ESTADO_ID_ESTADO === 1 ||
              examen.ID_ESTADO === 1 ||
              examen.nombre_estado === 'ACTIVO' ||
              examen.NOMBRE_ESTADO === 'ACTIVO'
          );
          setExamenes(examenesActivosInicial);
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
  }, [dispatch]); // Añadir dispatch como dependencia

  // Memoizar las reservas procesadas
  const reservasProcesadas = useMemo(() => {
    if (
      estadoCargaReservas === 'succeeded' &&
      todosLosExamenesOriginal.length > 0
    ) {
      // console.log('[useAgendaData] Memo: Recalculando reservasProcesadas');
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

  // useEffect para procesar exámenes una vez que las reservas del store y todosLosExamenesOriginal estén listos
  useEffect(() => {
    if (
      estadoCargaReservas === 'succeeded' &&
      todosLosExamenesOriginal.length > 0
    ) {
      // console.log(
      //   '[useAgendaData] Reservas del store (antes de procesar para filtro):',
      //   JSON.parse(JSON.stringify(reservas))
      // ); // Log para ver las reservas del store

      const examenesActivos = todosLosExamenesOriginal.filter(
        (examen) =>
          examen.ESTADO_ID_ESTADO === 1 ||
          examen.ID_ESTADO === 1 ||
          examen.nombre_estado === 'ACTIVO' ||
          examen.NOMBRE_ESTADO === 'ACTIVO'
      );

      const reservasProcesadasParaFiltrado = reservas.map((r) =>
        procesarReservaParaFrontend(r, todosLosExamenesOriginal)
      );
      // console.log(
      //   '[useAgendaData] Reservas procesadas para filtrado:',
      //   JSON.parse(JSON.stringify(reservasProcesadasParaFiltrado))
      // );

      // Usar las reservas ya procesadas y memoizadas
      const examenesConReservasActivas = reservasProcesadas
        .filter(
          (r) =>
            r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO' &&
            r.ESTADO_CONFIRMACION_DOCENTE !== 'CANCELADO'
        )
        .map((r) => r.ID_EXAMEN || r.EXAMEN_ID_EXAMEN);

      const examenesActivosSinReserva = examenesActivos.filter(
        (examen) => !examenesConReservasActivas.includes(examen.ID_EXAMEN)
      );

      setExamenes(examenesActivosSinReserva);
      setIsLoadingReservas(false); // Marcar como cargadas las reservas para la UI
      setIsLoadingExamenes(false); // Marcar como cargados los exámenes para la UI
    } else if (estadoCargaReservas === 'loading') {
      setIsLoadingReservas(true);
    } else if (estadoCargaReservas === 'failed') {
      setIsLoadingReservas(false);
      // Manejar error de carga de reservas si es necesario
    }
  }, [
    reservasProcesadas,
    todosLosExamenesOriginal,
    estadoCargaReservas,
    dispatch,
    // procesarReservaParaFrontend,
  ]); // procesarReservaParaFrontend es estable si no depende de estado del hook

  // Función para recargar exámenes y reservas, asegurando el formato correcto
  const loadExamenesYReservas = useCallback(async () => {
    try {
      setIsLoadingExamenes(true);
      const examenesRes = await fetch('/api/examenes'); // Cargar exámenes locales
      dispatch(cargarReservasGlobal()); // Recargar reservas desde Redux

      if (examenesRes.ok) {
        const todosLosExamenes = await examenesRes.json();
        setTodosLosExamenesOriginal(todosLosExamenes); // Actualizar la fuente de verdad para los exámenes

        // PRIMER FILTRO: Por estado ACTIVO
        const examenesActivos = todosLosExamenes.filter(
          (examen) =>
            examen.ESTADO_ID_ESTADO === 1 ||
            examen.ID_ESTADO === 1 ||
            examen.nombre_estado === 'ACTIVO' ||
            examen.NOMBRE_ESTADO === 'ACTIVO'
        );

        // 'reservas' vendrá del store y se actualizará por el dispatch(cargarReservasGlobal())
        // SEGUNDO FILTRO: Exámenes sin reservas activas
        const examenesConReservasActivas = reservas // Usar 'reservas' del store
          .filter(
            (r) =>
              r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO' &&
              r.ESTADO_CONFIRMACION_DOCENTE !== 'CANCELADO'
          )
          .map((r) => r.ID_EXAMEN || r.EXAMEN_ID_EXAMEN);

        const examenesActivosSinReserva = examenesActivos.filter(
          (examen) => !examenesConReservasActivas.includes(examen.ID_EXAMEN)
        );

        // console.log('[useAgendaData] Recarga - Exámenes filtrados:', {
        //   total: todosLosExamenes.length,
        //   activos: examenesActivos.length,
        //   sinReserva: examenesActivosSinReserva.length,
        // });

        // setReservas ya no se llama directamente, Redux lo maneja.
        // El useEffect que depende de 'reservas' (del store) y 'todosLosExamenesOriginal'
        // se encargará de actualizar 'setExamenes(examenesActivosSinReserva)'
        // cuando las 'reservas' del store se actualicen.
        setExamenes(examenesActivosSinReserva);
      }
    } catch (error) {
      console.error('[useAgendaData] Error al recargar exámenes:', error);
    } finally {
      setIsLoadingExamenes(false);
    }
  }, [
    dispatch, // Añadir dispatch
    setExamenes,
    setIsLoadingExamenes,
    setTodosLosExamenesOriginal,
    reservasProcesadas,
  ]);

  // Escuchar eventos globales para actualizar el estado
  useEffect(() => {
    const handleReservaCreada = async (event) => {
      console.log(
        '[useAgendaData] Evento reservaCreada recibido:',
        event.detail
      );
      const {
        reserva: reservaBasicaDesdeEvento,
        examenId: examenIdDesdeEvento,
      } = event.detail;

      if (reservaBasicaDesdeEvento && reservaBasicaDesdeEvento.id_reserva) {
        try {
          // No activar el estado de carga global para una sola reserva nueva.
          // La UI se actualizará cuando setReservas y setExamenes se llamen.
          // 1. Obtener la reserva "plana" completa desde el backend
          const nuevaReservaPlana = await fetchReservaById(
            reservaBasicaDesdeEvento.id_reserva
          );

          // 2. Procesar para que coincida con la estructura esperada
          //    `todosLosExamenesOriginal` es el estado del hook, así que está disponible aquí.
          //    Asegurarse que procesarReservaParaFrontend no dependa de 'reservas' local.
          const nuevaReservaProcesada = procesarReservaParaFrontend(
            nuevaReservaPlana,
            todosLosExamenesOriginal
          );
          dispatch(agregarReserva(nuevaReservaProcesada)); // <-- DESPACHAR A REDUX

          // // 3. Añadir la nueva reserva procesada al estado local
          // setReservas((prevReservas) => {
          //   // Evitar duplicados si por alguna razón ya existe (ej. múltiples eventos rápidos)
          //   // O reemplazar si ya existe para asegurar la data más fresca
          //   const indiceExistente = prevReservas.findIndex(
          //     (r) => r.ID_RESERVA === nuevaReservaProcesada.ID_RESERVA
          //   );
          //   if (indiceExistente !== -1) {
          //     const actualizadas = [...prevReservas];
          //     actualizadas[indiceExistente] = nuevaReservaProcesada;
          //     return actualizadas;
          //   }
          //   return [...prevReservas, nuevaReservaProcesada];
          // });

          // 4. Actualizar la lista de exámenes disponibles (quitar el que se acaba de reservar)
          setExamenes((prevExamenes) =>
            prevExamenes.filter((ex) => ex.ID_EXAMEN !== examenIdDesdeEvento)
          );

          console.log(
            '[useAgendaData] Acción agregarReserva despachada. Exámenes actualizados.'
          );
        } catch (error) {
          console.error(
            '[useAgendaData] Error al procesar reservaCreada:',
            error
          );
          loadExamenesYReservas(); // Fallback: recargar todo si el procesamiento individual falla
        } finally {
          // Si no se activó isLoadingReservas, no es necesario desactivarlo aquí
          // para este flujo específico.
        }
      }
    };

    const handleExamenesActualizados = async (event) => {
      // Hacerla async por si necesitamos await en el futuro
      const { accion, examenId, reservaId } = event.detail;
      // Si una reserva se descarta o cancela, el examen asociado vuelve a estar disponible.
      if (accion === 'reserva_descartada' || accion === 'reserva_cancelada') {
        console.log(
          `[useAgendaData] Evento ${accion} para reserva ${reservaId}. Actualizando UI sin loader general.`
        );
        // No llamar a loadExamenesYReservas() para evitar el loader general.
        // Actualizar estados directamente.

        // 1. Quitar la reserva de la lista de reservas
        // setReservas((prevReservas) =>
        //   prevReservas.filter((r) => r.ID_RESERVA !== reservaId)
        // );
        dispatch(eliminarReserva(reservaId)); // <-- DESPACHAR A REDUX

        // 2. Añadir el examen de vuelta a la lista de exámenes disponibles
        //    Necesitamos el objeto completo del examen. Lo buscamos en todosLosExamenesOriginal.
        if (examenId) {
          const examenAReactivar = todosLosExamenesOriginal.find(
            (ex) => ex.ID_EXAMEN === examenId
          );
          if (examenAReactivar) {
            setExamenes((prevExamenes) => {
              // Evitar duplicados si ya estuviera por alguna razón
              if (
                !prevExamenes.some(
                  (ex) => ex.ID_EXAMEN === examenAReactivar.ID_EXAMEN
                )
              ) {
                return [...prevExamenes, examenAReactivar];
              }
              return prevExamenes;
            });
            console.log(
              `[useAgendaData] Examen ${examenId} reactivado y añadido a la lista.`
            );
          } else {
            console.warn(
              `[useAgendaData] No se encontró el examen original con ID ${examenId} para reactivar. Se recargarán todos los datos.`
            );
            loadExamenesYReservas(); // Fallback si no encontramos el examen
          }
        } else {
          console.warn(
            `[useAgendaData] Evento ${accion} no proveyó examenId. Se recargarán todos los datos.`
          );
          loadExamenesYReservas(); // Fallback si no hay examenId
        }
      }
    };

    // El listener para 'reservaConfirmacionActualizada' ya no es necesario aquí,
    // porque MisReservasAsignadasPage despachará una acción a Redux,
    // y este hook (useAgendaData) leerá el estado 'reservas' actualizado desde Redux.
    // const handleReservaConfirmacionActualizada = (event) => { ... }

    window.addEventListener('reservaCreada', handleReservaCreada);
    window.addEventListener('examenesActualizados', handleExamenesActualizados);
    // window.addEventListener(
    //   'reservaConfirmacionActualizada',
    //   handleReservaConfirmacionActualizada // Ya no es necesario si Redux maneja el estado
    // );

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
  ]); // Añadir dispatch y procesarReservaParaFrontend si se usa en los handlers

  // Retornar todo lo que necesita el componente
  return {
    // Datos
    salas,
    setSalas,
    examenes,
    setExamenes,
    todosLosExamenesOriginal,
    modulos,
    reservas: reservasProcesadas,
    sedesDisponibles,
    edificiosDisponibles,

    // Estados de carga
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas: estadoCargaReservas === 'loading', // Derivar de Redux

    // Funciones
    loadExamenes: loadExamenesYReservas, // Exponer la función renombrada si es necesario externamente
  };
}
