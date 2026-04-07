/**
 * Script de datos de prueba - Cargar usuarios iniciales
 * Ejecutar: node base_datos/datos_prueba_usuarios.js
 */

require('dotenv').config();
const { pool } = require('../config/postgresqlTRD');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

async function cargarDatosPrueba() {
  try {
    logger.info('========================================');
    logger.info('Cargando datos de prueba...');
    logger.info('========================================');

    // Crear usuarios de prueba
    const usuarios = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@sgdea.local',
        username: 'admin',
        contraseña: 'Admin123456',
        rol: 'administrador'
      },
      {
        nombre: 'Juan',
        apellido: 'Cargador',
        email: 'juan@sgdea.local',
        username: 'cargador',
        contraseña: 'Cargador123',
        rol: 'cargador'
      },
      {
        nombre: 'María',
        apellido: 'Consultora',
        email: 'maria@sgdea.local',
        username: 'consultor',
        contraseña: 'Consultor123',
        rol: 'consultor'
      }
    ];

    for (const usuario of usuarios) {
      try {
        // Verificar si el usuario ya existe
        const existe = await pool.query(
          'SELECT id FROM usuarios WHERE email = $1',
          [usuario.email]
        );

        if (existe.rows.length > 0) {
          logger.info(`✓ Usuario ${usuario.username} ya existe`);
          continue;
        }

        // Hashear contraseña
        const contraseñaHash = await bcrypt.hash(usuario.contraseña, 10);

        // Insertar usuario
        await pool.query(
          `INSERT INTO usuarios (nombre, apellido, email, username, contraseña, rol, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [usuario.nombre, usuario.apellido, usuario.email, usuario.username, contraseñaHash, usuario.rol, true]
        );

        logger.info(`✓ Usuario creado: ${usuario.username} (${usuario.rol})`);
      } catch (error) {
        logger.error(`Error al crear usuario ${usuario.username}: ${error.message}`);
      }
    }

    logger.info('========================================');
    logger.info('✓ Datos de prueba cargados');
    logger.info('========================================');
    logger.info('');
    logger.info('Usuarios disponibles para prueba:');
    logger.info('');
    logger.info('👤 ADMINISTRADOR:');
    logger.info('   Usuario: admin');
    logger.info('   Contraseña: Admin123456');
    logger.info('   Email: admin@sgdea.local');
    logger.info('');
    logger.info('📤 CARGADOR:');
    logger.info('   Usuario: cargador');
    logger.info('   Contraseña: Cargador123');
    logger.info('   Email: juan@sgdea.local');
    logger.info('');
    logger.info('👁️  CONSULTOR:');
    logger.info('   Usuario: consultor');
    logger.info('   Contraseña: Consultor123');
    logger.info('   Email: maria@sgdea.local');
    logger.info('');

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (require.main === module) {
  cargarDatosPrueba().catch(err => {
    logger.error(`Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { cargarDatosPrueba };
