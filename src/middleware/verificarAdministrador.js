/**
 * Middleware: Verificar Administrador
 * 
 * Verifica que el usuario autenticado tenga el rol de 'administrador'
 * Se aplica a todas las rutas de administración
 */

const logger = require('../../config/logger');

/**
 * Middleware para verificar que el usuario es administrador
 * @param {Object} req - Objeto de petición Express (debe tener req.usuario del JWT)
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
function verificarAdministrador(req, res, next) {
  try {
    // Verificar que existe el usuario en el request (debe haber pasado por verificarToken)
    if (!req.usuario) {
      logger.warn('Intento de acceso admin sin información de usuario');
      return res.status(401).json({
        exito: false,
        error: 'No autenticado'
      });
    }

    // Verificar que el rol es administrador
    if (req.usuario.rol !== 'administrador') {
      logger.warn(`Acceso denegado a área admin - Usuario: ${req.usuario.username}, Rol: ${req.usuario.rol}`);
      return res.status(403).json({
        exito: false,
        error: 'Permiso insuficiente. Solo administradores pueden acceder'
      });
    }

    // Usuario es administrador, continuar
    next();
  } catch (error) {
    logger.error(`Error en verificarAdministrador: ${error.message}`);
    res.status(500).json({
      exito: false,
      error: 'Error en validación de permisos'
    });
  }
}

module.exports = verificarAdministrador;
