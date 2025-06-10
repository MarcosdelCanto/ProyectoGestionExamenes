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

            // Enriquecer reservas con datos de exámenes
            const reservasConExamenes = reservasCompletas.map((reserva) => {
              if (!reserva.Examen && reserva.ID_EXAMEN) {
                const examenCompleto = todosLosExamenes.find(
                  (e) => e.ID_EXAMEN === reserva.ID_EXAMEN
                );
                return { ...reserva, Examen: examenCompleto };
              }
              return reserva;
            });

            // Cuando se cargan las reservas, incluir la cantidad de módulos de la reserva:
            const reservasConModulos = reservasConExamenes.map((reserva) => ({
              ...reserva,
              MODULOS_RESERVA_COUNT: reserva.MODULOS?.length || 0, // ← Contar módulos de la reserva
              Examen: {
                ...reserva.Examen,
                MODULOS_RESERVA:
                  reserva.MODULOS?.length ||
                  reserva.Examen?.CANTIDAD_MODULOS_EXAMEN ||
                  3,
              },
            }));

            setReservas(reservasConModulos);

            // Filtrar exámenes que ya tienen reserva
            const examenesConReserva = reservasConModulos.map(
              (r) => r.ID_EXAMEN
            );
            const examenesSinReserva = todosLosExamenes.filter(
              (examen) => !examenesConReserva.includes(examen.ID_EXAMEN)
            );

            setExamenes(examenesSinReserva);
          } catch (error) {
            console.error('Error al cargar reservas:', error);
            setReservas([]);
            setExamenes(todosLosExamenes);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        // Marcar todo como cargado
        setIsLoadingSalas(false);
        setIsLoadingExamenes(false);
        setIsLoadingModulos(false);
        setIsLoadingReservas(false);
      }
    }

    loadInitialData();
  }, []); // Solo se ejecuta una vez al montar el componente

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
  };
}
