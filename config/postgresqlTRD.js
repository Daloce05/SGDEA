/**
 * Configuración de PostgreSQL para el módulo TRD
 * 
 * Establecer conexión con pool de conexiones a PostgreSQL
 */

require('dotenv').config();
const { Pool } = require('pg');

/**
 * Pool de conexiones a PostgreSQL
 * @type {Pool}
 */
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'sgdea_trd',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Prueba la conexión a PostgreSQL
 * @async
 * @returns {Promise<void>}
 */
async function probarConexionPostgres() {
  try {
    const conexion = await pool.connect();
    console.log('✓ Conexión a PostgreSQL establecida correctamente');
    conexion.release();
  } catch (error) {
    console.error('✗ Error al conectar a PostgreSQL:', error.message);
    process.exit(1);
  }
}

/**
 * Manejo de errores de pool
 */
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = {
  pool,
  probarConexionPostgres,
  query: (text, params) => pool.query(text, params)
};
