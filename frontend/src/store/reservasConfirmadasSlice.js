import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchMisReservasConfirmadas } from '../services/reservaService';

export const cargarReservasConfirmadas = createAsyncThunk(
  'reservasConfirmadas/cargar',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMisReservasConfirmadas();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  lista: [],
  estadoCarga: 'idle',
  error: null,
};

const reservasConfirmadasSlice = createSlice({
  name: 'reservasConfirmadas',
  initialState,
  reducers: {
    limpiarReservasConfirmadas: (state) => {
      state.lista = [];
      state.estadoCarga = 'idle';
      state.error = null;
    },
    // --- ACCIÓN NUEVA PARA ACTUALIZACIONES DE SOCKET ---
    // Este reducer se encargará de mantener actualizada la lista de reservas confirmadas.
    procesarActualizacionReservaConfirmada: (state, action) => {
      const reservaActualizada = action.payload;
      const indice = state.lista.findIndex(
        (r) => r.ID_RESERVA === reservaActualizada.ID_RESERVA
      );

      // Esta slice solo se preocupa de reservas CONFIRMADAS.
      if (reservaActualizada.ESTADO_CONFIRMACION_DOCENTE === 'CONFIRMADO') {
        if (indice !== -1) {
          // Si ya existe en la lista (poco probable, pero seguro), la actualiza.
          state.lista[indice] = {
            ...state.lista[indice],
            ...reservaActualizada,
          };
        } else {
          // Si no existe y está confirmada, LA AÑADE. Este es el caso clave.
          state.lista.push(reservaActualizada);
        }
      } else {
        // Si la actualización cambia el estado a algo que NO es CONFIRMADO
        // (ej. se descarta), la eliminamos de esta lista.
        if (indice !== -1) {
          state.lista.splice(indice, 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cargarReservasConfirmadas.pending, (state) => {
        state.estadoCarga = 'loading';
        state.error = null;
      })
      .addCase(cargarReservasConfirmadas.fulfilled, (state, action) => {
        state.estadoCarga = 'succeeded';
        state.lista = action.payload;
      })
      .addCase(cargarReservasConfirmadas.rejected, (state, action) => {
        state.estadoCarga = 'failed';
        state.error = action.payload;
      });
  },
});

// Exportamos la nueva acción junto con las existentes
export const {
  limpiarReservasConfirmadas,
  procesarActualizacionReservaConfirmada,
} = reservasConfirmadasSlice.actions;
export default reservasConfirmadasSlice.reducer;
