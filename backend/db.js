// backend/db.js
import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path'; // <-- Importante: Importar el módulo 'path' de Node.js
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // Asegura leer el .env de la raíz

// --- Lógica para determinar el modo de conexión ---
const isRunningInDocker = !!process.env.DOCKER_ENV;
const useWallet = process.env.DB_USE_WALLET === 'true';

// __dirname no existe en módulos ES, así que lo calculamos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Si estamos en Docker, usamos la ruta del contenedor. Si no, la ruta local en tu Mac.
const walletPath = isRunningInDocker
  ? process.env.TNS_ADMIN
  : path.join(__dirname, 'wallet');

console.log(
  `[DB] Entorno detectado. Modo wallet: ${useWallet}. Connect string: ${process.env.DB_CONNECTSTRING}`
);

let pool;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function initDB() {
  try {
    console.log(
      `Intentando conectar con DB_USER: "${process.env.DB_USER}" y DB_CONNECTSTRING: "${process.env.DB_CONNECTSTRING}"`
    );

    const poolConfig = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTSTRING,
      poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 2,
    };

    // Solo agregar wallet si estamos en modo cloud
    if (useWallet) {
      poolConfig.walletLocation = walletPath;
      poolConfig.walletPassword = process.env.WALLET_PASSWORD;
    }

    pool = await oracledb.createPool(poolConfig);
    console.log(
      `✅ Pool de conexiones Oracle creado (${useWallet ? 'Wallet/Cloud' : 'Local'})`
    );
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
