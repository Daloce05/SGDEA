/**
 * Controlador de Usuarios
 * 
 * Maneja las operaciones CRUD de usuarios
 * Gestiona la obtención, actualización y eliminación de perfiles
 */

const logger = require('../../config/logger');
const ModeloUsuario = require('../modelos/ModeloUsuario');

class ControladorUsuarios {
  /**
   * Obtiene todos los usuarios
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerTodos(req, res) {
    try {
      const usuarios = await ModeloUsuario.obtenerTodos();

      res.json({
        mensaje: 'Usuarios obtenidos correctamente',
        total: usuarios.length,
        usuarios
      });
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      res.status(500).json({
        error: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Obtiene un usuario específico por ID
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del usuario
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await ModeloUsuario.obtenerPorId(id);

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Usuario obtenido correctamente',
        usuario
      });
    } catch (error) {
      logger.error(`Error al obtener usuario: ${error.message}`);
      res.status(500).json({
        error: 'Error al obtener usuario'
      });
    }
  }

  /**
   * Actualiza los datos de un usuario
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del usuario
   * @param {Object} req.body - Campos a actualizar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, rol } = req.body;

      // Verificar que el usuario existe
      const usuarioExistente = await ModeloUsuario.obtenerPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      // Actualizar usuario
      const actualizado = await ModeloUsuario.actualizar(id, {
        nombre,
        apellido,
        email,
        rol
      });

      if (!actualizado) {
        return res.status(400).json({
          error: 'No se realizaron cambios'
        });
      }

      const usuarioActualizado = await ModeloUsuario.obtenerPorId(id);

      res.json({
        mensaje: 'Usuario actualizado correctamente',
        usuario: usuarioActualizado
      });
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      res.status(500).json({
        error: 'Error al actualizar usuario'
      });
    }
  }

  /**
   * Desactiva un usuario
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del usuario
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el usuario existe
      const usuarioExistente = await ModeloUsuario.obtenerPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      // Desactivar usuario
      const desactivado = await ModeloUsuario.desactivar(id);

      if (!desactivado) {
        return res.status(400).json({
          error: 'No se pudo desactivar el usuario'
        });
      }

      logger.info(`Usuario desactivado: ID ${id}`);

      res.json({
        mensaje: 'Usuario desactivado correctamente'
      });
    } catch (error) {
      logger.error(`Error al desactivar usuario: ${error.message}`);
      res.status(500).json({
        error: 'Error al desactivar usuario'
      });
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} req.usuario - Información del usuario del token JWT
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPerfil(req, res) {
    try {
      const usuario = await ModeloUsuario.obtenerPorId(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Perfil obtenido correctamente',
        usuario
      });
    } catch (error) {
      logger.error(`Error al obtener perfil: ${error.message}`);
      res.status(500).json({
        error: 'Error al obtener perfil'
      });
    }
  }
}

module.exports = ControladorUsuarios;
