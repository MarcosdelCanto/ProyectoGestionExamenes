import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';

export function useCalendarData({
  reservas,
  selectedSala,
  selectedExam,
  modulosSeleccionados,
  modulos,
}) {
  // MEJORAR: Agregar un timestamp para forzar recálculo cuando sea necesario
  const reservasWithTimestamp = useMemo(() => {
    return (
      reservas?.map((reserva) => ({
        ...reserva,
        _timestamp: reserva._lastModified || Date.now(),
      })) || []
    );
  }, [reservas]);

  // SIMPLIFICAR: Una sola fuente de verdad para todas las celdas
  const calendarData = useMemo(() => {
    const data = new Map();

    console.log(
      '[useCalendarData] Recalculando calendarData con reservas:',
      JSON.parse(JSON.stringify(reservasWithTimestamp))
    );

    // Procesar reservas confirmadas
    if (reservasWithTimestamp && reservasWithTimestamp.length > 0) {
      reservasWithTimestamp.forEach((reserva) => {
        if (reserva.ID_SALA !== selectedSala?.ID_SALA) {
          return;
        }

        const fecha = format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd');
        const modulosReserva = reserva.MODULOS || [];

        // MEJORAR: Usar la cantidad más confiable disponible
        const cantidadModulosReal =
          modulosReserva.length ||
          reserva.Examen?.CANTIDAD_MODULOS_EXAMEN ||
          reserva.MODULOS_RESERVA_COUNT ||
          3;

        console.log(
          `[useCalendarData] Procesando reserva ${reserva.ID_RESERVA}:`,
          {
            modulosReserva: modulosReserva.length,
            cantidadCalculada: cantidadModulosReal,
            modulosArray: JSON.parse(JSON.stringify(modulosReserva)),
          }
        );

        if (cantidadModulosReal === 0) return;

        // Calcular módulo inicial
        const ordenesModulos = modulosReserva
          .map((m) => {
            const moduloCompletoDelSistema = modulos.find(
              (mod) => mod.ID_MODULO === m.ID_MODULO
            );
            return moduloCompletoDelSistema?.ORDEN || m.ORDEN; // Usar m.ORDEN como fallback
          })
          .filter((orden) => orden !== undefined);

        if (ordenesModulos.length === 0) {
          console.warn(
            `[useCalendarData] No se pudieron calcular órdenes para reserva ${reserva.ID_RESERVA}`
          );
          return;
        }

        const moduloInicial = Math.min(...ordenesModulos);

        // Crear entrada para cada módulo de la reserva
        ordenesModulos.forEach((orden) => {
          const key = `${fecha}-${orden}`;
          data.set(key, {
            tipo: 'reserva',
            examen: reserva.Examen,
            modulosTotal: cantidadModulosReal,
            moduloInicial,
            reservaCompleta: reserva,
            fecha,
            orden,
          });
        });

        console.log(
          `[useCalendarData] Reserva ${reserva.ID_RESERVA} mapeada a ${ordenesModulos.length} celdas`
        );
      });
    }

    // Procesar selección temporal
    if (
      selectedExam &&
      modulosSeleccionados &&
      modulosSeleccionados.length > 0
    ) {
      const moduloInicial = Math.min(
        ...modulosSeleccionados.map((m) => m.numero)
      );

      modulosSeleccionados.forEach((m) => {
        const key = `${m.fecha}-${m.numero}`;

        data.set(key, {
          tipo: 'temporal',
          examen: selectedExam,
          modulosTotal: modulosSeleccionados.length,
          moduloInicial,
          reservaCompleta: null, // ← CORREGIR nombre de prop
          fecha: m.fecha,
          orden: m.numero,
        });
      });
    }

    console.log(
      '[useCalendarData] CalendarData final:',
      Array.from(data.entries())
    );
    return data;
  }, [
    reservasWithTimestamp,
    selectedSala,
    selectedExam,
    modulosSeleccionados,
    modulos,
  ]);

  // SIMPLIFICAR: Una función simple para obtener datos de celda
  const getCellData = useCallback(
    (fecha, orden) => {
      const key = `${fecha}-${orden}`;
      return calendarData.get(key) || null;
    },
    [calendarData]
  );

  // SIMPLIFICAR: Una función simple para determinar si renderizar
  const shouldRenderExamen = useCallback((cellData) => {
    if (!cellData) return false;
    // Convertir a número para asegurar la comparación correcta
    return Number(cellData.moduloInicial) === Number(cellData.orden);
  }, []);

  // ÚTIL: Función para verificar si una celda está ocupada
  const isCellOccupied = useCallback(
    (fecha, orden) => {
      return calendarData.has(`${fecha}-${orden}`);
    },
    [calendarData]
  );

  // ÚTIL: Función para obtener el tipo de ocupación
  const getCellType = useCallback(
    (fecha, orden) => {
      const cellData = calendarData.get(`${fecha}-${orden}`);
      return cellData?.tipo || null;
    },
    [calendarData]
  );

  // NUEVA FUNCIÓN: Verificar conflictos para redimensionamiento
  const checkConflict = useCallback(
    (examenId, fecha, moduloInicial, nuevaCantidadModulos) => {
      console.log('🔍 Verificando conflicto:', {
        examenId,
        fecha,
        moduloInicial,
        nuevaCantidadModulos,
      });

      // Validar parámetros
      if (!fecha || !moduloInicial || !nuevaCantidadModulos) {
        console.log('❌ Parámetros inválidos');
        return true;
      }

      // Verificar que los módulos existan
      for (let i = 0; i < nuevaCantidadModulos; i++) {
        const ordenActual = moduloInicial + i;
        const moduloExiste = modulos.some((m) => m.ORDEN === ordenActual);

        if (!moduloExiste) {
          console.log(`❌ Módulo ${ordenActual} no existe`);
          return true;
        }
      }

      // Verificar conflictos con reservas existentes (excluyendo el examen actual)
      for (let i = 0; i < nuevaCantidadModulos; i++) {
        const ordenActual = moduloInicial + i;

        const hayConflicto = reservas.some((reserva) => {
          // Excluir el mismo examen
          if (reserva.ID_EXAMEN === examenId) return false;

          // Verificar misma sala y fecha
          if (reserva.ID_SALA !== selectedSala?.ID_SALA) return false;
          if (format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd') !== fecha)
            return false;

          // Verificar si algún módulo de la reserva conflicta
          return reserva.MODULOS?.some((m) => {
            const moduloInfo = modulos.find(
              (mod) => mod.ID_MODULO === m.ID_MODULO
            );
            return moduloInfo?.ORDEN === ordenActual;
          });
        });

        if (hayConflicto) {
          console.log(`❌ Conflicto en módulo ${ordenActual}`);
          return true;
        }
      }

      console.log('✅ Sin conflictos');
      return false;
    },
    [reservas, selectedSala, modulos]
  );

  return {
    getCellData,
    shouldRenderExamen,
    isCellOccupied,
    getCellType,
    checkConflict, // ← NUEVA FUNCIÓN
  };
}
