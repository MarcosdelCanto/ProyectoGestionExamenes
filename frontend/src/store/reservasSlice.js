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
      // Podrías querer verificar si ya existe para evitar duplicados
      state.lista.push(action.payload);
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
      const { id_reserva, nuevaCantidadModulos } = action.payload;
      console.log(
        '[reservasSlice] actualizarModulosReservaLocalmente - id_reserva RECIBIDO:',
        id_reserva,
        '| state.lista ACTUAL:',
        JSON.parse(JSON.stringify(state.lista))
      );
      const indice = state.lista.findIndex((r) => r.ID_RESERVA === id_reserva);
      if (indice !== -1) {
        // Asumimos que la altura del post-it se basa en Examen.CANTIDAD_MODULOS_EXAMEN
        // o un campo similar. Ajusta esto según tu estructura.
        if (state.lista[indice].Examen) {
          state.lista[indice].Examen.CANTIDAD_MODULOS_EXAMEN =
            nuevaCantidadModulos;
        }
        state.lista[indice].MODULOS_RESERVA_COUNT = nuevaCantidadModulos; // Si tienes un campo así

        // AJUSTE CRÍTICO: Modificar el array MODULOS para que su longitud coincida.
        // Esto es importante para que `reserva.MODULOS.length` en `useCalendarData` sea correcto.
        // Si MODULOS no existe o no es un array, inicialízalo.
        const reservaActual = state.lista[indice];
        if (!Array.isArray(reservaActual.MODULOS)) {
          reservaActual.MODULOS = [];
        }
        const currentModulosArray = reservaActual.MODULOS;

        // Determinar el ORDEN de inicio.
        // Asumimos que la reserva tiene un campo 'moduloInicial' que es el ORDEN del primer módulo.
        // Este campo debe ser consistente y estar presente en el objeto reserva.
        const ordenDeInicio =
          reservaActual.moduloInicial || // Si 'moduloInicial' es el ORDEN del primer módulo
          (currentModulosArray[0] && currentModulosArray[0].ORDEN !== undefined
            ? currentModulosArray[0].ORDEN
            : 1); // Fallback al ORDEN del primer módulo existente o 1

        // Crear un nuevo array con la longitud deseada.
        // Si se expande, se pueden añadir placeholders. Si se reduce, se trunca.
        reservaActual.MODULOS = Array(nuevaCantidadModulos)
          .fill(null)
          .map(
            (_, i) =>
              currentModulosArray[i] || {
                ID_MODULO: `temp-id-${i}`,
                NOMBRE_MODULO: `Módulo Temporal ${i + 1}`,
                ORDEN: ordenDeInicio + i, // Usar el ordenDeInicio calculado
              } // Placeholder con orden si es posible
          );

        console.log(
          `[reservasSlice] Estado de la reserva ${id_reserva} en Redux DESPUÉS de la actualización:`, // Asegúrate que id_reserva esté definido aquí
          JSON.stringify(state.lista[indice], null, 2)
        );
      } else {
        console.error(
          `[reservasSlice] ERROR AL ACTUALIZAR MÓDULOS: No se encontró reserva con ID_RESERVA = ${id_reserva} en state.lista.`
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
