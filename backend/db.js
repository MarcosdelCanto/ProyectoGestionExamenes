// db.js
import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();

let pool;

try {
  oracledb.initOracleClient({ configDir: process.env.TNS_ADMIN });
} catch (err) {
  console.warn('Ignore si no usas Oracle Client:', err);
}

// Para que los resultados vengan como objetos JS
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Función para inicializar el pool al arrancar la app
export async function initDB() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTSTRING,
      poolMin: +process.env.DB_POOL_MIN,
      poolMax: +process.env.DB_POOL_MAX,
      poolIncrement: +process.env.DB_POOL_INCREMENT,
    });
    console.log('✅ Pool de conexiones Oracle creado');
  } catch (err) {
    console.error('❌ Error creando pool Oracle:', err);
    throw err;
  }
}

// Función para obtener una conexión del pool
export async function getConnection() {
  if (!pool) {
    throw new Error(
      'El pool de Oracle no está inicializado. Llama primero a initDB().'
    );
  }
  return await pool.getConnection();
}

// Opcional: cerrar pool al terminar la app
export async function closePool() {
  if (pool) {
    await pool.close(10); // espera hasta 10s a que terminen las conexiones
    console.log('Pool Oracle cerrado');
  }
}
