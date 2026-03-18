/**
 * Configuración de la conexión a la base de datos MySQL
 * 
 * Este módulo establece la conexión con MySQL usando mysql2/promise
 * Proporciona un pool de conexiones para optimizar el rendimiento
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Crea un pool de conexiones a la base de datos
 * @type {mysql.Pool}
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USUARIO || 'root',
  password: process.env.DB_CONTRASEÑA || '',
  database: process.env.DB_NOMBRE || 'sgdea',
  port: process.env.DB_PUERTO || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

/**
 * Prueba la conexión a la base de datos
 * @async
 * @returns {Promise<void>}
 */
async function probarConexion() {
  try {
    const conexion = await pool.getConnection();
    console.log('✓ Conexión a la base de datos establecida correctamente');
    conexion.release();
  } catch (error) {
    console.error('✗ Error al conectar a la base de datos:', error.message);
    process.exit(1);
  }
}

module.exports = {
  pool,
  probarConexion
};
