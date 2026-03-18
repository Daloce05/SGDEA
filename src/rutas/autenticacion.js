/**
 * Rutas de Autenticación
 * 
 * Define los endpoints para registro e inicio de sesión
 * Rutas públicas que no requieren autenticación
 */

const express = require('express');
const ControladorAutenticacion = require('../controladores/ControladorAutenticacion');
const { validarRegistro, validarInicioSesion } = require('../middleware/validacion');

const router = express.Router();

/**
 * POST /api/autenticacion/registro
 * Registra un usuario nuevo en el sistema
 * 
 * Body:
 *   - nombre (string): Nombre del usuario
 *   - apellido (string): Apellido del usuario
 *   - email (string): Correo único
 *   - contraseña (string): Contraseña (min 8 caracteres)
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - usuario_id (number): ID del usuario creado
 */
router.post('/registro', validarRegistro, ControladorAutenticacion.registrar);

/**
 * POST /api/autenticacion/login
 * Inicia sesión de un usuario y genera token JWT
 * 
 * Body:
 *   - email (string): Correo del usuario
 *   - contraseña (string): Contraseña del usuario
 * 
 * Response:
 *   - token (string): Token JWT
 *   - usuario (object): Información del usuario
 */
router.post('/login', validarInicioSesion, ControladorAutenticacion.iniciarSesion);

/**
 * GET /api/autenticacion/validar
 * Valida que un token JWT sea válido
 * 
 * Headers:
 *   - Authorization: Bearer <token>
 * 
 * Response:
 *   - valido (boolean): Si el token es válido
 *   - usuario (object): Información decodificada del token
 */
router.get('/validar', ControladorAutenticacion.validarToken);

module.exports = router;
