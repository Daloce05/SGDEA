/**
 * Controlador de Archivos
 * 
 * Maneja carga, descarga y gestión de archivos PDF
 * Nivel final de la jerarquía TRD
 */

const logger = require('../../../config/logger');
const ModeloArchivo = require('../../modelos/trd/ModeloArchivo');
const ModeloTipoDocumental = require('../../modelos/trd/ModeloTipoDocumental');
const ModeloAuditoria = require('../../modelos/ModeloAuditoria');
const fs = require('fs').promises;
const path = require('path');

class ControladorArchivo {
  /**
   * Obtiene archivos de un tipo documental
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idTipo - ID del tipo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorTipo(req, res) {
    try {
      const { idTipo } = req.params;

      // Verificar que el tipo existe
      const tipo = await ModeloTipoDocumental.obtenerPorId(idTipo);
      if (!tipo) {
        return res.status(404).json({ exito: false, error: 'Tipo documental no encontrado' });
      }

      const archivos = await ModeloArchivo.obtenerPorTipo(idTipo);

      res.json({
        exito: true,
        datos: archivos
      });
    } catch (error) {
      logger.error(`Error al obtener archivos: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener archivos' });
    }
  }

  /**
   * Obtiene un archivo específico
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idArchivo - ID del archivo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { idArchivo } = req.params;

      const archivo = await ModeloArchivo.obtenerPorId(idArchivo);
      if (!archivo) {
        return res.status(404).json({ exito: false, error: 'Archivo no encontrado' });
      }

      res.json({
        exito: true,
        datos: archivo
      });
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener archivo' });
    }
  }

  /**
   * Carga un archivo PDF
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idTipo - ID del tipo documental
   * @param {Object} req.file - Archivo cargado por multer
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async cargar(req, res) {
    try {
      const { idTipo } = req.params;
      let { nombre_archivo, fecha_documento, estado, observaciones, subido_por } = req.body;

      // Validar que la solicitud tiene archivo
      if (!req.file) {
        return res.status(400).json({ exito: false, error: 'No se cargó archivo' });
      }

      // Solo PDF permitidos
      if (req.file.mimetype !== 'application/pdf') {
        await fs.unlink(req.file.path);
        return res.status(400).json({ exito: false, error: 'Solo archivos PDF permitidos' });
      }

      // Si no se proporciona nombre_archivo, usar el nombre original del archivo
      if (!nombre_archivo) {
        nombre_archivo = req.file.originalname.replace('.pdf', '').replace(/\.[^.]*$/, '');
      }

      // Verificar tipo existe
      const tipo = await ModeloTipoDocumental.obtenerPorId(idTipo);
      if (!tipo) {
        await fs.unlink(req.file.path);
        return res.status(404).json({ exito: false, error: 'Tipo documental no encontrado' });
      }

      // Leer contenido del archivo
      const contenido = await fs.readFile(req.file.path);

      // Crear archivo en BD
      const resultado = await ModeloArchivo.crear(idTipo, {
        nombre_archivo,
        fecha_documento,
        estado: estado || 'digital',
        observaciones,
        subido_por: subido_por || 'sistema'
      }, contenido);

      // Guardar archivo en la ruta final
      const rutaFinal = path.join(__dirname, '../../../documentos/trd', resultado.nombre);
      await fs.mkdir(path.dirname(rutaFinal), { recursive: true });
      await fs.copyFile(req.file.path, rutaFinal);
      await fs.unlink(req.file.path);

      logger.info(`Archivo cargado: ${nombre_archivo} (${resultado.id})`);

      const archivoCreado = await ModeloArchivo.obtenerPorId(resultado.id);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'CREAR',
          modulo: 'trd',
          tabla_afectada: 'archivos',
          registro_id: resultado.id,
          descripcion: `Carga de archivo: ${nombre_archivo}`,
          detalles_nuevos: { nombre_archivo, estado: estado || 'digital', id_tipo: idTipo },
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.status(201).json({
        exito: true,
        datos: archivoCreado
      });
    } catch (error) {
      // Limpiar archivo en caso de error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      logger.error(`Error al cargar archivo: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al cargar archivo' });
    }
  }

  /**
   * Descarga un archivo
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idArchivo - ID del archivo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async descargar(req, res) {
    try {
      const { idArchivo } = req.params;

      const archivo = await ModeloArchivo.obtenerPorId(idArchivo);
      if (!archivo) {
        return res.status(404).json({ exito: false, error: 'Archivo no encontrado' });
      }

      // Construir la ruta del archivo - quitando la barra inicial si existe
      const rutaRelativa = archivo.ruta_pdf.startsWith('/') 
        ? archivo.ruta_pdf.substring(1) 
        : archivo.ruta_pdf;
      
      const rutaArchivo = path.join(__dirname, '../../../', rutaRelativa);
      
      try {
        await fs.access(rutaArchivo);
      } catch {
        logger.error(`Archivo no encontrado en: ${rutaArchivo}`);
        return res.status(404).json({ exito: false, error: 'Archivo no disponible en servidor' });
      }

      // Asegurar que el nombre tenga extensión .pdf
      const nombreDescarga = archivo.nombre_original.endsWith('.pdf') 
        ? archivo.nombre_original 
        : `${archivo.nombre_original}.pdf`;

      // Registrar descarga en auditoría
      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario?.id || null,
          usuario_nombre: req.usuario?.nombre || req.usuario?.username || 'anónimo',
          accion: 'DESCARGAR',
          modulo: 'trd',
          tabla_afectada: 'archivos',
          registro_id: idArchivo,
          descripcion: `Descarga de archivo TRD: ${nombreDescarga}`,
          detalles_nuevos: {
            archivo_id: idArchivo,
            nombre: nombreDescarga,
            ruta: archivo.ruta_pdf
          },
          ip_address: req.ip
        });
      } catch (errorAuditoria) {
        logger.error(`Error al registrar auditoría de descarga: ${errorAuditoria.message}`);
      }

      // Configurar headers para PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreDescarga}"`);
      
      logger.info(`Archivo descargado: ${nombreDescarga}`);

      res.download(rutaArchivo, nombreDescarga);
    } catch (error) {
      logger.error(`Error al descargar: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al descargar' });
    }
  }

  /**
   * Busca archivos
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async buscar(req, res) {
    try {
      const { nombre, nombre_archivo, estado, fecha_desde, fecha_hasta, fechaInicio, fechaFin } = req.query;

      const archivos = await ModeloArchivo.buscar({
        termino: nombre || nombre_archivo,
        estado,
        fecha_desde: fecha_desde || fechaInicio,
        fecha_hasta: fecha_hasta || fechaFin
      });

      res.json({
        exito: true,
        datos: archivos,
        total: archivos.length
      });
    } catch (error) {
      logger.error(`Error al buscar: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error en búsqueda' });
    }
  }

  /**
   * Obtiene estadísticas de archivos
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async estadisticas(req, res) {
    try {
      const stats = await ModeloArchivo.obtenerEstadisticas();

      res.json({
        exito: true,
        datos: stats
      });
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener estadísticas' });
    }
  }

  /**
   * Desactiva un archivo
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idArchivo - ID del archivo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { idArchivo } = req.params;

      const archivo = await ModeloArchivo.obtenerPorId(idArchivo);
      if (!archivo) {
        return res.status(404).json({ exito: false, error: 'Archivo no encontrado' });
      }

      const desactivado = await ModeloArchivo.desactivar(idArchivo);

      if (!desactivado) {
        return res.status(400).json({ exito: false, error: 'No se pudo desactivar' });
      }

      logger.info(`Archivo desactivado: ${idArchivo}`);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'ELIMINAR',
          modulo: 'trd',
          tabla_afectada: 'archivos',
          registro_id: idArchivo,
          descripcion: `Desactivación de archivo: ${archivo.nombre_original || idArchivo}`,
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.json({ exito: true, datos: { mensaje: 'Archivo desactivado' } });
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al desactivar' });
    }
  }
}

module.exports = ControladorArchivo;
