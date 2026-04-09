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

module.exports = {
  verificarToken
};
