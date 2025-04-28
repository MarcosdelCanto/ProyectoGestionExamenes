import { io } from 'socket.io-client';
import { statusUpdate } from './statusSlice';

const socket = io('http://localhost:3000', { autoConnect: false });

export const socketMiddleware = (storeAPI) => {
  socket.on('connect', () => console.log('🔗 Socket conectado:', socket.id));
  socket.on('statusUpdate', (newStatus) => {
    console.log('📶 status-update recibido en middleware:', newStatus);
    storeAPI.dispatch(statusUpdate(newStatus));
  });

  // socket.connect();

  return (next) => (action) => {
    if (action.type === 'status/changeStatus') {
      socket.emit('changeStatus', action.payload);
    }
    return next(action);
  };
};
