/**
 * Middleware de Autorización por Roles
 * 
 * Define autorizaciones específicas para los tres roles del sistema:
 * - administrador: Acceso total
 * - cargador: Carga de archivos y búsqueda
 * - consultor: Solo lectura y búsqueda
 */

const logger = require('../../config/logger');

/**
 * Middleware para verificar que el usuario es administrador
 * Acceso total al sistema
 */
function verificarAdministrador(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    logger.advertencia(`Acceso denegado a función administrador: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'Permiso insuficiente. Se requiere rol de administrador'
    });
  }
  next();
}

/**
 * Middleware para verificar que el usuario es cargador
 * Permite: cargar archivos, buscar documentos, descargar
 * Denía: crear/editar estructura documental, gestión de usuarios
 */
function verificarCargador(req, res, next) {
  const rolesPermitidos = ['administrador', 'cargador'];
  
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
    logger.advertencia(`Acceso denegado a función cargador: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'Permiso insuficiente. Se requiere rol de cargador o administrador'
    });
  }
  next();
}

/**
 * Middleware para verificar que el usuario es consultor
 * Permite: buscar documentos, descargar, consultar información
 * Deniega: cargar archivos, crear estructura, editar
 */
function verificarConsultor(req, res, next) {
  const rolesPermitidos = ['administrador', 'cargador', 'consultor'];
  
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
    logger.advertencia(`Acceso denegado a función consultor: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'Permiso insuficiente. Se requiere rol de consultor, cargador o administrador'
    });
  }
  next();
}

/**
 * Middleware para restringir operaciones de creación/edición a administrador y cargador
 * Se usa para POST/PUT de archivos
 */
function permitirModificacion(req, res, next) {
  const rolesPermitidos = ['administrador', 'cargador'];
  
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
    logger.advertencia(`Acceso denegado a modificación: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'No tiene permisos para realizar esta acción. Se requiere cargar archivos'
    });
  }
  next();
}

/**
 * Middleware para operaciones administrativas (crear serie, subserie, tipo, etc)
 * Solo administrador
 */
function permitirAdministracion(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    logger.advertencia(`Acceso denegado a administración: Usuario ${req.usuario?.id}`);
    return res.status(403).json({
      error: 'No tiene permisos administrativos. Se requiere rol de administrador'
    });
  }
  next();
}

module.exports = {
  verificarAdministrador,
  verificarCargador,
  verificarConsultor,
  permitirModificacion,
  permitirAdministracion
};
