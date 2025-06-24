import { io } from 'socket.io-client';
import { statusUpdated, changeStatus } from './statusSlice';

// --- IMPORTACIONES DE ACCIONES ---
// Importamos todas las acciones necesarias de sus respectivas slices.
import {
  procesarActualizacionReservaSocket,
  eliminarReserva,
  actualizarModulosReservaLocalmente, // Necesaria para el calendario de planificación
} from './reservasSlice';

import {
  procesarActualizacionReservaConfirmada,
  // Si reservasConfirmadasSlice también necesita manejar eliminaciones, se añadiría aquí.
} from './reservasConfirmadasSlice';

// La URL del socket se obtiene de las variables de entorno de Vite.
// En desarrollo, el proxy de vite.config.js redirigirá esto a tu backend.
export const socket = io({ autoConnect: false });

export const socketMiddleware = (storeAPI) => {
  // Listener para el estado de la conexión (ejemplo, no crucial para las reservas)
  socket.on('status-update', (data) => {
    storeAPI.dispatch(
      statusUpdated({ newStatus: data.status, updaterId: data.updaterId })
    );
  });

  // Listener para cuando una reserva se CREA o se ACTUALIZA (ej. cambio de estado, módulos, etc.)
  socket.on('reservaActualizadaDesdeServidor', (reservaActualizada) => {
    console.log(
      '[SocketMiddleware] Evento de reserva actualizada recibido:',
      reservaActualizada
    );

    // Despachamos a AMBAS slices. Cada una decidirá qué hacer con la información.
    storeAPI.dispatch(procesarActualizacionReservaSocket(reservaActualizada)); // Para la slice del calendario de planificación
    storeAPI.dispatch(
      procesarActualizacionReservaConfirmada(reservaActualizada)
    ); // Para la slice del calendario del Home (confirmadas)
  });

  // Listener para cuando una reserva es ELIMINADA o CANCELADA
  socket.on('reservaEliminadaDesdeServidor', (data) => {
    const { id_reserva } = data;
    console.log(
      `[SocketMiddleware] Evento 'reservaEliminadaDesdeServidor' RECIBIDO para ID: ${id_reserva}`
    );
    if (id_reserva) {
      // Despachamos la acción de eliminar a la slice principal.
      // Si la otra slice también necesita saberlo, se añadiría aquí.
      storeAPI.dispatch(eliminarReserva(id_reserva));
    }
  });

  // Listener para actualizaciones temporales de módulos (usado en el calendario de planificación)
  socket.on('actualizacionModulosTemporalServidorAClientes', (data) => {
    const { id_reserva, nuevaCantidadModulos } = data;
    console.log(
      `[SocketMiddleware] Evento de módulos temporales recibido para reserva #${id_reserva}`
    );
    storeAPI.dispatch(
      actualizarModulosReservaLocalmente({ id_reserva, nuevaCantidadModulos })
    );
  });

  // Conectar el socket después de definir todos los listeners
  socket.connect();

  return (next) => (action) => {
    // Middleware para emitir eventos desde el cliente al servidor
    if (action.type === changeStatus.type) {
      socket.emit('change-status', action.payload);
    }

    // Si tuvieras otras acciones que necesiten emitir eventos, irían aquí.
    // Ejemplo:
    // if (action.type === 'reservas/cancelarReserva') {
    //   socket.emit('cancelarReservaClienteServidor', action.payload);
    // }

    return next(action);
  };
};
