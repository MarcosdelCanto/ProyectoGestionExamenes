import { createSlice } from '@reduxjs/toolkit';

const statusSlice = createSlice({
  name: 'status',
  initialState: 'available', //'available', | 'pending' | 'confirmed'
  reducers: {
    //se usa cuando llega un update del servidor
    statusUpdate: (_, action) => action.payload,
    // accion local que dispara el middleware
    changeStatus: (_, action) => action.payload,
  },
});
export const { statusUpdate, changeStatus } = statusSlice.actions;
export default statusSlice.reducer;
