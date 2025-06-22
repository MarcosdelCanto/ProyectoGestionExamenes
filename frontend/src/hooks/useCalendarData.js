import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { useMemo, useCallback } from 'react';

export function useCalendarData({
  reservas,
  selectedSala,
  selectedExam,
  modulosSeleccionados,
  modulos,
}) {
  // Obtener reservas actualizadas de Redux
  const reservasFromRedux = useSelector((state) => state.reservas.lista);

  // Usar las reservas más actualizadas (priorizar Redux)
  const reservasActualizadas =
    reservasFromRedux?.length > 0 ? reservasFromRedux : reservas;

  // Agregar un timestamp para forzar recálculo cuando sea necesario
  const reservasWithTimestamp = useMemo(() => {
    return (
      reservas?.map((reserva) => ({
        ...reserva,
        _timestamp: reserva._lastModified || Date.now(),
      })) || []
    );
  }, [reservas]);

  // Una sola fuente de verdad para todas las celdas
  const calendarData = useMemo(() => {
    const data = new Map();

    // Procesar reservas confirmadas
    if (reservasWithTimestamp && reservasWithTimestamp.length > 0) {
      reservasWithTimestamp.forEach((reserva) => {
        if (reserva.ID_SALA !== selectedSala?.ID_SALA) {
          return;
        }

        const fecha = format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd');
        const modulosReserva = reserva.MODULOS || [];

        // Usar la cantidad más confiable disponible
        const cantidadModulosReal =
          modulosReserva.length ||
          reserva.Examen?.CANTIDAD_MODULOS_EXAMEN ||
          reserva.MODULOS_RESERVA_COUNT ||
          3;

        if (cantidadModulosReal === 0) return;

        // Usar módulo inicial de la reserva si está disponible
        let moduloInicial;

        if (
          reserva.MODULO_INICIAL_RESERVA &&
          reserva.MODULO_INICIAL_RESERVA > 0
        ) {
          // La reserva tiene un módulo inicial explícito (desde BD)
          moduloInicial = reserva.MODULO_INICIAL_RESERVA;
        } else if (modulosReserva.length > 0) {
          // Calcular desde los módulos existentes
          const ordenesModulos = modulosReserva
            .map((m) => {
              const moduloCompletoDelSistema = modulos.find(
                (mod) => mod.ID_MODULO === m.ID_MODULO
              );
              return moduloCompletoDelSistema?.ORDEN || m.ORDEN;
            })
            .filter((orden) => orden !== undefined && orden !== null);

          if (ordenesModulos.length > 0) {
            moduloInicial = Math.min(...ordenesModulos);
          } else {
            return;
          }
        } else {
          // No hay módulos ni módulo inicial definido
          return;
        }

        // Crear entrada para todos los módulos necesarios
        for (let i = 0; i < cantidadModulosReal; i++) {
          const ordenActual = moduloInicial + i;
          const key = `${fecha}-${ordenActual}`;

          data.set(key, {
            tipo: 'reserva',
            examen: reserva.Examen,
            modulosTotal: cantidadModulosReal,
            moduloInicial,
            reservaCompleta: reserva,
            fecha,
            orden: ordenActual,
          });
        }
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
          reservaCompleta: null,
          fecha: m.fecha,
          orden: m.numero,
        });
      });
    }

    return data;
  }, [
    reservasWithTimestamp,
    selectedSala,
    selectedExam,
    modulosSeleccionados,
    modulos,
  ]);

  // Función simple para obtener datos de celda
  const getCellData = useCallback(
    (fecha, orden) => {
      const key = `${fecha}-${orden}`;
      return calendarData.get(key) || null;
    },
    [calendarData]
  );

  // Función simple para determinar si renderizar
  const shouldRenderExamen = useCallback((cellData) => {
    if (!cellData) return false;
    // Convertir a número para asegurar la comparación correcta
    return Number(cellData.moduloInicial) === Number(cellData.orden);
  }, []);

  // Función para verificar si una celda está ocupada
  const isCellOccupied = useCallback(
    (fecha, orden) => {
      return calendarData.has(`${fecha}-${orden}`);
    },
    [calendarData]
  );

  // Función para obtener el tipo de ocupación
  const getCellType = useCallback(
    (fecha, orden) => {
      const cellData = calendarData.get(`${fecha}-${orden}`);
      return cellData?.tipo || null;
    },
    [calendarData]
  );

  // Verificar conflictos para redimensionamiento
  const checkConflict = useCallback(
    ({
      examenId,
      reservaId,
      fecha,
      moduloInicial,
      cantidadModulos,
      celdasAVerificar,
    }) => {
      // Validar parámetros
      if (!fecha || !moduloInicial || !cantidadModulos) {
        return true;
      }

      // Verificar que los módulos existan en el rango válido
      for (let i = 0; i < cantidadModulos; i++) {
        const ordenActual = moduloInicial + i;
        const moduloExiste = modulos.some((m) => m.ORDEN === ordenActual);

        if (!moduloExiste) {
          return true;
        }
      }

      // Verificar conflictos con reservas existentes
      for (let i = 0; i < cantidadModulos; i++) {
        const ordenActual = moduloInicial + i;

        const reservaConflictiva = reservasActualizadas.find((reserva) => {
          // Excluir la misma reserva que se está modificando
          if (reservaId && reserva.ID_RESERVA === reservaId) {
            return false;
          }

          // Excluir el mismo examen (si se proporciona examenId)
          if (examenId && reserva.ID_EXAMEN === examenId) {
            return false;
          }

          // Verificar misma sala
          if (reserva.ID_SALA !== selectedSala?.ID_SALA) {
            return false;
          }

          // Verificar misma fecha
          if (format(new Date(reserva.FECHA_RESERVA), 'yyyy-MM-dd') !== fecha) {
            return false;
          }

          // Verificar si algún módulo de la reserva conflicta con el orden actual
          const moduloConflicta = reserva.MODULOS?.some((m) => {
            let ordenDelModulo;

            // Manejar módulos temporales (creados por Redux)
            if (
              typeof m.ID_MODULO === 'string' &&
              m.ID_MODULO.startsWith('temp-')
            ) {
              // Para módulos temporales, usar directamente el ORDEN del objeto
              ordenDelModulo = m.ORDEN;
            } else {
              // Para módulos reales, buscar en el array modulos
              const moduloInfo = modulos.find(
                (mod) => mod.ID_MODULO === m.ID_MODULO
              );
              ordenDelModulo = moduloInfo?.ORDEN;
            }

            return ordenDelModulo === ordenActual;
          });

          return moduloConflicta;
        });

        if (reservaConflictiva) {
          return true;
        }
      }

      return false;
    },
    [reservasActualizadas, selectedSala, modulos]
  );

  return {
    calendarData,
    getCellData,
    shouldRenderExamen,
    checkConflict,
    getCellType,
  };
}
