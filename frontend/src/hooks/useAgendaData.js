import { useState, useEffect, useCallback } from 'react';
import { fetchAllReservas, fetchReservaById } from '../services/reservaService';

export function useAgendaData() {
  // Estados para datos
  const [salas, setSalas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [todosLosExamenesOriginal, setTodosLosExamenesOriginal] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);

  // Estados de carga
  const [isLoadingSalas, setIsLoadingSalas] = useState(true);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [isLoadingModulos, setIsLoadingModulos] = useState(true);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);

  // Función helper para procesar una reserva plana y darle la estructura que espera el frontend
  const procesarReservaParaFrontend = (
    reservaPlana,
    todosExamenesDisponibles
  ) => {
    let procesada = { ...reservaPlana };
    // Anidar el objeto Examen si no existe y tenemos la info
    if (!procesada.Examen && procesada.ID_EXAMEN) {
      const examenOriginal = todosExamenesDisponibles.find(
        (e) => e.ID_EXAMEN === procesada.ID_EXAMEN
      );
      if (examenOriginal) {
        procesada.Examen = { ...examenOriginal };
      }
    }
    // Añadir/Asegurar campos calculados o esperados por el frontend
    procesada = {
      ...procesada,
      MODULOS_RESERVA_COUNT: procesada.MODULOS?.length || 0,
      Examen: {
        // Asegurar que Examen exista antes de desestructurarlo
        ...(procesada.Examen || {}), // Usar objeto vacío como fallback si Examen es undefined
        // Podría ser más preciso usar CANTIDAD_MODULOS_EXAMEN del examen original
        MODULOS_RESERVA:
          procesada.MODULOS?.length ||
          procesada.Examen?.CANTIDAD_MODULOS_EXAMEN ||
          3,
      },
    };
    return procesada;
  };

  // Cargar datos iniciales cuando el componente se monta
  useEffect(() => {
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

        // Procesar respuestas básicas
        if (salasRes.ok) setSalas(await salasRes.json());
        if (sedesRes.ok) setSedesDisponibles(await sedesRes.json());
        if (edificiosRes.ok) setEdificiosDisponibles(await edificiosRes.json());
        if (modulosRes.ok) setModulos(await modulosRes.json());

        // Procesar exámenes y reservas (más complejo)
        if (examenesRes.ok) {
          const todosLosExamenes = await examenesRes.json();
          setTodosLosExamenesOriginal(todosLosExamenes);

          try {
            // Cargar reservas con datos completos
            const reservasData = await fetchAllReservas();
            const reservasCompletas = await Promise.all(
              reservasData.map(async (reserva) => {
                try {
                  return await fetchReservaById(reserva.ID_RESERVA);
                } catch {
                  return reserva; // Si falla, usar datos básicos
                }
              })
            );

            // Procesar las reservas completas para el formato del frontend
            const reservasProcesadas = reservasCompletas.map((r) =>
              procesarReservaParaFrontend(r, todosLosExamenes)
            );
            setReservas(reservasProcesadas);

            // *** CAMBIO IMPORTANTE: APLICAR DOBLE FILTRO ***
            // 1. Filtrar por estado ACTIVO
            const examenesActivos = todosLosExamenes.filter(
              (examen) =>
                examen.ESTADO_ID_ESTADO === 1 ||
                examen.ID_ESTADO === 1 ||
                examen.nombre_estado === 'ACTIVO' ||
                examen.NOMBRE_ESTADO === 'ACTIVO'
            );

            console.log(
              '[useAgendaData] Exámenes activos:',
              examenesActivos.length
            );

            // 2. Filtrar exámenes que ya tienen reserva activa
            const examenesConReservasActivas = reservasProcesadas // <-- CORRECCIÓN AQUÍ
              .filter(
                (r) =>
                  r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO' &&
                  r.ESTADO_CONFIRMACION_DOCENTE !== 'CANCELADO'
              ) // Considerar también CANCELADO si aplica
              .map((r) => r.ID_EXAMEN || r.EXAMEN_ID_EXAMEN);

            const examenesActivosSinReserva = examenesActivos.filter(
              (examen) => !examenesConReservasActivas.includes(examen.ID_EXAMEN)
            );

            console.log('[useAgendaData] Carga inicial - Exámenes filtrados:', {
              total: todosLosExamenes.length,
              activos: examenesActivos.length,
              sinReserva: examenesActivosSinReserva.length,
            });

            setExamenes(examenesActivosSinReserva);
          } catch (error) {
            console.error('Error al cargar reservas:', error);

            // Si falla la carga de reservas, al menos filtrar por estado ACTIVO
            const examenesActivos = todosLosExamenes.filter(
              (examen) =>
                examen.ESTADO_ID_ESTADO === 1 ||
                examen.ID_ESTADO === 1 ||
                examen.nombre_estado === 'ACTIVO' ||
                examen.NOMBRE_ESTADO === 'ACTIVO'
            );

            console.log(
              '[useAgendaData] Fallback - Solo exámenes activos:',
              examenesActivos.length
            );
            setReservas([]);
            setExamenes(examenesActivos);
          }
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

  // Función para recargar exámenes y reservas, asegurando el formato correcto
  const loadExamenesYReservas = useCallback(async () => {
    try {
      setIsLoadingExamenes(true);

      // Cargar exámenes y reservas en paralelo para tener datos frescos
      const [examenesRes, reservasData] = await Promise.all([
        fetch('/api/examenes'),
        fetchAllReservas(),
      ]);

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

        // SEGUNDO FILTRO: Exámenes sin reservas activas
        const examenesConReservasActivas = reservasData
          .filter(
            (r) =>
              r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO' &&
              r.ESTADO_CONFIRMACION_DOCENTE !== 'CANCELADO'
          )
          .map((r) => r.ID_EXAMEN || r.EXAMEN_ID_EXAMEN);

        const examenesActivosSinReserva = examenesActivos.filter(
          (examen) => !examenesConReservasActivas.includes(examen.ID_EXAMEN)
        );

        console.log('[useAgendaData] Recarga - Exámenes filtrados:', {
          total: todosLosExamenes.length,
          activos: examenesActivos.length,
          sinReserva: examenesActivosSinReserva.length,
        });

        // Procesar las reservas obtenidas para asegurar el formato completo
        const reservasCompletasPlanas = await Promise.all(
          reservasData.map(async (reservaBasica) => {
            try {
              return await fetchReservaById(reservaBasica.ID_RESERVA);
            } catch (error) {
              console.error(
                `Error fetching details for reserva ${reservaBasica.ID_RESERVA} during reload:`,
                error
              );
              return reservaBasica; // Fallback a la básica
            }
          })
        );
        const reservasProcesadas = reservasCompletasPlanas.map((r) =>
          procesarReservaParaFrontend(r, todosLosExamenes)
        );
        setReservas(reservasProcesadas);
        setExamenes(examenesActivosSinReserva);
      }
    } catch (error) {
      console.error('[useAgendaData] Error al recargar exámenes:', error);
    } finally {
      setIsLoadingExamenes(false);
    }
    // Dependencias para useCallback: funciones set de useState son estables.
    // fetchAllReservas y fetchReservaById son imports, estables.
    // procesarReservaParaFrontend se define fuera, pero si usara estado del hook, necesitaría estar en dependencias o ser useCallback también.
    // Como usa `todosLosExamenes` que es local a la función en este contexto, está bien.
  }, [
    setTodosLosExamenesOriginal,
    setReservas,
    setExamenes,
    setIsLoadingExamenes,
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
          const nuevaReservaProcesada = procesarReservaParaFrontend(
            nuevaReservaPlana,
            todosLosExamenesOriginal
          );

          // 3. Añadir la nueva reserva procesada al estado local
          setReservas((prevReservas) => {
            // Evitar duplicados si por alguna razón ya existe (ej. múltiples eventos rápidos)
            // O reemplazar si ya existe para asegurar la data más fresca
            const indiceExistente = prevReservas.findIndex(
              (r) => r.ID_RESERVA === nuevaReservaProcesada.ID_RESERVA
            );
            if (indiceExistente !== -1) {
              const actualizadas = [...prevReservas];
              actualizadas[indiceExistente] = nuevaReservaProcesada;
              return actualizadas;
            }
            return [...prevReservas, nuevaReservaProcesada];
          });

          // 4. Actualizar la lista de exámenes disponibles (quitar el que se acaba de reservar)
          setExamenes((prevExamenes) =>
            prevExamenes.filter((ex) => ex.ID_EXAMEN !== examenIdDesdeEvento)
          );

          console.log(
            '[useAgendaData] Nueva reserva procesada y añadida. Exámenes actualizados.'
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

    const handleExamenesActualizados = (event) => {
      const { accion, examenId, reservaId } = event.detail;
      // Si una reserva se descarta o cancela, el examen asociado vuelve a estar disponible.
      if (accion === 'reserva_descartada' || accion === 'reserva_cancelada') {
        console.log(
          `[useAgendaData] Evento ${accion} para reserva ${reservaId}. Recargando exámenes y reservas.`
        );
        loadExamenesYReservas(); // Llama a la función que recarga ambos y procesa correctamente
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
    // `loadExamenesYReservas` es useCallback, `todosLosExamenesOriginal` es un estado.
    // `setReservas`, `setExamenes`, `setIsLoadingReservas` son estables.
  }, [loadExamenesYReservas, todosLosExamenesOriginal]);

  // Retornar todo lo que necesita el componente
  return {
    // Datos
    salas,
    setSalas,
    examenes,
    setExamenes,
    todosLosExamenesOriginal,
    modulos,
    reservas,
    setReservas,
    sedesDisponibles,
    edificiosDisponibles,

    // Estados de carga
    isLoadingSalas,
    isLoadingExamenes,
    isLoadingModulos,
    isLoadingReservas,

    // Funciones
    loadExamenes: loadExamenesYReservas, // Exponer la función renombrada si es necesario externamente
  };
}
