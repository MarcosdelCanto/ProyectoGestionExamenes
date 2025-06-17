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
    // Nueva acción para procesar actualizaciones desde WebSockets
    procesarActualizacionReservaSocket: (state, action) => {
      const reservaActualizada = action.payload;
      // Reestructurar para anidar el objeto Examen
      // Asumimos que el payload del socket tiene los campos del examen en el nivel superior
      const reservaConExamenAnidado = {
        ...reservaActualizada, // Mantiene todos los campos de la reserva
        Examen: {
          ID_EXAMEN: reservaActualizada.ID_EXAMEN,
          NOMBRE_EXAMEN: reservaActualizada.NOMBRE_EXAMEN,
          CANTIDAD_MODULOS_EXAMEN: reservaActualizada.CANTIDAD_MODULOS_EXAMEN,
          NOMBRE_ASIGNATURA: reservaActualizada.NOMBRE_ASIGNATURA,
        },
      };

      const indice = state.lista.findIndex(
        (r) => r.ID_RESERVA === reservaConExamenAnidado.ID_RESERVA
      );
      if (indice !== -1) {
        // Reemplazar la reserva existente con la actualizada del socket
        state.lista[indice] = reservaConExamenAnidado;
        console.log(
          `[reservasSlice] Reserva ${reservaActualizada.ID_RESERVA} actualizada desde socket.`
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
  procesarActualizacionReservaSocket, // <-- EXPORTAR NUEVA ACCIÓN
} = reservasSlice.actions;

// Exportamos el reducer
export default reservasSlice.reducer;
