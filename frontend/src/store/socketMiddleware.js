// frontend/src/store/socketMiddleware.js
import { io } from 'socket.io-client';
import { statusUpdated, changeStatus } from './statusSlice';
import {
  procesarActualizacionReservaSocket,
  actualizarModulosReservaLocalmente, // Reutilizaremos esta acción
} from './reservasSlice';

// La URL del socket vendrá de la variable de entorno de Vite, sin el '/api' final.
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

  // Nuevo listener para actualizaciones de reservas desde el servidor
  socket.on('reservaActualizadaDesdeServidor', (reservaActualizada) => {
    console.log(
      '[socketMiddleware] Evento "reservaActualizadaDesdeServidor" RECIBIDO. Datos:',
      JSON.stringify(reservaActualizada, null, 2)
    );
    storeAPI.dispatch(procesarActualizacionReservaSocket(reservaActualizada));
    console.log('[SocketMiddleware] Reserva recibida:', reservaActualizada);
  });

  // Nuevo listener para actualizaciones temporales de módulos desde el servidor
  socket.on('actualizacionModulosTemporalServidorAClientes', (data) => {
    const { id_reserva, nuevaCantidadModulos } = data;
    // Verificar que el cliente actual no sea el que originó el cambio
    // (Aunque el servidor usa socket.broadcast, esta es una doble seguridad opcional
    // si se quisiera emitir a todos incluyendo el sender desde el server por alguna razón)
    // if (socket.id !== data.originSocketId) { // Necesitarías que el server envíe originSocketId
    console.log(
      `[socketMiddleware] Evento 'actualizacionModulosTemporalServidorAClientes' RECIBIDO. Reserva ID: ${id_reserva}, Nueva Cantidad: ${nuevaCantidadModulos}`
    );
    storeAPI.dispatch(
      actualizarModulosReservaLocalmente({ id_reserva, nuevaCantidadModulos })
    );
    // }
  });

  socket.connect();

  return (next) => (action) => {
    if (action.type === changeStatus.type) {
      socket.emit('change-status', action.payload);
    }
    return next(action);
  };
};
