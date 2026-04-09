/**
 * Utilidad de Auditoría
 * 
 * Centraliza el registro de acciones de auditoría.
 * Extrae campos comunes del request y maneja errores silenciosamente
 * para que fallos de auditoría no interrumpan el flujo principal.
 * 
 * @module utilidades/auditoria
 */

const ModeloAuditoria = require('../modelos/ModeloAuditoria');
const logger = require('../../config/logger');

/**
 * Registra una acción de auditoría de forma segura
 * 
 * @async
 * @param {Object} req - Objeto de petición Express
 * @param {Object} datos - Datos específicos de la auditoría
 * @param {string} datos.accion - Tipo de acción (CREAR, ACTUALIZAR, ELIMINAR, DESCARGAR, etc.)
 * @param {string} datos.modulo - Módulo afectado (trd, autenticacion, USUARIOS)
 * @param {string} datos.tabla_afectada - Tabla de BD afectada
 * @param {number|string} datos.registro_id - ID del registro afectado
 * @param {string} datos.descripcion - Descripción legible de la acción
 * @param {Object} [datos.detalles_anteriores] - Estado anterior del registro
 * @param {Object} [datos.detalles_nuevos] - Estado nuevo del registro
 * @param {number} [datos.usuario_id] - Override del ID de usuario (para registro/login)
 * @param {string} [datos.usuario_nombre] - Override del nombre de usuario
 */
async function registrarAuditoria(req, datos) {
  try {
    await ModeloAuditoria.registrar({
      usuario_id: datos.usuario_id || req.usuario?.id,
      usuario_nombre: datos.usuario_nombre || req.usuario?.nombre || req.usuario?.username,
      accion: datos.accion,
      modulo: datos.modulo,
      tabla_afectada: datos.tabla_afectada,
      registro_id: datos.registro_id,
      descripcion: datos.descripcion,
      detalles_anteriores: datos.detalles_anteriores,
      detalles_nuevos: datos.detalles_nuevos,
      ip_address: req.ip
    });
  } catch (error) {
    logger.error(`Error auditoría: ${error.message}`);
  }
}

module.exports = registrarAuditoria;
