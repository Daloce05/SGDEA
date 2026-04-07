/**
 * Middleware de Validación
 * 
 * Valida los datos de entrada en las peticiones
 * Utiliza express-validator para validar campos
 */

const { body, param, validationResult } = require('express-validator');
const logger = require('../../config/logger');

/**
 * Middleware para procesar errores de validación
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar
 * @returns {void}
 */
function procesarErroresValidacion(req, res, next) {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    const mensaje = errores.array()
      .map(err => `${err.param}: ${err.msg}`)
      .join(', ');
    
    logger.advertencia(`Error de validación: ${mensaje}`);
    
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: errores.array()
    });
  }

  next();
}

/**
 * Reglas de validación para el registro de usuario
 */
const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('El correo debe ser válido'),
  body('contraseña')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  procesarErroresValidacion
];

/**
 * Reglas de validación para el inicio de sesión
 * Acepta 'usuario' (email o username) para mayor flexibilidad
 */
const validarInicioSesion = [
  body('usuario')
    .trim()
    .notEmpty().withMessage('El usuario (email o nombre de usuario) es obligatorio')
    .isLength({ min: 3 }).withMessage('El usuario debe tener al menos 3 caracteres'),
  body('contraseña')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  procesarErroresValidacion
];

/**
 * Reglas de validación para actualizar usuario
 */
const validarActualizacionUsuario = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('El correo debe ser válido'),
  body('rol')
    .optional()
    .isIn(['administrador', 'cargador', 'consultor']).withMessage('El rol debe ser válido'),
  procesarErroresValidacion
];

/**
 * Validar ID en parámetros
 */
const validarId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
  procesarErroresValidacion
];

module.exports = {
  validarRegistro,
  validarInicioSesion,
  validarActualizacionUsuario,
  validarId,
  procesarErroresValidacion
};
