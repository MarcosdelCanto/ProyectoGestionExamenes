// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import statusReducer from './statusSlice';
import reservasReducer from './reservasSlice'; // <-- IMPORTAR NUEVO REDUCER
import { socketMiddleware } from './socketMiddleware';
import reservasConfirmadasReducer from './reservasConfirmadasSlice';

export const store = configureStore({
  reducer: {
    status: statusReducer,
    reservas: reservasReducer, // <-- AÑADIR AL STORE
    reservasConfirmadas: reservasConfirmadasReducer,
  },
  middleware: (getDefault) => getDefault().concat(socketMiddleware),
});

export default store;
