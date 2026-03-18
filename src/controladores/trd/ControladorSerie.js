/**
 * Controlador de Series Documentales
 * 
 * Maneja operaciones CRUD de series
 * Gestiona el nivel 1 de la jerarquía TRD
 */

const logger = require('../../../config/logger');
const ModeloSerie = require('../../modelos/trd/ModeloSerie');

class ControladorSerie {
  /**
   * Obtiene todas las series de una oficina
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorOficina(req, res) {
    try {
      const { idOficina } = req.params;
      
      const series = await ModeloSerie.obtenerTodas(idOficina);

      res.json({
        exito: true,
        datos: series
      });
    } catch (error) {
      logger.error(`Error al obtener series de oficina: ${error.message}`);
      res.status(500).json({ 
        exito: false,
        error: 'Error al obtener series' 
      });
    }
  }

  /**
   * Obtiene todas las series
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerTodas(req, res) {
    try {
      const series = await ModeloSerie.obtenerTodas();

      res.json({
        exito: true,
        datos: series
      });
    } catch (error) {
      logger.error(`Error al obtener series: ${error.message}`);
      res.status(500).json({ 
        exito: false,
        error: 'Error al obtener series' 
      });
    }
  }

  /**
   * Obtiene una serie específica con sus subseries
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { idSerie } = req.params;

      const serie = await ModeloSerie.obtenerPorId(idSerie);

      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const estadisticas = await ModeloSerie.obtenerEstadisticas(idSerie);

      res.json({
        exito: true,
        datos: { ...serie, estadisticas }
      });
    } catch (error) {
      logger.error(`Error al obtener serie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener serie' });
    }
  }

  /**
   * Crea una nueva serie (REQUIERE id_oficina)
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina contenedora
   * @param {Object} req.body - Datos de la serie
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async crear(req, res) {
    try {
      const { idOficina } = req.params;
      const { codigo, nombre, tiempo_gestion, tiempo_central, descripcion } = req.body;

      // Validar campos obligatorios
      if (!idOficina || !codigo || !nombre) {
        return res.status(400).json({
          exito: false,
          error: 'Oficina, código y nombre son obligatorios'
        });
      }

      const idSerie = await ModeloSerie.crear(idOficina, {
        codigo,
        nombre,
        tiempo_gestion: tiempo_gestion || 0,
        tiempo_central: tiempo_central || 0,
        descripcion
      });

      logger.info(`Nueva serie creada: ${codigo} en oficina ${idOficina}`);

      res.status(201).json({
        exito: true,
        datos: { id_serie: idSerie, codigo, nombre }
      });
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return res.status(409).json({ 
          exito: false, 
          error: error.message 
        });
      }

      if (error.message.includes('no existe')) {
        return res.status(404).json({ 
          exito: false, 
          error: error.message 
        });
      }

      logger.error(`Error al crear serie: ${error.message}`);
      res.status(500).json({ 
        exito: false, 
        error: 'Error al crear serie' 
      });
    }
  }

  /**
   * Crea una serie - ENDPOINT LEGACY (compatibilidad)
   * Acepta idOficina desde body en lugar de URL
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} req.body - Datos incluyendo id_oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async crearLegacy(req, res) {
    try {
      const { id_oficina, codigo, nombre, tiempo_gestion, tiempo_central, descripcion } = req.body;

      // Validar campos obligatorios
      if (!id_oficina || !codigo || !nombre) {
        return res.status(400).json({
          exito: false,
          error: 'ID oficina, código y nombre son obligatorios'
        });
      }

      const idSerie = await ModeloSerie.crear(id_oficina, {
        codigo,
        nombre,
        tiempo_gestion: tiempo_gestion || 0,
        tiempo_central: tiempo_central || 0,
        descripcion
      });

      logger.info(`Nueva serie creada (legacy): ${codigo} en oficina ${id_oficina}`);

      res.status(201).json({
        exito: true,
        datos: { id_serie: idSerie, codigo, nombre }
      });
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return res.status(409).json({ 
          exito: false, 
          error: error.message 
        });
      }

      if (error.message.includes('no existe')) {
        return res.status(404).json({ 
          exito: false, 
          error: error.message 
        });
      }

      logger.error(`Error al crear serie (legacy): ${error.message}`);
      res.status(500).json({ 
        exito: false, 
        error: 'Error al crear serie' 
      });
    }
  }

  /**
   * Actualiza una serie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { idSerie } = req.params;
      const { nombre, tiempo_gestion, tiempo_central, descripcion } = req.body;

      // Verificar que existe
      const serie = await ModeloSerie.obtenerPorId(idSerie);
      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const actualizado = await ModeloSerie.actualizar(idSerie, {
        nombre,
        tiempo_gestion,
        tiempo_central,
        descripcion
      });

      if (!actualizado) {
        return res.status(400).json({ exito: false, error: 'No se realizaron cambios' });
      }

      const serieActualizada = await ModeloSerie.obtenerPorId(idSerie);

      res.json({
        exito: true,
        datos: serieActualizada
      });
    } catch (error) {
      logger.error(`Error al actualizar serie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al actualizar serie' });
    }
  }

  /**
   * Desactiva una serie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { idSerie } = req.params;

      const serie = await ModeloSerie.obtenerPorId(idSerie);
      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const desactivado = await ModeloSerie.desactivar(idSerie);

      if (!desactivado) {
        return res.status(400).json({ exito: false, error: 'No se pudo desactivar la serie' });
      }

      logger.info(`Serie desactivada: ${idSerie}`);

      res.json({ exito: true, datos: { mensaje: 'Serie desactivada' } });
    } catch (error) {
      if (error.message.includes('subseries activas')) {
        return res.status(400).json({ exito: false, error: error.message });
      }

      logger.error(`Error al desactivar serie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al desactivar serie' });
    }
  }
}

module.exports = ControladorSerie;
