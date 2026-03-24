/**
 * Controlador de Archivos
 * 
 * Maneja carga, descarga y gestión de archivos PDF
 * Nivel final de la jerarquía TRD
 */

const logger = require('../../../config/logger');
const ModeloArchivo = require('../../modelos/trd/ModeloArchivo');
const ModeloTipoDocumental = require('../../modelos/trd/ModeloTipoDocumental');
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
      const { nombre_archivo, fecha_documento, estado, observaciones, subido_por } = req.body;

      // Validar que la solicitud tiene archivo
      if (!req.file) {
        return res.status(400).json({ exito: false, error: 'No se cargó archivo' });
      }

      // Solo PDF permitidos
      if (req.file.mimetype !== 'application/pdf') {
        await fs.unlink(req.file.path);
        return res.status(400).json({ exito: false, error: 'Solo archivos PDF permitidos' });
      }

      // Validar campos
      if (!nombre_archivo) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ exito: false, error: 'Nombre del archivo es obligatorio' });
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

      // Verificar que el archivo existe en el sistema de archivos
      const rutaArchivo = path.join(__dirname, '../../../', archivo.ruta_pdf);
      
      try {
        await fs.access(rutaArchivo);
      } catch {
        logger.error(`Archivo no encontrado en: ${rutaArchivo}`);
        return res.status(404).json({ exito: false, error: 'Archivo no disponible en servidor' });
      }

      logger.info(`Archivo descargado: ${archivo.nombre_archivo}`);

      res.download(rutaArchivo, archivo.nombre_archivo);
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
      const { nombre_archivo, estado, fecha_desde, fecha_hasta } = req.query;

      const archivos = await ModeloArchivo.buscar({
        nombre_archivo,
        estado,
        fecha_desde,
        fecha_hasta
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

      res.json({ exito: true, datos: { mensaje: 'Archivo desactivado' } });
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al desactivar' });
    }
  }
}

module.exports = ControladorArchivo;
