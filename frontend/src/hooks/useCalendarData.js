import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';

export function useCalendarData({
  reservas,
  selectedSala,
  selectedExam,
  modulosSeleccionados,
  modulos,
}) {
  // SIMPLIFICAR: Una sola fuente de verdad para todas las celdas
  const calendarData = useMemo(() => {
    const data = new Map();

    // Procesar reservas confirmadas
    if (reservas && reservas.length > 0) {
      reservas.forEach((reserva) => {
        if (reserva.ID_SALA !== selectedSala?.ID_SALA) return;

        const fecha = format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd');
        const modulosReserva = reserva.MODULOS || [];
        const cantidadModulosReal =
          modulosReserva.length ||
          reserva.MODULOS_RESERVA_COUNT ||
          reserva.Examen?.CANTIDAD_MODULOS_EXAMEN ||
          3;

        // console.log('🔍 Procesando reserva:', {
        //   id: reserva.ID_RESERVA,
        //   modulosArray: modulosReserva,
        //   cantidadCalculada: cantidadModulosReal,
        // });

        if (cantidadModulosReal === 0) return;

        // Calcular módulo inicial una sola vez
        const ordenesModulos = modulosReserva
          .map((m) => {
            const modulo = modulos.find((mod) => mod.ID_MODULO === m.ID_MODULO);
            return modulo?.ORDEN;
          })
          .filter((orden) => orden !== undefined);

        if (ordenesModulos.length === 0) return;

        const moduloInicial = Math.min(...ordenesModulos);

        // Crear entrada para cada módulo de la reserva
        ordenesModulos.forEach((orden) => {
          const key = `${fecha}-${orden}`;

          data.set(key, {
            tipo: 'reserva',
            examen: reserva.Examen,
            modulosTotal: cantidadModulosReal,
            moduloInicial,
            reservaCompleta: reserva, // ← CORREGIR nombre de prop
            fecha,
            orden,
          });
        });
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

    return data;
  }, [reservas, selectedSala, selectedExam, modulosSeleccionados, modulos]);

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
