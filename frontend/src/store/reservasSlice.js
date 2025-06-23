import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAllReservas, fetchReservaById } from '../services/reservaService'; // Asumimos que estos ya usan tu 'api'

// Thunk asíncrono para cargar todas las reservas
export const cargarReservasGlobal = createAsyncThunk(
  'reservas/cargarReservasGlobal',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAllReservas();
      // Podríamos necesitar procesar/obtener detalles completos aquí si fetchAllReservas es muy básico
      // Por ahora, asumimos que devuelve lo necesario o que lo haremos al setear.
      // Para un procesamiento más completo como en useAgendaData:
      const reservasCompletas = await Promise.all(
        data.map(async (reserva) => {
          try {
            return await fetchReservaById(reserva.ID_RESERVA);
          } catch {
            return reserva; // Fallback
          }
        })
      );
      return reservasCompletas;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  lista: [], // Aquí guardaremos el array de todas las reservas
  estadoCarga: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const reservasSlice = createSlice({
  name: 'reservas',
  initialState,
  reducers: {
    // Acción para actualizar el estado de confirmación de una reserva específica
    actualizarEstadoConfirmacionReserva: (state, action) => {
      const {
        id_reserva,
        nuevo_estado_confirmacion_docente,
        observaciones_docente,
        fecha_confirmacion_docente,
      } = action.payload;
      const indice = state.lista.findIndex((r) => r.ID_RESERVA === id_reserva);
      if (indice !== -1) {
        state.lista[indice].ESTADO_CONFIRMACION_DOCENTE =
          nuevo_estado_confirmacion_docente;
        if (observaciones_docente !== undefined) {
          state.lista[indice].OBSERVACIONES_DOCENTE = observaciones_docente;
        }
        if (fecha_confirmacion_docente !== undefined) {
          state.lista[indice].FECHA_CONFIRMACION_DOCENTE =
            fecha_confirmacion_docente;
        }
      }
    },
    // Acción para añadir una nueva reserva (creada desde el calendario)
    agregarReserva: (state, action) => {
      const nuevaReserva = action.payload;

      // ASEGURAR que la nueva reserva tenga MODULO_INICIAL_RESERVA establecido
      if (
        !nuevaReserva.MODULO_INICIAL_RESERVA &&
        nuevaReserva.MODULOS &&
        nuevaReserva.MODULOS.length > 0
      ) {
        const ordenesValidos = nuevaReserva.MODULOS.map((m) => m.ORDEN)
          .filter((orden) => orden !== undefined && orden !== null)
          .sort((a, b) => a - b);

        if (ordenesValidos.length > 0) {
          nuevaReserva.MODULO_INICIAL_RESERVA = ordenesValidos[0];
          console.log(
            `[reservasSlice] Estableciendo MODULO_INICIAL_RESERVA: ${nuevaReserva.MODULO_INICIAL_RESERVA} para nueva reserva ${nuevaReserva.ID_RESERVA}`
          );
        }
      }

      // Agregar timestamp
      nuevaReserva._lastModified = Date.now();

      // Verificar si ya existe para evitar duplicados
      const existe = state.lista.some(
        (r) => r.ID_RESERVA === nuevaReserva.ID_RESERVA
      );
      if (!existe) {
        state.lista.push(nuevaReserva);
        console.log(
          `[reservasSlice] Nueva reserva agregada: ${nuevaReserva.ID_RESERVA}`
        );
      } else {
        console.warn(
          `[reservasSlice] Reserva ${nuevaReserva.ID_RESERVA} ya existe, no se agregó duplicado`
        );
      }
    },
    // Acción para eliminar una reserva (cancelada desde el calendario)
    eliminarReserva: (state, action) => {
      const reservaId = action.payload;
      state.lista = state.lista.filter((r) => r.ID_RESERVA !== reservaId);
    },
    // Acción para reemplazar todas las reservas (útil después de una carga completa)
    setearReservas: (state, action) => {
      state.lista = action.payload;
    },
    // Nueva acción para actualizar la cantidad de módulos localmente
    actualizarModulosReservaLocalmente: (state, action) => {
      const { id_reserva, nuevaCantidadModulos, moduloInicialActual } =
        action.payload; // <-- AGREGAR moduloInicialActual
      console.log(
        '[reservasSlice] actualizarModulosReservaLocalmente - id_reserva RECIBIDO:',
        id_reserva,
        '| nuevaCantidadModulos:',
        nuevaCantidadModulos,
        '| moduloInicialActual:',
        moduloInicialActual // <-- AGREGAR LOG
      );

      const indice = state.lista.findIndex((r) => r.ID_RESERVA === id_reserva);
      if (indice !== -1) {
        const reservaActual = state.lista[indice];

        // Actualizar la cantidad en el examen anidado
        if (reservaActual.Examen) {
          reservaActual.Examen.CANTIDAD_MODULOS_EXAMEN = nuevaCantidadModulos;
        }
        reservaActual.MODULOS_RESERVA_COUNT = nuevaCantidadModulos;

        // USAR EL MÓDULO INICIAL PASADO DESDE EL COMPONENTE
        let moduloInicialOriginal;

        if (moduloInicialActual && moduloInicialActual > 0) {
          // PRIORIDAD 1: Usar el módulo inicial pasado desde el componente
          moduloInicialOriginal = moduloInicialActual;
          reservaActual.MODULO_INICIAL_RESERVA = moduloInicialOriginal; // Guardarlo
          console.log(
            `[reservasSlice] USANDO módulo inicial del componente: ${moduloInicialOriginal} para reserva ${id_reserva}`
          );
        } else if (
          reservaActual.MODULO_INICIAL_RESERVA &&
          reservaActual.MODULO_INICIAL_RESERVA > 0
        ) {
          // PRIORIDAD 2: Usar el que ya estaba guardado
          moduloInicialOriginal = reservaActual.MODULO_INICIAL_RESERVA;
          console.log(
            `[reservasSlice] USANDO módulo inicial ya guardado: ${moduloInicialOriginal} para reserva ${id_reserva}`
          );
        } else {
          // PRIORIDAD 3: Calcular desde módulos existentes (fallback)
          const modulosExistentes = reservaActual.MODULOS || [];
          if (modulosExistentes.length > 0) {
            const ordenesValidos = modulosExistentes
              .map((m) => m.ORDEN)
              .filter((orden) => orden !== undefined && orden !== null)
              .sort((a, b) => a - b);

            if (ordenesValidos.length > 0) {
              moduloInicialOriginal = ordenesValidos[0];
              reservaActual.MODULO_INICIAL_RESERVA = moduloInicialOriginal;
              console.log(
                `[reservasSlice] CALCULANDO módulo inicial desde módulos: ${moduloInicialOriginal} para reserva ${id_reserva}`
              );
            } else {
              moduloInicialOriginal = 1;
              reservaActual.MODULO_INICIAL_RESERVA = moduloInicialOriginal;
              console.warn(
                `[reservasSlice] USANDO FALLBACK módulo inicial: 1 para reserva ${id_reserva}`
              );
            }
          } else {
            moduloInicialOriginal = 1;
            reservaActual.MODULO_INICIAL_RESERVA = moduloInicialOriginal;
            console.warn(
              `[reservasSlice] SIN módulos, usando fallback: 1 para reserva ${id_reserva}`
            );
          }
        }

        // Crear nuevo array de módulos manteniendo el orden inicial fijo
        const nuevosModulos = [];
        for (let i = 0; i < nuevaCantidadModulos; i++) {
          const ordenActual = moduloInicialOriginal + i;

          const nuevoModulo = {
            ID_MODULO: `temp-${id_reserva}-${ordenActual}`,
            NOMBRE_MODULO: `Módulo ${ordenActual}`,
            ORDEN: ordenActual,
            ID_RESERVA: id_reserva,
          };
          nuevosModulos.push(nuevoModulo);
        }

        // Asignar el nuevo array
        reservaActual.MODULOS = nuevosModulos;

        // IMPORTANTE: Forzar una actualización del timestamp
        reservaActual._lastModified = Date.now();

        console.log(
          `[reservasSlice] Reserva ${id_reserva} actualizada. Módulo inicial PRESERVADO: ${moduloInicialOriginal}`,
          `Nuevos módulos: ${nuevosModulos.map((m) => m.ORDEN).join(', ')}`
        );
      } else {
        console.error(
          `[reservasSlice] ERROR: No se encontró reserva con ID_RESERVA = ${id_reserva}`
        );
      }
    },
    // Nueva acción para procesar actualizaciones desde WebSockets
    procesarActualizacionReservaSocket: (state, action) => {
      const reservaActualizada = action.payload;
      // El payload del socket (reservaActualizada) ya debería tener los campos del examen
      // en el nivel superior (ej. ID_EXAMEN, NOMBRE_EXAMEN) gracias a emitReservaActualizada del backend.
      // No es necesario anidar 'Examen' aquí; eso lo hará procesarReservaParaFrontend.
      const indice = state.lista.findIndex(
        (r) => r.ID_RESERVA === reservaActualizada.ID_RESERVA
      );
      if (indice !== -1) {
        // Fusionar la reserva existente con la actualizada del socket
        // Esto preserva cualquier dato local que no venga del socket pero actualiza los que sí vienen.
        state.lista[indice] = { ...state.lista[indice], ...reservaActualizada };

        // Asegurar que la cantidad de módulos se actualice correctamente
        // basado en los módulos reales de la reserva.
        const nuevaCantidadModulos = reservaActualizada.MODULOS?.length || 0;
        console.log(
          `[reservasSlice] Procesando actualización para reserva ${reservaActualizada.ID_RESERVA}. Cantidad de módulos calculada a partir del socket: ${nuevaCantidadModulos}. Datos completos de la reserva del socket:`,
          JSON.stringify(reservaActualizada, null, 2)
        );
        if (state.lista[indice].Examen) {
          state.lista[indice].Examen.CANTIDAD_MODULOS_EXAMEN =
            nuevaCantidadModulos;
        }
        // Si tienes un campo directo en la reserva para la cuenta de módulos, actualízalo también
        state.lista[indice].MODULOS_RESERVA_COUNT = nuevaCantidadModulos;
        console.log(
          `[reservasSlice] Estado de la reserva ${reservaActualizada.ID_RESERVA} en Redux DESPUÉS de la actualización:`,
          JSON.stringify(state.lista[indice], null, 2)
        );
        console.log(
          `[reservasSlice] Reserva ${reservaActualizada.ID_RESERVA} actualizada desde socket. Nueva cantidad de módulos: ${nuevaCantidadModulos}`
        );
        console.log(
          `[reservasSlice] Reserva actualizada:`,
          state.lista[indice]
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cargarReservasGlobal.pending, (state) => {
        state.estadoCarga = 'loading';
        state.error = null;
      })
      .addCase(cargarReservasGlobal.fulfilled, (state, action) => {
        state.estadoCarga = 'succeeded';
        // Aquí es importante procesar las reservas para que tengan la estructura esperada
        // (similar a procesarReservaParaFrontend de useAgendaData)
        // Por simplicidad, asignamos directamente, pero podrías necesitar un mapeo.
        state.lista = action.payload; // Asume que payload ya está bien formateado
      })
      .addCase(cargarReservasGlobal.rejected, (state, action) => {
        state.estadoCarga = 'failed';
        state.error = action.payload;
      });
  },
});

// Exportamos las acciones generadas por createSlice
export const {
  actualizarEstadoConfirmacionReserva,
  agregarReserva,
  eliminarReserva,
  setearReservas,
  actualizarModulosReservaLocalmente, // <-- EXPORTAR NUEVA ACCIÓN
  procesarActualizacionReservaSocket, // <-- EXPORTAR NUEVA ACCIÓN
} = reservasSlice.actions;

// Exportamos el reducer
export default reservasSlice.reducer;
