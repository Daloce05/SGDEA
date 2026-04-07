/**
 * Script de verificación: Validar usuarios en BD
 * Ejecutar: node base_datos/verificar_usuarios.js
 */

require('dotenv').config();
const { pool } = require('../config/postgresqlTRD');
const logger = require('../config/logger');

async function verificarUsuarios() {
  try {
    logger.info('========================================');
    logger.info('Verificando usuarios en BD...');
    logger.info('========================================');

    const result = await pool.query(
      'SELECT id, nombre, apellido, email, username, rol, estado FROM usuarios ORDER BY id'
    );

    if (result.rows.length === 0) {
      logger.warn('⚠️  No hay usuarios en la BD');
    } else {
      logger.info(`✓ Total de usuarios: ${result.rows.length}`);
      logger.info('');
      result.rows.forEach((user, index) => {
        logger.info(`${index + 1}. ${user.nombre} ${user.apellido}`);
        logger.info(`   Email: ${user.email}`);
        logger.info(`   Usuario: ${user.username}`);
        logger.info(`   Rol: ${user.rol}`);
        logger.info(`   Estado: ${user.estado ? 'Activo' : 'Inactivo'}`);
        logger.info('');
      });
    }

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
  verificarUsuarios().catch(err => {
    logger.error(`Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { verificarUsuarios };
