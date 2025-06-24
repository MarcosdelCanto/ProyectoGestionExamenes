import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchMisReservasConfirmadas } from '../services/reservaService';

// Thunk asíncrono para cargar las reservas confirmadas del usuario
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
  estadoCarga: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const reservasConfirmadasSlice = createSlice({
  name: 'reservasConfirmadas',
  initialState,
  reducers: {
    // Puedes añadir reducers síncronos aquí en el futuro si los necesitas
    // Por ejemplo, para limpiar el estado al hacer logout.
    limpiarReservasConfirmadas: (state) => {
      state.lista = [];
      state.estadoCarga = 'idle';
      state.error = null;
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

// Exportamos las acciones y el reducer
export const { limpiarReservasConfirmadas } = reservasConfirmadasSlice.actions;
export default reservasConfirmadasSlice.reducer;
