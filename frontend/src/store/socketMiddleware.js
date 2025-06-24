// frontend/src/store/socketMiddleware.js
import { io } from 'socket.io-client';
import { statusUpdated, changeStatus } from './statusSlice';
import { procesarActualizacionReservaSocket } from './reservasSlice';
// --- 1. IMPORTAR LA NUEVA ACCIÓN DE LA OTRA SLICE ---
import { procesarActualizacionReservaConfirmada } from './reservasConfirmadasSlice';

export const socket = io({ autoConnect: false });

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

  // --- 2. MODIFICAR ESTE LISTENER ---
  socket.on('reservaActualizadaDesdeServidor', (reservaActualizada) => {
    console.log(
      '[SocketMiddleware] Evento de reserva actualizada recibido:',
      reservaActualizada
    );

    // Despachamos la actualización a AMBAS slices. Cada una sabrá qué hacer.
    storeAPI.dispatch(procesarActualizacionReservaSocket(reservaActualizada)); // Para el calendario de planificación
    storeAPI.dispatch(
      procesarActualizacionReservaConfirmada(reservaActualizada)
    ); // Para el calendario del Home
  });

  socket.on('actualizacionModulosTemporalServidorAClientes', (data) => {
    const { id_reserva, nuevaCantidadModulos } = data;
    // Esta acción parece pertenecer solo a la slice de planificación. Lo mantenemos como está.
    storeAPI.dispatch(
      actualizarModulosReservaLocalmente({ id_reserva, nuevaCantidadModulos })
    );
  });

  socket.connect();

  return (next) => (action) => {
    if (action.type === changeStatus.type) {
      socket.emit('change-status', action.payload);
    }
    return next(action);
  };
};
