/**
 * Controlador de Documentos
 * 
 * Maneja las operaciones de gestión de documentos
 * Incluye carga, búsqueda, descarga y eliminación de archivos
 */

const path = require('path');
const fs = require('fs').promises;
const logger = require('../../config/logger');
const ModeloDocumento = require('../modelos/ModeloDocumento');
const ModeloAuditoria = require('../modelos/ModeloAuditoria');

class ControladorDocumentos {
  /**
   * Obtiene todos los documentos
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.query.limite - Límite de resultados (paginación)
   * @param {number} req.query.pagina - Número de página
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerTodos(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 20;
      const pagina = parseInt(req.query.pagina) || 1;
      const offset = (pagina - 1) * limite;

      const documentos = await ModeloDocumento.obtenerTodos({
        usuario_id: req.usuario?.id,
        estado: 'activo',
        limite,
        offset
      });

      res.json({
        mensaje: 'Documentos obtenidos correctamente',
        total: documentos.length,
        pagina,
        limite,
        documentos
      });
    } catch (error) {
      logger.error(`Error al obtener documentos: ${error.message}`);
      res.status(500).json({
        error: 'Error al obtener documentos'
      });
    }
  }

  /**
   * Obtiene un documento específico por ID
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del documento
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const documento = await ModeloDocumento.obtenerPorId(id);

      if (!documento) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      res.json({
        mensaje: 'Documento obtenido correctamente',
        documento
      });
    } catch (error) {
      logger.error(`Error al obtener documento: ${error.message}`);
      res.status(500).json({
        error: 'Error al obtener documento'
      });
    }
  }

  /**
   * Busca documentos por término
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {string} req.query.termino - Término de búsqueda
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async buscar(req, res) {
    try {
      const { termino } = req.query;

      if (!termino || termino.trim().length < 3) {
        return res.status(400).json({
          error: 'El término de búsqueda debe tener al menos 3 caracteres'
        });
      }

      const documentos = await ModeloDocumento.buscar(termino.trim());

      res.json({
        mensaje: 'Búsqueda realizada correctamente',
        total: documentos.length,
        termino,
        documentos
      });
    } catch (error) {
      logger.error(`Error al buscar documentos: ${error.message}`);
      res.status(500).json({
        error: 'Error al buscar documentos'
      });
    }
  }

  /**
   * Carga un documento nuevo
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} req.file - Archivo cargado (multer)
   * @param {string} req.body.titulo - Título del documento
   * @param {string} req.body.descripcion - Descripción
   * @param {string} req.body.tipo_documento - Tipo de documento
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async cargar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No se cargó ningún archivo'
        });
      }

      const { titulo, descripcion, tipo_documento } = req.body;

      if (!titulo || !tipo_documento) {
        // Limpiar archivo cargado
        await fs.unlink(req.file.path).catch(err => logger.error(err));
        return res.status(400).json({
          error: 'Título y tipo de documento son obligatorios'
        });
      }

      // Crear documento
      const idDocumento = await ModeloDocumento.crear({
        titulo,
        descripcion: descripcion || '',
        usuario_id: req.usuario.id,
        tipo_documento,
        ruta_archivo: req.file.path,
        tamaño_archivo: req.file.size,
        palabras_clave: ''
      });

      logger.info(`Documento cargado: ${titulo}`);

      res.status(201).json({
        mensaje: 'Documento cargado correctamente',
        documento_id: idDocumento,
        archivo: {
          nombre: req.file.filename,
          tamaño: req.file.size
        }
      });
    } catch (error) {
      logger.error(`Error al cargar documento: ${error.message}`);
      // Limpiar archivo cargado en caso de error
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => logger.error(err));
      }
      res.status(500).json({
        error: 'Error al cargar documento'
      });
    }
  }

  /**
   * Actualiza los datos de un documento
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del documento
   * @param {Object} req.body - Campos a actualizar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descripcion, palabras_clave } = req.body;

      // Verificar que el documento existe
      const documentoExistente = await ModeloDocumento.obtenerPorId(id);
      if (!documentoExistente) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      // Actualizar documento
      const actualizado = await ModeloDocumento.actualizar(id, {
        titulo,
        descripcion,
        palabras_clave
      });

      if (!actualizado) {
        return res.status(400).json({
          error: 'No se realizaron cambios'
        });
      }

      const documentoActualizado = await ModeloDocumento.obtenerPorId(id);

      res.json({
        mensaje: 'Documento actualizado correctamente',
        documento: documentoActualizado
      });
    } catch (error) {
      logger.error(`Error al actualizar documento: ${error.message}`);
      res.status(500).json({
        error: 'Error al actualizar documento'
      });
    }
  }

  /**
   * Descarga un documento
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del documento
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async descargar(req, res) {
    try {
      const { id } = req.params;

      // Obtener documento
      const documento = await ModeloDocumento.obtenerPorId(id);
      if (!documento) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      // Verificar que el archivo existe
      const rutaArchivo = documento.ruta_archivo;
      try {
        await fs.access(rutaArchivo);
      } catch (error) {
        logger.error(`Archivo no encontrado: ${rutaArchivo}`);
        return res.status(404).json({
          error: 'Archivo no encontrado en el servidor'
        });
      }

      // Incrementar descargas
      await ModeloDocumento.incrementarDescargas(id);

      // Registrar descarga en auditoría
      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'DESCARGAR',
          modulo: 'documentos',
          tabla_afectada: 'documentos',
          registro_id: id,
          descripcion: `Descarga de documento: ${documento.titulo}`,
          detalles_nuevos: {
            documento_id: id,
            titulo: documento.titulo,
            tipo: documento.tipo_documento,
            tamaño: documento.tamaño_archivo
          },
          ip_address: req.ip
        });
      } catch (errorAuditoria) {
        logger.error(`Error al registrar auditoría de descarga: ${errorAuditoria.message}`);
      }

      // Descargar archivo
      res.download(rutaArchivo, documento.titulo, (err) => {
        if (err) {
          logger.error(`Error al descargar archivo: ${err.message}`);
        } else {
          logger.info(`Documento descargado: ${documento.titulo}`);
        }
      });
    } catch (error) {
      logger.error(`Error al descargar documento: ${error.message}`);
      res.status(500).json({
        error: 'Error al descargar documento'
      });
    }
  }

  /**
   * Elimina un documento
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.id - ID del documento
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el documento existe
      const documentoExistente = await ModeloDocumento.obtenerPorId(id);
      if (!documentoExistente) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      // Eliminar documento
      const eliminado = await ModeloDocumento.eliminar(id);

      if (!eliminado) {
        return res.status(400).json({
          error: 'No se pudo eliminar el documento'
        });
      }

      logger.info(`Documento eliminado: ID ${id}`);

      res.json({
        mensaje: 'Documento eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar documento: ${error.message}`);
      res.status(500).json({
        error: 'Error al eliminar documento'
      });
    }
  }
}

module.exports = ControladorDocumentos;
