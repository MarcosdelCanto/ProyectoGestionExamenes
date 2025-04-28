import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initDB } from './db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => res.send('API funcionando 🚀'));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

async function startServer() {
  try {
    await initDB(); // inicializa la conexión
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: '*' },
    });
    let currentStatus = 'disponible'; // Estado inicial

    io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);
      console.log(`Estado al conectar: ${currentStatus}`);
      socket.emit('status-update', currentStatus);

      socket.on('change-status', (newStatus) => {
        console.log(`${socket.id} cambió a:, ${newStatus}`);
        currentStatus = newStatus;
        console.log('Nuevo estado global:', currentStatus);
        io.emit('status-update', currentStatus);
        console.log('Emitido status-update a todos');
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () =>
      console.log(`🚀 Servidor HTTP+Socket.IO escuchando en puerto ${PORT}`)
    );
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();
