/**
 * Controlador de Oficinas
 * 
 * Maneja operaciones CRUD de oficinas
 * Gestiona el nivel raíz (0) de la jerarquía TRD
 */

const logger = require('../../../config/logger');
const ModeloOficina = require('../../modelos/trd/ModeloOficina');
const ModeloAuditoria = require('../../modelos/ModeloAuditoria');

class ControladorOficina {
  /**
   * Obtiene todas las oficinas
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerTodas(req, res) {
    try {
      const oficinas = await ModeloOficina.obtenerTodas();

      res.json({
        exito: true,
        datos: oficinas
      });
    } catch (error) {
      logger.error(`Error al obtener oficinas: ${error.message}`);
      res.status(500).json({ 
        exito: false,
        error: 'Error al obtener oficinas' 
      });
    }
  }

  /**
   * Obtiene una oficina específica con sus series
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorId(req, res) {
    try {
      const { idOficina } = req.params;

      const oficina = await ModeloOficina.obtenerPorId(idOficina);

      if (!oficina) {
        return res.status(404).json({ 
          exito: false, 
          error: 'Oficina no encontrada' 
        });
      }

      res.json({
        exito: true,
        datos: oficina
      });
    } catch (error) {
      logger.error(`Error al obtener oficina: ${error.message}`);
      res.status(500).json({ 
        exito: false, 
        error: 'Error al obtener oficina' 
      });
    }
  }

  /**
   * Obtiene una oficina por código
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {string} req.params.codigo - Código de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPorCodigo(req, res) {
    try {
      const { codigo } = req.params;

      const oficina = await ModeloOficina.obtenerPorCodigo(codigo);

      if (!oficina) {
        return res.status(404).json({ 
          exito: false, 
          error: 'Oficina no encontrada' 
        });
      }

      res.json({
        exito: true,
        datos: oficina
      });
    } catch (error) {
      logger.error(`Error al obtener oficina por código: ${error.message}`);
      res.status(500).json({ 
        exito: false, 
        error: 'Error al obtener oficina' 
      });
    }
  }

  /**
   * Crea una nueva oficina
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {Object} req.body - Datos de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async crear(req, res) {
    try {
      const { codigo_oficina, nombre_oficina, dependencia } = req.body;

      // Validar campos obligatorios
      if (!codigo_oficina || !nombre_oficina) {
        return res.status(400).json({
          exito: false,
          error: 'Código de oficina y nombre son obligatorios'
        });
      }

      const idOficina = await ModeloOficina.crear({
        codigo_oficina,
        nombre_oficina,
        dependencia
      });

      logger.info(`Nueva oficina creada: ${codigo_oficina} - ${nombre_oficina}`);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'CREAR',
          modulo: 'trd',
          tabla_afectada: 'oficina',
          registro_id: idOficina,
          descripcion: `Creación de oficina: ${codigo_oficina} - ${nombre_oficina}`,
          detalles_nuevos: { codigo_oficina, nombre_oficina, dependencia },
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.status(201).json({
        exito: true,
        datos: { 
          id_oficina: idOficina, 
          codigo_oficina, 
          nombre_oficina 
        }
      });
    } catch (error) {
      logger.error(`Error al crear oficina: ${error.message}`);
      
      if (error.message.includes('ya existe')) {
        return res.status(409).json({ 
          exito: false,
          error: error.message 
        });
      }

      res.status(500).json({ 
        exito: false,
        error: 'Error al crear oficina' 
      });
    }
  }

  /**
   * Actualiza una oficina
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async actualizar(req, res) {
    try {
      const { idOficina } = req.params;
      const { nombre_oficina, dependencia } = req.body;

      const oficina = await ModeloOficina.actualizar(idOficina, {
        nombre_oficina,
        dependencia
      });

      logger.info(`Oficina actualizada: ID ${idOficina}`);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'ACTUALIZAR',
          modulo: 'trd',
          tabla_afectada: 'oficina',
          registro_id: idOficina,
          descripcion: `Actualización de oficina ID: ${idOficina}`,
          detalles_nuevos: { nombre_oficina, dependencia },
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.json({
        exito: true,
        datos: oficina
      });
    } catch (error) {
      logger.error(`Error al actualizar oficina: ${error.message}`);
      
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ 
          exito: false,
          error: error.message 
        });
      }

      res.status(500).json({ 
        exito: false,
        error: 'Error al actualizar oficina' 
      });
    }
  }

  /**
   * Desactiva una oficina
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivar(req, res) {
    try {
      const { idOficina } = req.params;

      await ModeloOficina.desactivar(idOficina);

      logger.info(`Oficina desactivada: ID ${idOficina}`);

      try {
        await ModeloAuditoria.registrar({
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre || req.usuario.username,
          accion: 'ELIMINAR',
          modulo: 'trd',
          tabla_afectada: 'oficina',
          registro_id: idOficina,
          descripcion: `Desactivación de oficina ID: ${idOficina}`,
          ip_address: req.ip
        });
      } catch (e) { logger.error(`Error auditoría: ${e.message}`); }

      res.json({
        exito: true,
        mensaje: 'Oficina desactivada correctamente'
      });
    } catch (error) {
      logger.error(`Error al desactivar oficina: ${error.message}`);
      
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ 
          exito: false,
          error: error.message 
        });
      }

      if (error.message.includes('series activas')) {
        return res.status(409).json({ 
          exito: false,
          error: error.message 
        });
      }

      res.status(500).json({ 
        exito: false,
        error: 'Error al desactivar oficina' 
      });
    }
  }

  /**
   * Obtiene la jerarquía completa de una oficina
   * @async
   * @param {Object} req - Objeto de petición Express
   * @param {number} req.params.idOficina - ID de la oficina
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerJerarquia(req, res) {
    try {
      const { idOficina } = req.params;

      const jerarquia = await ModeloOficina.obtenerJerarquiaCompleta(idOficina);

      if (!jerarquia) {
        return res.status(404).json({ 
          exito: false, 
          error: 'Oficina no encontrada' 
        });
      }

      res.json({
        exito: true,
        datos: jerarquia
      });
    } catch (error) {
      logger.error(`Error al obtener jerarquía: ${error.message}`);
      res.status(500).json({ 
        exito: false, 
        error: 'Error al obtener jerarquía' 
      });
    }
  }
}

module.exports = ControladorOficina;
