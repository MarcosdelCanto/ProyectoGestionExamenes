import { createSlice } from '@reduxjs/toolkit';

const statusSlice = createSlice({
  name: 'status',
  initialState: 'available',
  reducers: {
    statusUpdated: (_, action) => action.payload, // usado por Socket.IO
    changeStatus: (_, action) => action.payload, // despachado por UI
  },
});

export const { statusUpdated, changeStatus } = statusSlice.actions;
export default statusSlice.reducer;
