/**
 * Controlador de Subseries
 * 
 * Maneja operaciones CRUD de subseries
 * Valida que pertenezcan a series activas
 */

const logger = require('../../../config/logger');
const ModeloSubserie = require('../../modelos/trd/ModeloSubserie');
const ModeloSerie = require('../../modelos/trd/ModeloSerie');
const ModeloAuditoria = require('../../modelos/ModeloAuditoria');

class ControladorSubserie {
  /**
   * Obtiene subseries de una serie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie padre
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorSerie(req, res) {
    try {
      const { idSerie } = req.params;

      // Verificar que la serie existe
      const serie = await ModeloSerie.obtenerPorId(idSerie);
      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const subseries = await ModeloSubserie.obtenerPorSerie(idSerie);

      res.json({
        exito: true,
        datos: subseries
      });
    } catch (error) {
      logger.error(`Error al obtener subseries: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener subseries' });
    }
  }

  /**
   * Obtiene una subserie específica
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie
   * @param {number} req.params.idSubserie - ID de la subserie
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { idSerie, idSubserie } = req.params;

      // Verificar que la serie existe
      const serie = await ModeloSerie.obtenerPorId(idSerie);
      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const subserie = await ModeloSubserie.obtenerPorId(idSubserie);
      if (!subserie || subserie.id_serie != idSerie) {
        return res.status(404).json({ exito: false, error: 'Subserie no encontrada' });
      }

      res.json({
        exito: true,
        datos: subserie
      });
    } catch (error) {
      logger.error(`Error al obtener subserie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al obtener subserie' });
    }
  }

  /**
   * Crea una subserie bajo una serie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idSerie - ID de la serie padre
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async crear(req, res) {
    try {
      const { idSerie } = req.params;
      const { codigo, nombre, descripcion } = req.body;

      // Validar campos
      if (!codigo || !nombre) {
        return res.status(400).json({
          exito: false,
          error: 'Código y nombre son obligatorios'
        });
      }

      // Verificar que la serie existe
      const serie = await ModeloSerie.obtenerPorId(idSerie);
      if (!serie) {
        return res.status(404).json({ exito: false, error: 'Serie no encontrada' });
      }

      const idSubserie = await ModeloSubserie.crear(idSerie, {
        codigo,
        nombre,
        descripcion
      });

      logger.info(`Nueva subserie creada: ${codigo} bajo serie ${idSerie}`);

      const subsierieCreada = await ModeloSubserie.obtenerPorId(idSubserie);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'CREAR',
          modulo: 'trd',
          tabla_afectada: 'subserie',
          registro_id: idSubserie,
          descripcion: `Creación de subserie: ${codigo} - ${nombre}`,
          detalles_nuevos: { codigo, nombre, descripcion, id_serie: idSerie },
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.status(201).json({
        exito: true,
        datos: subsierieCreada
      });
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return res.status(400).json({ exito: false, error: error.message });
      }

      logger.error(`Error al crear subserie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al crear subserie' });
    }
  }

  /**
   * Actualiza una subserie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { idSerie, idSubserie } = req.params;
      const { nombre, descripcion } = req.body;

      // Verificar jerarquía
      const subserie = await ModeloSubserie.obtenerPorId(idSubserie);
      if (!subserie || subserie.id_serie != idSerie) {
        return res.status(404).json({ exito: false, error: 'Subserie no encontrada' });
      }

      const actualizado = await ModeloSubserie.actualizar(idSubserie, {
        nombre,
        descripcion
      });

      if (!actualizado) {
        return res.status(400).json({ exito: false, error: 'No se realizaron cambios' });
      }

      const subsierieActualizada = await ModeloSubserie.obtenerPorId(idSubserie);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'ACTUALIZAR',
          modulo: 'trd',
          tabla_afectada: 'subserie',
          registro_id: idSubserie,
          descripcion: `Actualización de subserie ID: ${idSubserie}`,
          detalles_nuevos: { nombre, descripcion },
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.json({
        exito: true,
        datos: subsierieActualizada
      });
    } catch (error) {
      logger.error(`Error al actualizar subserie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al actualizar subserie' });
    }
  }

  /**
   * Desactiva una subserie
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { idSubserie } = req.params;

      const subserie = await ModeloSubserie.obtenerPorId(idSubserie);
      if (!subserie) {
        return res.status(404).json({ exito: false, error: 'Subserie no encontrada' });
      }

      const desactivado = await ModeloSubserie.desactivar(idSubserie);

      if (!desactivado) {
        return res.status(400).json({ exito: false, error: 'No se pudo desactivar' });
      }

      logger.info(`Subserie desactivada: ${idSubserie}`);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'ELIMINAR',
          modulo: 'trd',
          tabla_afectada: 'subserie',
          registro_id: idSubserie,
          descripcion: `Desactivación de subserie: ${subserie.nombre || idSubserie}`,
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.json({ exito: true, datos: { mensaje: 'Subserie desactivada' } });
    } catch (error) {
      if (error.message.includes('tipos documentales activos')) {
        return res.status(400).json({ exito: false, error: error.message });
      }

      logger.error(`Error al desactivar subserie: ${error.message}`);
      res.status(500).json({ exito: false, error: 'Error al desactivar subserie' });
    }
  }
}

module.exports = ControladorSubserie;
