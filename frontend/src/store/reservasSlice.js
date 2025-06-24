import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Asegúrate de que todos los servicios necesarios estén importados
import {
  fetchAllReservas,
  fetchReservaById,
  fetchMisAsignacionesDeReservas,
} from '../services/reservaService';
import { fetchAllModulos } from '../services/moduloService';

// Thunk para cargar los datos del calendario de planificación (reservas del usuario y módulos)
export const cargarDatosParaCalendarios = createAsyncThunk(
  'reservas/cargarDatosParaCalendarios',
  async (_, { rejectWithValue }) => {
    try {
      const [reservasData, modulosData] = await Promise.all([
        fetchMisAsignacionesDeReservas(),
        fetchAllModulos(),
      ]);
      return { reservas: reservasData || [], modulos: modulosData || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk para cargar absolutamente TODAS las reservas (usado por vistas de admin)
export const cargarReservasGlobal = createAsyncThunk(
  'reservas/cargarReservasGlobal',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAllReservas();
      const reservasCompletas = await Promise.all(
        data.map(async (reserva) => {
          try {
            return await fetchReservaById(reserva.ID_RESERVA);
          } catch {
            return reserva;
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
  lista: [],
  modulos: [],
  estadoCarga: 'idle',
  error: null,
};

const reservasSlice = createSlice({
  name: 'reservas',
  initialState,
  reducers: {
    procesarActualizacionReservaSocket: (state, action) => {
      const reservaActualizada = action.payload;
      const indice = state.lista.findIndex(
        (r) => r.ID_RESERVA === reservaActualizada.ID_RESERVA
      );
      if (indice !== -1) {
        state.lista[indice] = { ...state.lista[indice], ...reservaActualizada };
      } else {
        state.lista.push(reservaActualizada);
      }
    },
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
        if (observaciones_docente !== undefined)
          state.lista[indice].OBSERVACIONES_DOCENTE = observaciones_docente;
        if (fecha_confirmacion_docente !== undefined)
          state.lista[indice].FECHA_CONFIRMACION_DOCENTE =
            fecha_confirmacion_docente;
      }
    },
    actualizarModulosReservaLocalmente: (state, action) => {
      const { id_reserva, nuevaCantidadModulos, moduloInicialActual } =
        action.payload;
      const indice = state.lista.findIndex((r) => r.ID_RESERVA === id_reserva);
      if (indice !== -1) {
        const reservaActual = state.lista[indice];
        if (reservaActual.Examen)
          reservaActual.Examen.CANTIDAD_MODULOS_EXAMEN = nuevaCantidadModulos;
        reservaActual.MODULOS_RESERVA_COUNT = nuevaCantidadModulos;
        let moduloInicialOriginal =
          moduloInicialActual ||
          reservaActual.MODULO_INICIAL_RESERVA ||
          reservaActual.MODULOS?.[0]?.ORDEN ||
          1;
        reservaActual.MODULO_INICIAL_RESERVA = moduloInicialOriginal;
        reservaActual.MODULOS = Array.from(
          { length: nuevaCantidadModulos },
          (_, i) => ({
            ID_MODULO: `temp-${id_reserva}-${moduloInicialOriginal + i}`,
            NOMBRE_MODULO: `Módulo ${moduloInicialOriginal + i}`,
            ORDEN: moduloInicialOriginal + i,
            ID_RESERVA: id_reserva,
          })
        );
        reservaActual._lastModified = Date.now();
      }
    },
    agregarReserva: (state, action) => {
      if (
        !state.lista.some((r) => r.ID_RESERVA === action.payload.ID_RESERVA)
      ) {
        state.lista.push(action.payload);
      }
    },
    eliminarReserva: (state, action) => {
      state.lista = state.lista.filter((r) => r.ID_RESERVA !== action.payload);
    },
    setearReservas: (state, action) => {
      state.lista = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducers para cargarDatosParaCalendarios
      .addCase(cargarDatosParaCalendarios.pending, (state) => {
        state.estadoCarga = 'loading';
      })
      .addCase(cargarDatosParaCalendarios.fulfilled, (state, action) => {
        state.estadoCarga = 'succeeded';
        state.lista = action.payload.reservas;
        state.modulos = action.payload.modulos;
      })
      .addCase(cargarDatosParaCalendarios.rejected, (state, action) => {
        state.estadoCarga = 'failed';
        state.error = action.payload;
      })
      // Reducers para cargarReservasGlobal
      .addCase(cargarReservasGlobal.pending, (state) => {
        state.estadoCarga = 'loading';
      })
      .addCase(cargarReservasGlobal.fulfilled, (state, action) => {
        state.estadoCarga = 'succeeded';
        state.lista = action.payload;
      })
      .addCase(cargarReservasGlobal.rejected, (state, action) => {
        state.estadoCarga = 'failed';
        state.error = action.payload;
      });
  },
});

// --- EXPORTACIÓN COMPLETA DE ACCIONES ---
// Se exportan todas las acciones definidas en `reducers` para que estén disponibles en toda la app.
export const {
  procesarActualizacionReservaSocket,
  actualizarModulosReservaLocalmente,
  actualizarEstadoConfirmacionReserva,
  agregarReserva,
  eliminarReserva,
  setearReservas,
} = reservasSlice.actions;

export default reservasSlice.reducer;
