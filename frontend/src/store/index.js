// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import statusReducer from './statusSlice';
import { socketMiddleware } from './socketMiddleware';

export const store = configureStore({
  reducer: { status: statusReducer },
  middleware: (getDefault) => getDefault().concat(socketMiddleware),
});

export default store;
