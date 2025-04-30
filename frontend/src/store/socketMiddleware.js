// frontend/src/store/socketMiddleware.js
import { io } from 'socket.io-client';
import { statusUpdated, changeStatus } from './statusSlice';

export const socket = io('http://localhost:3000', { autoConnect: false });

export const socketMiddleware = (storeAPI) => {
  socket.on('status-update', (firstArg, secondArg) => {
    // 1) Si el servidor mandó un objeto:
    let status, updaterId;
    if (typeof firstArg === 'object' && firstArg !== null) {
      ({ status, updaterId } = firstArg);
    } else {
      // 2) Si mandó string + undefined:
      status = firstArg;
      updaterId = secondArg;
    }

    console.log('📶 [MW] status-update recibido:', status, updaterId);
    storeAPI.dispatch(statusUpdated({ newStatus: status, updaterId }));
  });

  socket.connect();

  return (next) => (action) => {
    if (action.type === changeStatus.type) {
      console.log('🔥 [MW] Emisión change-status:', action.payload);
      socket.emit('change-status', action.payload);
    }
    return next(action);
  };
};
