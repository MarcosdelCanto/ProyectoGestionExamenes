import { useState, useEffect } from 'react';
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

            // Procesar reservas...
            const reservasConExamenes = reservasCompletas.map((reserva) => {
              if (!reserva.Examen && reserva.ID_EXAMEN) {
                const examenCompleto = todosLosExamenes.find(
                  (e) => e.ID_EXAMEN === reserva.ID_EXAMEN
                );
                return { ...reserva, Examen: examenCompleto };
              }
              return reserva;
            });

            const reservasConModulos = reservasConExamenes.map((reserva) => ({
              ...reserva,
              MODULOS_RESERVA_COUNT: reserva.MODULOS?.length || 0,
              Examen: {
                ...reserva.Examen,
                MODULOS_RESERVA:
                  reserva.MODULOS?.length ||
                  reserva.Examen?.CANTIDAD_MODULOS_EXAMEN ||
                  3,
              },
            }));

            setReservas(reservasConModulos);

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
            const examenesConReservasActivas = reservasConModulos
              .filter((r) => r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO')
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

  // Filtrar exámenes con estado ACTIVO
  const loadExamenes = async () => {
    try {
      setIsLoadingExamenes(true);

      // Cargar exámenes y reservas en paralelo para tener datos frescos
      const [examenesRes, reservasData] = await Promise.all([
        fetch('/api/examenes'),
        fetchAllReservas(),
      ]);

      if (examenesRes.ok) {
        const todosLosExamenes = await examenesRes.json();
        setTodosLosExamenesOriginal(todosLosExamenes);

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
          .filter((r) => r.ESTADO_CONFIRMACION_DOCENTE !== 'DESCARTADO')
          .map((r) => r.ID_EXAMEN || r.EXAMEN_ID_EXAMEN);

        const examenesActivosSinReserva = examenesActivos.filter(
          (examen) => !examenesConReservasActivas.includes(examen.ID_EXAMEN)
        );

        console.log('[useAgendaData] Recarga - Exámenes filtrados:', {
          total: todosLosExamenes.length,
          activos: examenesActivos.length,
          sinReserva: examenesActivosSinReserva.length,
        });

        // Actualizar también las reservas para mantener todo sincronizado
        setReservas(reservasData);
        setExamenes(examenesActivosSinReserva);
      }
    } catch (error) {
      console.error('[useAgendaData] Error al recargar exámenes:', error);
    } finally {
      setIsLoadingExamenes(false);
    }
  };

  // Escuchar el evento cuando se descarte una reserva
  useEffect(() => {
    const handleExamenesActualizados = (event) => {
      if (event.detail.accion === 'reserva_descartada') {
        console.log(
          '[useAgendaData] Recargando exámenes después de descartar reserva'
        );
        loadExamenes();
      }
    };

    window.addEventListener('examenesActualizados', handleExamenesActualizados);

    return () => {
      window.removeEventListener(
        'examenesActualizados',
        handleExamenesActualizados
      );
    };
  }, []);

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
    loadExamenes,
  };
}
