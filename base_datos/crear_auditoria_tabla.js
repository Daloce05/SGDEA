/**
 * Script de migración: Extender tabla de auditoría
 * 
 * Modifica la tabla de auditoría para asegurar que tenga todas las columnas requeridas
 * También agrega campos a usuarios si no existen
 * Ejecutar: node base_datos/crear_auditoria_tabla.js
 */

require('dotenv').config();
const { pool } = require('../config/postgresqlTRD');
const logger = require('../config/logger');

async function actualizarTablaAuditoria() {
  try {
    logger.info('========================================');
    logger.info('Verificando y actualizando tabla auditoria...');
    logger.info('========================================');

    // Verificar y agregar columnas a la tabla auditoria si no existen
    const columnasRequeridas = [
      { nombre: 'usuario_nombre', tipo: 'VARCHAR(100)' },
      { nombre: 'modulo', tipo: 'VARCHAR(50)' },
      { nombre: 'descripcion', tipo: 'TEXT' },
      { nombre: 'detalles_anteriores', tipo: 'JSONB' },
      { nombre: 'detalles_nuevos', tipo: 'JSONB' },
      { nombre: 'ip_address', tipo: 'VARCHAR(50)' },
      { nombre: 'estado', tipo: 'VARCHAR(20) DEFAULT \'completada\'' }
    ];

    for (const columna of columnasRequeridas) {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='auditoria' AND column_name='${columna.nombre}'
      `);

      if (checkColumn.rows.length === 0) {
        try {
          await pool.query(`
            ALTER TABLE auditoria ADD COLUMN ${columna.nombre} ${columna.tipo}
          `);
          logger.info(`✓ Columna ${columna.nombre} agregada a tabla auditoria`);
        } catch (error) {
          if (error.code === '42701') { // Column already exists
            logger.info(`✓ Columna ${columna.nombre} ya existe`);
          } else {
            throw error;
          }
        }
      }
    }

    // Crear índices si no existen
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_modulo ON auditoria(modulo)`);
      logger.info('✓ Índices en tabla auditoria verificados/creados');
    } catch (error) {
      logger.warn(`Advertencia al crear índices: ${error.message}`);
    }

    // Verificar y agregar campo 'ultimo_acceso' a usuarios si no existe
    const checkUltimoAcceso = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='usuarios' AND column_name='ultimo_acceso'
    `);

    if (checkUltimoAcceso.rows.length === 0) {
      try {
        await pool.query(`
          ALTER TABLE usuarios ADD COLUMN ultimo_acceso TIMESTAMP
        `);
        logger.info('✓ Campo ultimo_acceso agregado a tabla usuarios');
      } catch (error) {
        if (error.code !== '42701') {
          throw error;
        }
      }
    }

    // Verificar y agregar campo 'intentos_login_fallidos'
    const checkLoginAttempts = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='usuarios' AND column_name='intentos_login_fallidos'
    `);

    if (checkLoginAttempts.rows.length === 0) {
      try {
        await pool.query(`
          ALTER TABLE usuarios ADD COLUMN intentos_login_fallidos INTEGER DEFAULT 0
        `);
        logger.info('✓ Campo intentos_login_fallidos agregado a tabla usuarios');
      } catch (error) {
        if (error.code !== '42701') {
          throw error;
        }
      }
    }

    logger.info('========================================');
    logger.info('✓ Migración de auditoría completada correctamente');
    logger.info('========================================');

  } catch (error) {
    logger.error(`Error en migración: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (require.main === module) {
  actualizarTablaAuditoria().catch(err => {
    logger.error(`Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { actualizarTablaAuditoria };
