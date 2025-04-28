// frontend/src/store/socketMiddleware.js
import { io } from 'socket.io-client';
import { statusUpdated } from './statusSlice';

const socket = io('http://localhost:3000', { autoConnect: false });

export const socketMiddleware = (storeAPI) => {
  // 1) Suscripciones antes de conectar
  socket.on('connect', () =>
    console.log('🔗 [MW] Socket conectado:', socket.id)
  );
  socket.on('status-update', (newStatus) => {
    console.log('📶 [MW] status-update recibido:', newStatus);
    storeAPI.dispatch(statusUpdated(newStatus));
  });

  // 2) Conecta
  socket.connect();

  return (next) => (action) => {
    if (action.type === 'status/changeStatus') {
      console.log('🔥 [MW] Emisión change-status:', action.payload);
      socket.emit('change-status', action.payload);
    }
    return next(action);
  };
};
