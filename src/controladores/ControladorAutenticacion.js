/**
 * Controlador de Autenticación
 * 
 * Maneja el registro, inicio de sesión de usuarios y generación de tokens JWT
 * Gestiona la seguridad y validación de credenciales
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../../config/logger');
const ModeloUsuario = require('../modelos/ModeloUsuario');

class ControladorAutenticacion {
  /**
   * Registra un usuario nuevo en el sistema
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} req.body - Cuerpo de la petición
   * @param {string} req.body.nombre - Nombre del usuario
   * @param {string} req.body.apellido - Apellido del usuario
   * @param {string} req.body.email - Correo del usuario
   * @param {string} req.body.contraseña - Contraseña
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async registrar(req, res) {
    try {
      const { nombre, apellido, email, contraseña } = req.body;

      // Validar que el usuario no existe
      const usuarioExistente = await ModeloUsuario.obtenerPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({
          error: 'El correo ya está registrado'
        });
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

      // Crear usuario
      const idUsuario = await ModeloUsuario.crear({
        nombre,
        apellido,
        email,
        contraseña: contraseñaEncriptada,
        rol: 'usuario' // Rol por defecto
      });

      logger.info(`Nuevo usuario registrado: ${email}`);

      res.status(201).json({
        mensaje: 'Usuario registrado correctamente',
        usuario_id: idUsuario
      });
    } catch (error) {
      logger.error(`Error en registro: ${error.message}`);
      res.status(500).json({
        error: 'Error al registrar usuario'
      });
    }
  }

  /**
   * Inicia sesión de un usuario y genera un token JWT
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {string} req.body.email - Correo del usuario
   * @param {string} req.body.contraseña - Contraseña
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async iniciarSesion(req, res) {
    try {
      const { email, contraseña } = req.body;

      // Obtener usuario
      const usuario = await ModeloUsuario.obtenerPorEmail(email);
      if (!usuario) {
        return res.status(401).json({
          error: 'Correo o contraseña incorrectos'
        });
      }

      // Validar contraseña
      const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!contraseñaValida) {
        return res.status(401).json({
          error: 'Correo o contraseña incorrectos'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        },
        process.env.JWT_SECRETO,
        { expiresIn: process.env.EXPIRACION_TOKEN || '24h' }
      );

      logger.info(`Sesión iniciada: ${email}`);

      res.json({
        mensaje: 'Sesión iniciada correctamente',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (error) {
      logger.error(`Error en inicio de sesión: ${error.message}`);
      res.status(500).json({
        error: 'Error al iniciar sesión'
      });
    }
  }

  /**
   * Valida un token JWT
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async validarToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: 'Token no proporcionado'
        });
      }

      const decodificado = jwt.verify(token, process.env.JWT_SECRETO);

      res.json({
        valido: true,
        usuario: decodificado
      });
    } catch (error) {
      res.status(401).json({
        error: 'Token inválido o expirado'
      });
    }
  }
}

module.exports = ControladorAutenticacion;
