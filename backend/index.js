import { initDB } from './db.js';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Middlewares

app.use(express.json());
// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

async function startServer() {
  try {
    await initDB(); // inicializa la conexión
    //middlewares
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();
