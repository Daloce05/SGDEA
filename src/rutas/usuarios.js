/**
 * Rutas de Usuarios
 * 
 * Define los endpoints para gestión de usuarios
 * Requiere autenticación en la mayoría de las rutas
 */

const express = require('express');
const ControladorUsuarios = require('../controladores/ControladorUsuarios');
const { verificarToken, verificarAdmin } = require('../middleware/autenticacion');
const { validarActualizacionUsuario, validarId } = require('../middleware/validacion');

const router = express.Router();

/**
 * GET /api/usuarios
 * Obtiene la lista de todos los usuarios
 * Requiere: Rol de administrador
 * 
 * Query:
 *   - (ninguno)
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - total (number): Cantidad de usuarios
 *   - usuarios (array): Lista de usuarios
 */
router.get('/', verificarToken, verificarAdmin, ControladorUsuarios.obtenerTodos);

/**
 * GET /api/usuarios/perfil
 * Obtiene el perfil del usuario autenticado
 * Requiere: Token válido
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - usuario (object): Datos del usuario autenticado
 */
router.get('/perfil', verificarToken, ControladorUsuarios.obtenerPerfil);

/**
 * GET /api/usuarios/:id
 * Obtiene un usuario específico por ID
 * Requiere: Rol de administrador
 * 
 * Params:
 *   - id (number): ID del usuario
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - usuario (object): Datos del usuario
 */
router.get('/:id', verificarToken, verificarAdmin, validarId, ControladorUsuarios.obtenerPorId);

/**
 * PUT /api/usuarios/:id
 * Actualiza los datos de un usuario
 * Requiere: Rol de administrador
 * 
 * Params:
 *   - id (number): ID del usuario
 * 
 * Body:
 *   - nombre (string, opcional): Nuevo nombre
 *   - apellido (string, opcional): Nuevo apellido
 *   - email (string, opcional): Nuevo correo
 *   - rol (string, opcional): Nuevo rol
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - usuario (object): Datos actualizados
 */
router.put('/:id', verificarToken, verificarAdmin, validarId, validarActualizacionUsuario, ControladorUsuarios.actualizar);

/**
 * DELETE /api/usuarios/:id
 * Desactiva un usuario
 * Requiere: Rol de administrador
 * 
 * Params:
 *   - id (number): ID del usuario
 * 
 * Response:
 *   - mensaje (string): Confirmación
 */
router.delete('/:id', verificarToken, verificarAdmin, validarId, ControladorUsuarios.desactivar);

module.exports = router;
