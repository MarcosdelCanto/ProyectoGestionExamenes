import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initDB } from './db.js';
import moduloRoutes from './routes/modulo.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import salaRoutes from './routes/sala.routes.js';
import sedeRoutes from './routes/sede.routes.js';
import edificioRoutes from './routes/edificio.routes.js';
import carreraRoutes from './routes/carrera.routes.js';
import seccionRoutes from './routes/seccion.routes.js';
import asignaturaRoutes from './routes/asignatura.routes.js';
import escuelaRoutes from './routes/escuela.routes.js';
import examenRoutes from './routes/examen.routes.js';
import estadoRoutes from './routes/estado.routes.js';
import jornadaRoutes from './routes/jornada.routes.js';
import moduloUsuariosRoutes from './routes/moduloUsuarios.routes.js';
import cargaRoutes from './routes/carga.routes.js';
import cargaAlumnoRoutes from './routes/cargaAlumno.routes.js';
import cargaDocenteRoutes from './routes/cargaDocente.routes.js'; // Nueva importación
import rolesRouter from './routes/rol.routes.js';

const app = express();

app.use(cors());
//app.use(express.json());
// Aumentamos el límite para aceptar payloads de hasta 50MB (puedes ajustar este valor)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ruta de prueba
app.get('/', (req, res) => res.send('API funcionando 🚀'));

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
        io.emit('status-update', {
          status: currentStatus,
          updaterId: socket.id,
        });
      });
    });

    // Rutas API
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/usuarios', userRoutes);
    app.use('/api/modulo', moduloRoutes);
    app.use('/api/sala', salaRoutes);
    app.use('/api/sede', sedeRoutes);
    app.use('/api/edificio', edificioRoutes);
    app.use('/api/carrera', carreraRoutes);
    app.use('/api/seccion', seccionRoutes);
    app.use('/api/asignatura', asignaturaRoutes);
    app.use('/api/escuela', escuelaRoutes);
    app.use('/api/examen', examenRoutes);
    app.use('/api/jornada', jornadaRoutes);
    app.use('/api/estado', estadoRoutes);
    app.use('/api/moduloUsuarios', moduloUsuariosRoutes);
    app.use('/api/carga', cargaRoutes);
    app.use('/api/roles', rolesRouter);
    app.use('/api/cargaAlumno', cargaAlumnoRoutes);
    app.use('/api/cargaDocente', cargaDocenteRoutes); // Nuevas rutas

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
