/**
 * Rutas Admin
 * 
 * Define todos los endpoints para administración de usuarios y auditoría
 * Estas rutas son exclusivas para usuarios con rol 'administrador'
 */

const express = require('express');
const router = express.Router();

const { verificarAdministrador } = require('../middleware/autorizacion');
const ControladorUsuarios = require('../controladores/ControladorUsuarios');
const ControladorAuditoria = require('../controladores/ControladorAuditoria');

// ==================== RUTAS DE USUARIOS ====================

/**
 * GET /api/admin/usuarios
 * Obtiene lista de todos los usuarios con filtros opcionales
 * Query: rol, estado, buscar
 */
router.get('/usuarios', verificarAdministrador, ControladorUsuarios.obtenerTodos);

/**
 * GET /api/admin/usuarios/:id
 * Obtiene detalles de un usuario específico
 */
router.get('/usuarios/:id', verificarAdministrador, ControladorUsuarios.obtenerPorId);

/**
 * POST /api/admin/usuarios
 * Crea un nuevo usuario
 * Body: nombre, apellido, email, username, contraseña, rol
 */
router.post('/usuarios', verificarAdministrador, ControladorUsuarios.crear);

/**
 * PUT /api/admin/usuarios/:id
 * Actualiza datos de un usuario existente
 * Body: nombre, apellido, email, rol (opcionales)
 */
router.put('/usuarios/:id', verificarAdministrador, ControladorUsuarios.actualizar);

/**
 * DELETE /api/admin/usuarios/:id
 * Desactiva un usuario (soft delete)
 */
router.delete('/usuarios/:id', verificarAdministrador, ControladorUsuarios.desactivar);

/**
 * POST /api/admin/usuarios/:id/resetear-contraseña
 * Resetea la contraseña de un usuario
 * Body: nueva_contraseña
 */
router.post('/usuarios/:id/resetear-contraseña', verificarAdministrador, ControladorUsuarios.resetearContraseña);

// ==================== RUTAS DE AUDITORÍA ====================

/**
 * GET /api/admin/auditoria/registros
 * Obtiene registros de auditoría con filtros y paginación
 * Query: usuario_id, accion, modulo, fecha_desde, fecha_hasta, page, limit
 */
router.get('/auditoria/registros', verificarAdministrador, ControladorAuditoria.obtenerRegistros);

/**
 * GET /api/admin/auditoria/estadisticas
 * Obtiene estadísticas y actividad de auditoría
 */
router.get('/auditoria/estadisticas', verificarAdministrador, ControladorAuditoria.obtenerEstadisticas);

/**
 * GET /api/admin/auditoria/exportar
 * Exporta registros de auditoría a CSV
 * Query: usuario_id, accion, modulo, fecha_desde, fecha_hasta (filtros opcionales)
 */
router.get('/auditoria/exportar', verificarAdministrador, ControladorAuditoria.exportarCSV);

/**
 * DELETE /api/admin/auditoria/limpiar
 * Elimina registros de auditoría más antiguos que N días
 * Body: dias_retener (default: 90)
 */
router.delete('/auditoria/limpiar', verificarAdministrador, ControladorAuditoria.limpiar);

module.exports = router;
