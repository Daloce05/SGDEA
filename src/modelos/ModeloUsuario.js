/**
 * Modelo de Usuario
 * 
 * Maneja todas las operaciones relacionadas con usuarios en la base de datos
 * Incluye métodos para crear, leer, actualizar y eliminar usuarios
 * ADAPTADO PARA POSTGRESQL
 */

const { pool } = require('../../config/postgresqlTRD');
const logger = require('../../config/logger');

class ModeloUsuario {
  /**
   * Obtiene todos los usuarios del sistema
   * @async
   * @returns {Promise<Array>} Lista de usuarios
   */
  static async obtenerTodos() {
    try {
      const result = await pool.query(
        'SELECT id, nombre, apellido, email, rol, estado, fecha_creacion FROM usuarios WHERE estado = true ORDER BY fecha_creacion DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un usuario específico por ID
   * @async
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} Datos del usuario o null
   */
  static async obtenerPorId(id) {
    try {
      const result = await pool.query(
        'SELECT id, nombre, apellido, email, username, rol, estado, fecha_creacion FROM usuarios WHERE id = $1 AND estado = true',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener usuario por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por correo electrónico
   * @async
   * @param {string} email - Correo del usuario
   * @returns {Promise<Object|null>} Datos del usuario o null
   */
  static async obtenerPorEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, nombre, apellido, email, username, rol, contraseña, estado FROM usuarios WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener usuario por email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por nombre de usuario
   * @async
   * @param {string} username - Nombre de usuario
   * @returns {Promise<Object|null>} Datos del usuario o null
   */
  static async obtenerPorUsername(username) {
    try {
      const result = await pool.query(
        'SELECT id, nombre, apellido, email, username, rol, contraseña, estado FROM usuarios WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener usuario por username: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un usuario nuevo
   * @async
   * @param {Object} datosUsuario - Datos del usuario
   * @param {string} datosUsuario.nombre - Nombre del usuario
   * @param {string} datosUsuario.apellido - Apellido del usuario
   * @param {string} datosUsuario.email - Correo del usuario
   * @param {string} datosUsuario.username - Nombre de usuario (opcional)
   * @param {string} datosUsuario.contraseña - Contraseña (ya encriptada)
   * @param {string} datosUsuario.rol - Rol del usuario (administrador, cargador, consultor)
   * @returns {Promise<number>} ID del usuario creado
   */
  static async crear(datosUsuario) {
    try {
      const { nombre, apellido, email, username, contraseña, rol } = datosUsuario;
      
      const result = await pool.query(
        'INSERT INTO usuarios (nombre, apellido, email, username, contraseña, rol, estado, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id',
        [nombre, apellido, email, username || null, contraseña, rol || 'consultor', true]
      );
      
      const idUsuario = result.rows[0].id;
      logger.info(`Usuario creado: ${email} (ID: ${idUsuario})`);
      return idUsuario;
    } catch (error) {
      logger.error(`Error al crear usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza los datos de un usuario
   * @async
   * @param {number} id - ID del usuario
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<boolean>} true si se actualizó, false si no
   */
  static async actualizar(id, datosActualizacion) {
    try {
      const campos = [];
      const valores = [];
      let paramCount = 1;

      // Construir dinámicamente la consulta UPDATE
      if (datosActualizacion.nombre !== undefined) {
        campos.push(`nombre = $${paramCount}`);
        valores.push(datosActualizacion.nombre);
        paramCount++;
      }
      if (datosActualizacion.apellido !== undefined) {
        campos.push(`apellido = $${paramCount}`);
        valores.push(datosActualizacion.apellido);
        paramCount++;
      }
      if (datosActualizacion.email !== undefined) {
        campos.push(`email = $${paramCount}`);
        valores.push(datosActualizacion.email);
        paramCount++;
      }
      if (datosActualizacion.username !== undefined) {
        campos.push(`username = $${paramCount}`);
        valores.push(datosActualizacion.username);
        paramCount++;
      }
      if (datosActualizacion.rol !== undefined) {
        campos.push(`rol = $${paramCount}`);
        valores.push(datosActualizacion.rol);
        paramCount++;
      }

      if (campos.length === 0) return false;

      campos.push(`fecha_actualizacion = NOW()`);
      valores.push(id);

      const consulta = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${paramCount} RETURNING id`;
      const result = await pool.query(consulta, valores);

      if (result.rows.length === 0) {
        logger.advertencia(`No se encontró usuario con ID: ${id}`);
        return false;
      }

      logger.info(`Usuario actualizado: ID ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva un usuario (soft delete)
   * @async
   * @param {number} id - ID del usuario
   * @returns {Promise<boolean>} true si se desactivó, false si no
   */
  static async desactivar(id) {
    try {
      const result = await pool.query(
        'UPDATE usuarios SET estado = false, fecha_actualizacion = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        logger.advertencia(`No se encontró usuario con ID: ${id}`);
        return false;
      }

      logger.info(`Usuario desactivado: ID ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error al desactivar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si un email ya está registrado
   * @async
   * @param {string} email - Correo a verificar
   * @returns {Promise<boolean>}
   */
  static async emailExiste(email) {
    try {
      const result = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error al verificar email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si un username ya está registrado
   * @async
   * @param {string} username - Nombre de usuario a verificar
   * @returns {Promise<boolean>}
   */
  static async usernameExiste(username) {
    try {
      const result = await pool.query(
        'SELECT id FROM usuarios WHERE username = $1',
        [username]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error al verificar username: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloUsuario;
