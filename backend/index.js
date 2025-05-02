import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initDB } from './db.js';
import moduloRoutes from './routes/modulo.routes.js';
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
    let currentStatus = 'disponible';
    let currentUpdaterId = null;

    io.on('connection', (socket) => {
      socket.emit('status-update', {
        status: currentStatus,
        updaterId: currentUpdaterId,
      });

      socket.on('change-status', (newStatus) => {
        currentStatus = newStatus;
        currentUpdaterId = socket.id;
        // 3️⃣ Reenviarlo a TODOS
        io.emit('status-update', {
          status: currentStatus,
          updaterId: socket.id,
        });
      });
    });
    //middlewares
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/modulo', moduloRoutes);

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
