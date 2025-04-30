// src/store/statusSlice.js
import { createSlice } from '@reduxjs/toolkit';

const statusSlice = createSlice({
  name: 'status',
  initialState: {
    status: 'disponible', // estado inicial
    updaterId: null,
  },
  reducers: {
    // ① Acción para sincronizar con el servidor
    statusUpdated: (state, { payload: { newStatus, updaterId } }) => {
      state.status = newStatus;
      state.updaterId = updaterId;
    },
    // ② Acción para iniciar un cambio local (no muta state)
    changeStatus: () => {
      /* no-op */
    },
  },
});

export const { statusUpdated, changeStatus } = statusSlice.actions;
export default statusSlice.reducer;
