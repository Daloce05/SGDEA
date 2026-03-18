/**
 * Modelo de Usuario
 * 
 * Maneja todas las operaciones relacionadas con usuarios en la base de datos
 * Incluye métodos para crear, leer, actualizar y eliminar usuarios
 */

const { pool } = require('../../config/baseDatos');
const logger = require('../../config/logger');

class ModeloUsuario {
  /**
   * Obtiene todos los usuarios del sistema
   * @async
   * @returns {Promise<Array>} Lista de usuarios
   */
  static async obtenerTodos() {
    try {
      const [usuarios] = await pool.query(
        'SELECT id, nombre, apellido, email, rol, estado, fecha_creacion FROM usuarios WHERE estado = true ORDER BY fecha_creacion DESC'
      );
      return usuarios;
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
      const [usuarios] = await pool.query(
        'SELECT id, nombre, apellido, email, rol, estado, fecha_creacion FROM usuarios WHERE id = ? AND estado = true',
        [id]
      );
      return usuarios[0] || null;
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
      const [usuarios] = await pool.query(
        'SELECT id, nombre, apellido, email, rol, contraseña, estado FROM usuarios WHERE email = ?',
        [email]
      );
      return usuarios[0] || null;
    } catch (error) {
      logger.error(`Error al obtener usuario por email: ${error.message}`);
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
   * @param {string} datosUsuario.contraseña - Contraseña (ya encriptada)
   * @param {string} datosUsuario.rol - Rol del usuario (admin, gerente, usuario)
   * @returns {Promise<number>} ID del usuario creado
   */
  static async crear(datosUsuario) {
    try {
      const { nombre, apellido, email, contraseña, rol } = datosUsuario;
      
      const [resultado] = await pool.query(
        'INSERT INTO usuarios (nombre, apellido, email, contraseña, rol, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, true, NOW())',
        [nombre, apellido, email, contraseña, rol]
      );
      
      logger.info(`Usuario creado: ${email}`);
      return resultado.insertId;
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

      // Construir dinámicamente la consulta UPDATE
      if (datosActualizacion.nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(datosActualizacion.nombre);
      }
      if (datosActualizacion.apellido !== undefined) {
        campos.push('apellido = ?');
        valores.push(datosActualizacion.apellido);
      }
      if (datosActualizacion.email !== undefined) {
        campos.push('email = ?');
        valores.push(datosActualizacion.email);
      }
      if (datosActualizacion.rol !== undefined) {
        campos.push('rol = ?');
        valores.push(datosActualizacion.rol);
      }

      if (campos.length === 0) return false;

      campos.push('fecha_actualizacion = NOW()');
      valores.push(id);

      const consulta = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
      const [resultado] = await pool.query(consulta, valores);

      logger.info(`Usuario actualizado: ID ${id}`);
      return resultado.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva un usuario (eliminación lógica)
   * @async
   * @param {number} id - ID del usuario
   * @returns {Promise<boolean>} true si se desactivó, false si no
   */
  static async desactivar(id) {
    try {
      const [resultado] = await pool.query(
        'UPDATE usuarios SET estado = false, fecha_actualizacion = NOW() WHERE id = ?',
        [id]
      );
      
      logger.info(`Usuario desactivado: ID ${id}`);
      return resultado.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al desactivar usuario: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloUsuario;
