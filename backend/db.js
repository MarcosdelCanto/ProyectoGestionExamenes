// backend/db.js
import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path'; // <-- Importante: Importar el módulo 'path' de Node.js
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // Asegura leer el .env de la raíz

// --- Lógica para determinar la ubicación de la wallet ---
const isRunningInDocker = !!process.env.DOCKER_ENV;

// __dirname no existe en módulos ES, así que lo calculamos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Si estamos en Docker, usamos la ruta del contenedor. Si no, la ruta local en tu Mac.
const walletPath = isRunningInDocker
  ? process.env.TNS_ADMIN
  : path.join(__dirname, 'wallet');

console.log(`[DB] Entorno detectado. Usando wallet en: ${walletPath}`);

let pool;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function initDB() {
  try {
    console.log(
      `Intentando conectar con DB_USER: "${process.env.DB_USER}" y DB_CONNECTSTRING: "${process.env.DB_CONNECTSTRING}"`
    );

    // En modo Thin, es mejor pasar 'walletLocation' y 'walletPassword' directamente al pool
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTSTRING,
      walletLocation: walletPath, // <-- Usamos la ruta dinámica que calculamos
      walletPassword: process.env.WALLET_PASSWORD,
      poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 2,
    });
    console.log('✅ Pool de conexiones Oracle creado (Modo Thin)');
  } catch (err) {
    console.error('❌ Error creando pool Oracle (Modo Thin):', err);
    throw err;
  }
}

export async function getConnection() {
  if (!pool) {
    throw new Error(
      'El pool de Oracle no está inicializado. Llama primero a initDB().'
    );
  }
  return await pool.getConnection();
}

export async function closePool() {
  if (pool) {
    await pool.close(10);
    console.log('Pool Oracle cerrado');
  }
}
