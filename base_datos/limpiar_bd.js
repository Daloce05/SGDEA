/**
 * Script de limpieza: Drops todas las tablas
 * 
 * ADVERTENCIA: Esto elimina TODOS los datos del sistema
 * Úsalo solo en desarrollo/pruebas
 */

require('dotenv').config();
const { pool } = require('../config/postgresqlTRD');
const logger = require('../config/logger');

async function limpiarBaseDatos() {
  try {
    logger.info('========================================');
    logger.info('⚠️  ELIMINANDO TODAS LAS TABLAS...');
    logger.info('========================================');

    const tablas = [
      'documento_categoria',
      'documentos_compartidos',
      'historial_acceso',
      'documentos',
      'categorias_documentos',
      'tipos_documentos',
      'auditoria',
      'usuarios'
    ];

    for (const tabla of tablas) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${tabla} CASCADE`);
        logger.info(`✓ Tabla ${tabla} eliminada`);
      } catch (error) {
        logger.warn(`Advertencia al eliminar ${tabla}: ${error.message}`);
      }
    }

    logger.info('========================================');
    logger.info('✓ Base de datos limpiada');
    logger.info('========================================');

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (require.main === module) {
  limpiarBaseDatos().catch(err => {
    logger.error(`Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { limpiarBaseDatos };
