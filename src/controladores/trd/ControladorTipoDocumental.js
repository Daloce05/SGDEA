/**
 * Controlador de Tipos Documentales
 * 
 * Maneja operaciones CRUD de tipos documentales
 * Punto de entrada para carga de archivos
 */

const logger = require('../../../config/logger');
const ModeloTipoDocumental = require('../../modelos/trd/ModeloTipoDocumental');
const ModeloSubserie = require('../../modelos/trd/ModeloSubserie');

class ControladorTipoDocumental {
  /**
   * Obtiene tipos de una subserie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorSubserie(req, res) {
    try {
      const { idSubserie } = req.params;

      // Verificar jerarquía
      const subserie = await ModeloSubserie.obtenerPorId(idSubserie);
      if (!subserie) {
        return res.status(404).json({ exito: false, error: 'Subserie no encontrada' });
      }

      const tipos = await ModeloTipoDocumental.obtenerPorSubserie(idSubserie);

      res.json({
        exito: true,
        datos: tipos
      });
    } catch (error) {
      logger.error(`Error al obtener tipos: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener tipos' });
    }
  }

  /**
   * Obtiene un tipo documental específico
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idTipo - ID del tipo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { idTipo } = req.params;

      const tipo = await ModeloTipoDocumental.obtenerPorId(idTipo);
      if (!tipo) {
        return res.status(404).json({ exito: false, error: 'Tipo documental no encontrado' });
      }

      res.json({
        exito: true,
        datos: tipo
      });
    } catch (error) {
      logger.error(`Error al obtener tipo: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener tipo' });
    }
  }

  /**
   * Crea un tipo documental bajo una subserie (REQUERIDO)
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSubserie - ID de la subserie contenedora
   * @param {Object} req.body - Datos del tipo documental
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async crear(req, res) {
    try {
      const { idSubserie } = req.params;
      const { codigo, nombre, descripcion } = req.body;

      if (!idSubserie || !nombre) {
        return res.status(400).json({ 
          exito: false, 
          error: 'Subserie y nombre son obligatorios' 
        });
      }

      // Validar que subserie existe
      const subserie = await ModeloSubserie.obtenerPorId(idSubserie);
      if (!subserie) {
        return res.status(404).json({ 
          exito: false, 
          error: 'Subserie no encontrada' 
        });
      }

      const idTipo = await ModeloTipoDocumental.crear(idSubserie, {
        codigo,
        nombre,
        descripcion
      });

      logger.info(`Tipo documental creado: ${nombre} en subserie ${idSubserie}`);

      res.status(201).json({
        exito: true,
        datos: { id_tipo: idTipo, nombre }
      });
    } catch (error) {
      logger.error(`Error al crear tipo documental: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({ 
          exito: false, 
          error: error.message 
        });
      }

      res.status(500).json({ 
        exito: false, 
        error: 'Error al crear tipo documental' 
      });
    }
  }

  /**
   * Actualiza un tipo documental
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { idTipo } = req.params;
      const { nombre, descripcion } = req.body;

      const tipo = await ModeloTipoDocumental.obtenerPorId(idTipo);
      if (!tipo) {
        return res.status(404).json({ exito: false, error: 'Tipo no encontrado' });
      }

      const actualizado = await ModeloTipoDocumental.actualizar(idTipo, {
        nombre,
        descripcion
      });

      if (!actualizado) {
        return res.status(400).json({ exito: false, error: 'Sin cambios' });
      }

      const tipoActualizado = await ModeloTipoDocumental.obtenerPorId(idTipo);

      res.json({
        exito: true,
        datos: tipoActualizado
      });
    } catch (error) {
      logger.error(`Error al actualizar: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al actualizar tipo' });
    }
  }

  /**
   * Desactiva un tipo documental
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { idTipo } = req.params;

      const tipo = await ModeloTipoDocumental.obtenerPorId(idTipo);
      if (!tipo) {
        return res.status(404).json({ exito: false, error: 'Tipo no encontrado' });
      }

      const desactivado = await ModeloTipoDocumental.desactivar(idTipo);

      if (!desactivado) {
        return res.status(400).json({ exito: false, error: 'No se pudo desactivar' });
      }

      logger.info(`Tipo desactivado: ${idTipo}`);

      res.json({ exito: true, datos: { mensaje: 'Tipo desactivado' } });
    } catch (error) {
      logger.error(`Error al desactivar: ${error.message}`);
      res.status(500).json({ exito: false, error: error.message || 'Error' });
    }
  }
}

module.exports = ControladorTipoDocumental;
