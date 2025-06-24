import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initDB, getConnection } from './db.js'; // Importar getConnection
import oracledb from 'oracledb'; // Importar oracledb

// Importar los controladores y rutas
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
import calendarioRoutes from './routes/calendario.routes.js';
import usuarioCarreraRoutes from './routes/usuarioCarrera.routes.js';
import usuarioSeccionRoutes from './routes/usuarioSeccion.routes.js';
import permisosRoutes from './routes/permiso.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import publicRoutes from './routes/public.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.get('/', (req, res) => res.send('API funcionando 🚀'));

// --- Función Auxiliar para emitir reservas actualizadas ---
// La movemos aquí para que sea accesible por los listeners del socket
const emitReservaActualizada = async (io, reservaIdNum) => {
  let conn;
  try {
    conn = await getConnection();
    const sql = `
          SELECT r.*, e.NOMBRE_EXAMEN, a.NOMBRE_ASIGNATURA, s.NOMBRE_SALA, est.NOMBRE_ESTADO AS ESTADO_RESERVA
          FROM RESERVA r
          JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
          JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
          JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
          JOIN SECCION sec ON e.SECCION_ID_SECCION = sec.ID_SECCION
          JOIN ASIGNATURA a ON sec.ASIGNATURA_ID_ASIGNATURA = a.ID_ASIGNATURA
          WHERE r.ID_RESERVA = :id
        `;
    const result = await conn.execute(
      sql,
      { id: reservaIdNum },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length > 0) {
      const reserva = result.rows[0];
      const modulosResult = await conn.execute(
        `SELECT m.ID_MODULO, m.ORDEN FROM RESERVAMODULO rm JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO WHERE rm.RESERVA_ID_RESERVA = :id ORDER BY m.ORDEN`,
        { id: reservaIdNum },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      reserva.MODULOS = modulosResult.rows;
      io.emit('reservaActualizadaDesdeServidor', reserva);
      console.log(
        `[Socket.IO] Evento 'reservaActualizadaDesdeServidor' emitido para reserva #${reservaIdNum}.`
      );
    }
  } catch (err) {
    console.error(
      `[Socket.IO] Error al obtener y emitir reserva actualizada #${reservaIdNum}:`,
      err
    );
  } finally {
    if (conn) await conn.close();
  }
};

async function startServer() {
  try {
    await initDB();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      // ... otros listeners ...

      socket.on('cambioModulosTemporalClienteAlServidor', async (data) => {
        const { id_reserva, nuevaCantidadModulos } = data;
        let conn;
        try {
          conn = await getConnection();
          const primerModuloResult = await conn.execute(
            `SELECT MIN(m.ORDEN) AS ORDEN_INICIAL FROM RESERVAMODULO rm JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO WHERE rm.RESERVA_ID_RESERVA = :id_reserva`,
            { id_reserva },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (!primerModuloResult.rows[0]?.ORDEN_INICIAL)
            throw new Error('No se pudo determinar el módulo inicial.');
          const ordenInicial = primerModuloResult.rows[0].ORDEN_INICIAL;

          const nuevosModulosResult = await conn.execute(
            `SELECT ID_MODULO FROM MODULO WHERE ORDEN >= :ordenInicial AND ORDEN < :ordenFinal ORDER BY ORDEN`,
            { ordenInicial, ordenFinal: ordenInicial + nuevaCantidadModulos },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (nuevosModulosResult.rows.length !== nuevaCantidadModulos)
            throw new Error('No hay suficientes módulos consecutivos.');

          const nuevosModulosIds = nuevosModulosResult.rows.map(
            (m) => m.ID_MODULO
          );

          await conn.execute(
            `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :id_reserva`,
            { id_reserva }
          );
          await conn.executeMany(
            `INSERT INTO RESERVAMODULO (MODULO_ID_MODULO, RESERVA_ID_RESERVA) VALUES (:1, :2)`,
            nuevosModulosIds.map((modId) => [modId, id_reserva])
          );
          await conn.execute(
            `UPDATE EXAMEN SET CANTIDAD_MODULOS_EXAMEN = :cantidad WHERE ID_EXAMEN = (SELECT EXAMEN_ID_EXAMEN FROM RESERVA WHERE ID_RESERVA = :id_reserva)`,
            { cantidad: nuevaCantidadModulos, id_reserva }
          );

          await conn.commit();

          await emitReservaActualizada(io, id_reserva);
        } catch (err) {
          console.error(
            `[Socket] Error actualizando módulos para reserva #${id_reserva}:`,
            err
          );
          if (conn) await conn.rollback();
        } finally {
          if (conn) await conn.close();
        }
      });

      // --- NUEVO LISTENER PARA CANCELAR RESERVA ---
      socket.on('cancelarReservaClienteServidor', async (data) => {
        const { id_reserva } = data;
        let conn;
        try {
          conn = await getConnection();
          // Lógica de negocio para cancelar la reserva (moverla del controlador aquí)
          const examenResult = await conn.execute(
            `SELECT EXAMEN_ID_EXAMEN FROM RESERVA WHERE ID_RESERVA = :id_reserva`,
            { id_reserva },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (examenResult.rows.length === 0)
            throw new Error('Reserva no encontrada para cancelar.');

          const examenId = examenResult.rows[0].EXAMEN_ID_EXAMEN;
          const estadoActivoResult = await conn.execute(
            `SELECT ID_ESTADO FROM ESTADO WHERE NOMBRE_ESTADO = 'ACTIVO'`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          const idEstadoActivo = estadoActivoResult.rows[0]?.ID_ESTADO;
          if (!idEstadoActivo)
            throw new Error("Estado 'ACTIVO' no configurado.");

          await conn.execute(
            `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :id_reserva`,
            { id_reserva }
          );
          await conn.execute(
            `DELETE FROM RESERVA_DOCENTES WHERE RESERVA_ID_RESERVA = :id_reserva`,
            { id_reserva }
          );
          await conn.execute(
            `DELETE FROM RESERVA WHERE ID_RESERVA = :id_reserva`,
            { id_reserva }
          );
          await conn.execute(
            `UPDATE EXAMEN SET ESTADO_ID_ESTADO = :idEstadoActivo WHERE ID_EXAMEN = :examenId`,
            { idEstadoActivo, examenId }
          );

          await conn.commit();

          // Notificar a todos los clientes que la reserva fue eliminada
          io.emit('reservaEliminadaDesdeServidor', { id_reserva });
          console.log(
            `[Socket.IO] Evento 'reservaEliminadaDesdeServidor' emitido para reserva #${id_reserva}.`
          );
        } catch (err) {
          console.error(
            `[Socket] Error cancelando reserva #${id_reserva}:`,
            err
          );
          if (conn) await conn.rollback();
        } finally {
          if (conn) await conn.close();
        }
      });
    });

    // --- RUTAS API ---
    app.use('/api/auth', authRoutes);
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
    app.use('/api/usuario-carreras', usuarioCarreraRoutes);
    app.use('/api/usuario-secciones', usuarioSeccionRoutes);
    app.use('/api/permisos', permisosRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api', calendarioRoutes);
    app.use('/api/reserva', reservaRoutes);
    app.use('/api/reports', reportsRoutes);
    app.use('/api/public', publicRoutes);

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
