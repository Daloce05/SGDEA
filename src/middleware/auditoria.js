/**
 * Middleware: Auditoría Automática
 * 
 * Registra automáticamente las acciones importantes del sistema
 * Se aplica a operaciones de creación, actualización y eliminación
 */

const logger = require('../../config/logger');
const ModeloAuditoria = require('../modelos/ModeloAuditoria');

/**
 * Middleware para auditar operaciones en documentos
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar
 */
async function auditarOperacionesDocumentos(req, res, next) {
  // Interceptar la respuesta para capturar el estado
  const originalSend = res.send;

  res.send = function(data) {
    // Solo registrar si la operación fue exitosa (status 2xx) y es de administrador o cargador
    if (res.statusCode >= 200 && res.statusCode < 300 && req.usuario) {
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        // Registrar en auditoría de forma asincrónica sin bloquear la respuesta
        (async () => {
          try {
            let accion, descripcion;

            if (req.method === 'POST') {
              accion = 'CREAR';
              descripcion = `Documento creado en ruta: ${req.path}`;
            } else if (req.method === 'PUT') {
              accion = 'ACTUALIZAR';
              descripcion = `Documento actualizado en ruta: ${req.path}`;
            } else if (req.method === 'DELETE') {
              accion = 'ELIMINAR';
              descripcion = `Documento eliminado en ruta: ${req.path}`;
            }

            if (accion) {
              await ModeloAuditoria.registrar({
                usuario_id: req.usuario.id,
                usuario_nombre: req.usuario.nombre || req.usuario.username,
                accion,
                modulo: 'DOCUMENTOS',
                tabla_afectada: 'documentos',
                descripcion,
                detalles_nuevos: { ruta: req.path, metodo: req.method },
                ip_address: req.ip
              });
            }
          } catch (error) {
            logger.error(`Error en auditoría de documentos: ${error.message}`);
          }
        })();
      }
    }

    originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware para auditar descargas de archivos
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express  
 * @param {Function} next - Función para continuar
 */
async function auditarDescargaArchivos(req, res, next) {
  const originalSend = res.send;

  res.send = function(data) {
    // Registrar descargas exitosas
    if (res.statusCode >= 200 && res.statusCode < 300 && req.usuario && req.path.includes('/descargar')) {
      (async () => {
        try {
          await ModeloAuditoria.registrar({
            usuario_id: req.usuario.id,
            usuario_nombre: req.usuario.nombre || req.usuario.username,
            accion: 'DESCARGAR',
            modulo: 'DOCUMENTOS',
            tabla_afectada: 'documentos',
            descripcion: `Archivo descargado: ${req.path}`,
            detalles_nuevos: { ruta: req.path },
            ip_address: req.ip
          });
        } catch (error) {
          logger.error(`Error en auditoría de descargas: ${error.message}`);
        }
      })();
    }

    originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware para auditar búsquedas
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar
 */
async function auditarBusquedas(req, res, next) {
  const originalSend = res.send;

  res.send = function(data) {
    // Registrar búsquedas exitosas
    if (res.statusCode >= 200 && res.statusCode < 300 && req.usuario && req.method === 'POST' && req.path.includes('/buscar')) {
      (async () => {
        try {
          await ModeloAuditoria.registrar({
            usuario_id: req.usuario.id,
            usuario_nombre: req.usuario.nombre || req.usuario.username,
            accion: 'BUSCAR',
            modulo: 'DOCUMENTOS',
            tabla_afectada: 'documentos',
            descripcion: `Búsqueda realizada`,
            detalles_nuevos: { criterios: req.body },
            ip_address: req.ip
          });
        } catch (error) {
          logger.error(`Error en auditoría de búsquedas: ${error.message}`);
        }
      })();
    }

    originalSend.call(this, data);
  };

  next();
}

module.exports = {
  auditarOperacionesDocumentos,
  auditarDescargaArchivos,
  auditarBusquedas
};
