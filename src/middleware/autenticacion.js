/**
 * Middleware de Autenticación
 * 
 * Valida que las peticiones incluyan un token JWT válido
 * Protege las rutas que requieren autenticación
 */

const jwt = require('jsonwebtoken');
const logger = require('../../config/logger');

/**
 * Middleware para verificar token JWT
 * @async
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
function verificarToken(req, res, next) {
  try {
    // Obtener token del header Authorization
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.advertencia('Petición sin token: ' + req.path);
      return res.status(401).json({
        error: 'Token no proporcionado'
      });
    }

    // Verificar y decodificar el token
    const decodificado = jwt.verify(token, process.env.JWT_SECRETO);

    // Adjuntar información del usuario al objeto request
    req.usuario = decodificado;

    next();
  } catch (error) {
    logger.advertencia(`Token inválido: ${error.message}`);
    res.status(401).json({
      error: 'Token inválido o expirado'
    });
  }
}

/**
 * Middleware para verificar que el usuario es administrador
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
function verificarAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    logger.advertencia(`Acceso denegado a admin: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'Permiso insuficiente. Se requiere rol de administrador'
    });
  }

  next();
}

/**
 * Middleware para verificar que el usuario es gerente
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
function verificarGerente(req, res, next) {
  const roles_permitidos = ['administrador', 'cargador'];
  
  if (!req.usuario || !roles_permitidos.includes(req.usuario.rol)) {
    logger.advertencia(`Acceso denegado a gerente: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'Permiso insuficiente. Se requiere rol de cargador o administrador'
    });
  }

  next();
}

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarGerente
};
