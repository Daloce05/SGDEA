/**
 * Script de inicialización de la base de datos
 * 
 * Crea la estructura de tablas necesarias para el SGDEA
 * Ejecutar: node base_datos/inicializar.js
 */

require('dotenv').config();
const { pool } = require('../config/baseDatos');
const logger = require('../config/logger');

/**
 * Crea las tablas de la base de datos
 * @async
 */
async function crearTablas() {
  try {
    logger.info('Iniciando creación de tablas...');

    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'gerente', 'usuario') DEFAULT 'usuario',
        estado BOOLEAN DEFAULT true,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_rol (rol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla usuarios creada');

    // Tabla de categorías/tipos de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        prefijo VARCHAR(10),
        activo BOOLEAN DEFAULT true,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla tipos_documentos creada');

    // Tabla de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        usuario_id INT NOT NULL,
        tipo_documento VARCHAR(100) NOT NULL,
        ruta_archivo VARCHAR(500) NOT NULL,
        tamaño_archivo INT,
        palabras_clave TEXT,
        estado ENUM('activo', 'archivado', 'eliminado') DEFAULT 'activo',
        vista_publica BOOLEAN DEFAULT false,
        descargas INT DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_titulo (titulo),
        INDEX idx_estado (estado),
        FULLTEXT idx_busqueda (titulo, descripcion, palabras_clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla documentos creada');

    // Tabla de historial de acceso a documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_acceso (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        documento_id INT NOT NULL,
        tipo_acceso ENUM('visualizado', 'descargado') DEFAULT 'visualizado',
        fecha_acceso DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_documento_id (documento_id),
        INDEX idx_fecha_acceso (fecha_acceso)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla historial_acceso creada');

    // Tabla de categorías de documentos (no confundir con tipos_documentos)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias_documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        color VARCHAR(7),
        activo BOOLEAN DEFAULT true,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla categorias_documentos creada');

    // Relación entre documentos y categorías
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documento_categoria (
        documento_id INT NOT NULL,
        categoria_id INT NOT NULL,
        PRIMARY KEY (documento_id, categoria_id),
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias_documentos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla documento_categoria creada');

    // Tabla de permisos de documentos compartidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documentos_compartidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        documento_id INT NOT NULL,
        usuario_propietario_id INT NOT NULL,
        usuario_compartido_id INT NOT NULL,
        permiso ENUM('lectura', 'edicion') DEFAULT 'lectura',
        fecha_comparticion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_propietario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_compartido_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY uk_documento_usuario (documento_id, usuario_compartido_id),
        INDEX idx_usuario_compartido_id (usuario_compartido_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla documentos_compartidos creada');

    // Tabla de auditoría
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(100) NOT NULL,
        tabla_afectada VARCHAR(50) NOT NULL,
        registro_id INT,
        detalles JSON,
        fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_fecha_accion (fecha_accion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✓ Tabla auditoria creada');

    logger.info('========================================');
    logger.info('✓ Todas las tablas creadas correctamente');
    logger.info('========================================');

  } catch (error) {
    logger.error(`Error al crear tablas: ${error.message}`);
    throw error;
  } finally {
    process.exit(0);
  }
}

/**
 * Ejecuta el script de inicialización
 */
if (require.main === module) {
  crearTablas();
}

module.exports = { crearTablas };
