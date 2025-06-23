import dotenv from 'dotenv';
dotenv.config();

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
import cargaDocenteRoutes from './routes/cargaDocente.routes.js';
import rolesRouter from './routes/rol.routes.js';
import cargaSalaRoutes from './routes/cargaSala.routes.js';
import calendarioRoutes from './routes/calendario.routes.js'; // Importa las rutas de calendario
import usuarioCarreraRoutes from './routes/usuarioCarrera.routes.js'; // Nueva importación
import usuarioSeccionRoutes from './routes/usuarioSeccion.routes.js'; // Nueva importación
import permisosRoutes from './routes/permiso.routes.js'; // Nueva importación
import dashboardRoutes from './routes/dashboard.routes.js'; // Importar rutas del dashboard
import reservaRoutes from './routes/reserva.routes.js'; // Importar rutas de reserva
import reportsRoutes from './routes/reports.routes.js'; // Importar rutas de reportes
import publicRoutes from './routes/public.routes.js'; // Importar rutas públicas
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Esto está CORRECTO.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
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
    // Configuración de Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });
    let currentStatus = 'disponible';
    let currentUpdaterId = null;

    app.set('io', io); // Hacer 'io' accesible en los request handlers vía req.app.get('io')

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

      // NUEVO: Listener para cambios temporales de módulos desde un cliente
      socket.on('cambioModulosTemporalClienteAlServidor', (data) => {
        const { id_reserva, nuevaCantidadModulos } = data;
        console.log(
          `[Socket Servidor] Evento 'cambioModulosTemporalClienteAlServidor' recibido de ${socket.id}: Reserva ID ${id_reserva}, Nueva Cantidad ${nuevaCantidadModulos}`
        );

        // Re-emitir a TODOS los OTROS clientes.
        // El cliente que originó el cambio ya actualizó su UI localmente.
        socket.broadcast.emit('actualizacionModulosTemporalServidorAClientes', {
          id_reserva,
          nuevaCantidadModulos,
        });
        console.log(
          `[Socket Servidor] Evento 'actualizacionModulosTemporalServidorAClientes' re-emitido a otros clientes.`
        );
      });
    });

    // Rutas API
    app.use('/api/auth', authRoutes);
    //app.use('/api/user', userRoutes);
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
    app.use('/api/cargaDocente', cargaDocenteRoutes);
    app.use('/api/cargaSala', cargaSalaRoutes);
    app.use('/api/usuario-carreras', usuarioCarreraRoutes); // Nueva ruta para usuario-carrera
    app.use('/api/usuario-secciones', usuarioSeccionRoutes); // Nueva ruta para usuario-sección
    app.use('/api/permisos', permisosRoutes);
    app.use('/api/dashboard', dashboardRoutes); // Usar rutas del dashboard
    app.use('/api', calendarioRoutes);
    app.use('/api/reserva', reservaRoutes); // Usar rutas de reserva
    app.use('/api/reports', reportsRoutes); // Asegúrate de que las rutas de reportes estén correctamente definidas
    app.use('/api/public', publicRoutes); // Nuevo prefijo para rutas públicas

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
