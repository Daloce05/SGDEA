/**
 * Script de inicialización de la base de datos
 * 
 * Crea la estructura de tablas necesarias para el SGDEA en PostgreSQL
 * Ejecutar: node base_datos/inicializar.js
 */

require('dotenv').config();
const { pool } = require('../config/postgresqlTRD');
const logger = require('../config/logger');

/**
 * Crea las tablas de la base de datos
 * @async
 */
async function crearTablas() {
  try {
    logger.info('========================================');
    logger.info('Iniciando creación de tablas PostgreSQL...');
    logger.info('========================================');

    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        username VARCHAR(100),
        contraseña VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'usuario',
        estado BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Tabla usuarios creada');

    // Crear índices para usuarios
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol)`);

    // Tabla de tipos de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_documentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        prefijo VARCHAR(10),
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Tabla tipos_documentos creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tipos_documentos_nombre ON tipos_documentos(nombre)`);

    // Tabla de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        usuario_id INT NOT NULL,
        tipo_documento VARCHAR(100) NOT NULL,
        ruta_archivo VARCHAR(500) NOT NULL,
        tamaño_archivo INT,
        palabras_clave TEXT,
        estado VARCHAR(50) DEFAULT 'activo',
        vista_publica BOOLEAN DEFAULT false,
        descargas INT DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    logger.info('✓ Tabla documentos creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documentos_usuario_id ON documentos(usuario_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documentos_titulo ON documentos(titulo)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos(estado)`);

    // Tabla de historial de acceso
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_acceso (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL,
        documento_id INT NOT NULL,
        tipo_acceso VARCHAR(50) DEFAULT 'visualizado',
        fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
      )
    `);
    logger.info('✓ Tabla historial_acceso creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_historial_acceso_usuario_id ON historial_acceso(usuario_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_historial_acceso_documento_id ON historial_acceso(documento_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_historial_acceso_fecha ON historial_acceso(fecha_acceso)`);

    // Tabla de categorías de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias_documentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        color VARCHAR(7),
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Tabla categorias_documentos creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_categorias_documentos_nombre ON categorias_documentos(nombre)`);

    // Tabla de relación entre documentos y categorías
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documento_categoria (
        documento_id INT NOT NULL,
        categoria_id INT NOT NULL,
        PRIMARY KEY (documento_id, categoria_id),
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias_documentos(id) ON DELETE CASCADE
      )
    `);
    logger.info('✓ Tabla documento_categoria creada');

    // Tabla de documentos compartidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documentos_compartidos (
        id SERIAL PRIMARY KEY,
        documento_id INT NOT NULL,
        usuario_propietario_id INT NOT NULL,
        usuario_compartido_id INT NOT NULL,
        permiso VARCHAR(50) DEFAULT 'lectura',
        fecha_comparticion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_propietario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_compartido_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE (documento_id, usuario_compartido_id)
      )
    `);
    logger.info('✓ Tabla documentos_compartidos creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_documentos_compartidos_usuario ON documentos_compartidos(usuario_compartido_id)`);

    // Tabla de auditoría
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(100) NOT NULL,
        tabla_afectada VARCHAR(50) NOT NULL,
        registro_id INT,
        detalles JSONB,
        fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    logger.info('✓ Tabla auditoria creada');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion)`);

    logger.info('========================================');
    logger.info('✓ Todas las tablas creadas correctamente');
    logger.info('========================================');

  } catch (error) {
    logger.error(`Error al crear tablas: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

/**
 * Ejecuta el script de inicialización
 */
if (require.main === module) {
  crearTablas().catch(err => {
    logger.error(`Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { crearTablas };
