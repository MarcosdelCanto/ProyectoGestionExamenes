// frontend/src/store/socketMiddleware.js
import { io } from 'socket.io-client';
import { statusUpdated, changeStatus } from './statusSlice';

export const socket = io('http://localhost:3000', { autoConnect: false });

export const socketMiddleware = (storeAPI) => {
  socket.on('status-update', (firstArg, secondArg) => {
    let status, updaterId;
    if (typeof firstArg === 'object' && firstArg !== null) {
      ({ status, updaterId } = firstArg);
    } else {
      status = firstArg;
      updaterId = secondArg;
    }
    storeAPI.dispatch(statusUpdated({ newStatus: status, updaterId }));
  });

  socket.connect();

  return (next) => (action) => {
    if (action.type === changeStatus.type) {
      socket.emit('change-status', action.payload);
    }
    return next(action);
  };
};
