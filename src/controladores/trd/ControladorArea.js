/**
 * Controlador de Áreas
 * 
 * Maneja operaciones CRUD de áreas y la visualización
 * del dashboard jerárquico por áreas.
 */

const logger = require('../../../config/logger');
const ModeloArea = require('../../modelos/trd/ModeloArea');
const registrarAuditoria = require('../../utilidades/auditoria');

class ControladorArea {
  /**
   * Obtiene todas las áreas activas
   */
  static async obtenerTodas(req, res) {
    try {
      const areas = await ModeloArea.obtenerTodas();

      res.json({
        exito: true,
        datos: areas
      });
    } catch (error) {
      logger.error(`Error al obtener áreas: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener áreas'
      });
    }
  }

  /**
   * Obtiene un área específica con sus series
   */
  static async obtenerPorId(req, res) {
    try {
      const { idArea } = req.params;

      const area = await ModeloArea.obtenerPorId(idArea);

      if (!area) {
        return res.status(404).json({
          exito: false,
          error: 'Área no encontrada'
        });
      }

      res.json({
        exito: true,
        datos: area
      });
    } catch (error) {
      logger.error(`Error al obtener área: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener área'
      });
    }
  }

  /**
   * Obtiene la jerarquía completa de un área
   */
  static async obtenerJerarquia(req, res) {
    try {
      const { idArea } = req.params;

      const resultado = await ModeloArea.obtenerJerarquia(idArea);

      if (!resultado) {
        return res.status(404).json({
          exito: false,
          error: 'Área no encontrada'
        });
      }

      res.json({
        exito: true,
        datos: resultado
      });
    } catch (error) {
      logger.error(`Error al obtener jerarquía del área: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener jerarquía del área'
      });
    }
  }

  /**
   * Crea una nueva área (solo administrador)
   */
  static async crear(req, res) {
    try {
      const { codigo_area, nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion } = req.body;

      if (!codigo_area || !nombre_area) {
        return res.status(400).json({
          exito: false,
          error: 'Código y nombre del área son obligatorios'
        });
      }

      const idArea = await ModeloArea.crear({
        codigo_area,
        nombre_area,
        dependencia_productora,
        oficina_productora,
        codigo_oficina,
        descripcion
      });

      await registrarAuditoria(req, {
        accion: 'CREAR',
        modulo: 'trd',
        tabla_afectada: 'area',
        registro_id: idArea,
        descripcion: `Creación de área: ${codigo_area} - ${nombre_area}`,
        detalles_nuevos: { codigo_area, nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion }
      });

      res.status(201).json({
        exito: true,
        datos: {
          id_area: idArea,
          codigo_area,
          nombre_area
        }
      });
    } catch (error) {
      logger.error(`Error al crear área: ${error.message}`);

      if (error.message.includes('ya existe')) {
        return res.status(409).json({
          exito: false,
          error: error.message
        });
      }

      res.status(500).json({
        exito: false,
        error: 'Error al crear área'
      });
    }
  }

  /**
   * Actualiza un área (solo administrador)
   */
  static async actualizar(req, res) {
    try {
      const { idArea } = req.params;
      const { nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion } = req.body;

      const area = await ModeloArea.actualizar(idArea, {
        nombre_area,
        dependencia_productora,
        oficina_productora,
        codigo_oficina,
        descripcion
      });

      await registrarAuditoria(req, {
        accion: 'ACTUALIZAR',
        modulo: 'trd',
        tabla_afectada: 'area',
        registro_id: parseInt(idArea),
        descripcion: `Actualización de área ID: ${idArea}`,
        detalles_nuevos: { nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion }
      });

      res.json({
        exito: true,
        datos: area
      });
    } catch (error) {
      logger.error(`Error al actualizar área: ${error.message}`);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          exito: false,
          error: error.message
        });
      }

      res.status(500).json({
        exito: false,
        error: 'Error al actualizar área'
      });
    }
  }

  /**
   * Desactiva un área (solo administrador)
   */
  static async desactivar(req, res) {
    try {
      const { idArea } = req.params;

      await ModeloArea.desactivar(idArea);

      await registrarAuditoria(req, {
        accion: 'ELIMINAR',
        modulo: 'trd',
        tabla_afectada: 'area',
        registro_id: parseInt(idArea),
        descripcion: `Desactivación de área ID: ${idArea}`
      });

      res.json({
        exito: true,
        mensaje: 'Área desactivada correctamente. Las series asociadas han sido desvinculadas.'
      });
    } catch (error) {
      logger.error(`Error al desactivar área: ${error.message}`);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          exito: false,
          error: error.message
        });
      }

      res.status(500).json({
        exito: false,
        error: 'Error al desactivar área'
      });
    }
  }

  /**
   * Asocia una serie existente a un área (solo administrador)
   */
  static async asociarSerie(req, res) {
    try {
      const { idArea, idSerie } = req.params;

      await ModeloArea.asociarSerie(parseInt(idArea), parseInt(idSerie));

      await registrarAuditoria(req, {
        accion: 'ACTUALIZAR',
        modulo: 'trd',
        tabla_afectada: 'serie',
        registro_id: parseInt(idSerie),
        descripcion: `Serie ${idSerie} asociada al área ${idArea}`,
        detalles_nuevos: { id_area: idArea, id_serie: idSerie }
      });

      res.json({
        exito: true,
        mensaje: 'Serie asociada al área correctamente'
      });
    } catch (error) {
      logger.error(`Error al asociar serie: ${error.message}`);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          exito: false,
          error: error.message
        });
      }

      res.status(500).json({
        exito: false,
        error: 'Error al asociar serie al área'
      });
    }
  }

  /**
   * Desasocia una serie de un área (solo administrador)
   */
  static async desasociarSerie(req, res) {
    try {
      const { idArea, idSerie } = req.params;

      await ModeloArea.desasociarSerie(parseInt(idArea), parseInt(idSerie));

      await registrarAuditoria(req, {
        accion: 'ACTUALIZAR',
        modulo: 'trd',
        tabla_afectada: 'serie',
        registro_id: parseInt(idSerie),
        descripcion: `Serie ${idSerie} desasociada del área ${idArea}`
      });

      res.json({
        exito: true,
        mensaje: 'Serie desasociada del área correctamente'
      });
    } catch (error) {
      logger.error(`Error al desasociar serie: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al desasociar serie del área'
      });
    }
  }
}

module.exports = ControladorArea;
