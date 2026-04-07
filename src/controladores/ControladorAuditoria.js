/**
 * Controlador de Auditoría
 * 
 * Maneja las peticiones HTTP para visualización y filtrado de registros
 * Acceso exclusivo para administrador
 */

const ModeloAuditoria = require('../modelos/ModeloAuditoria');
const ModeloUsuario = require('../modelos/ModeloUsuario');
const logger = require('../../config/logger');

class ControladorAuditoria {
  /**
   * Obtiene todos los registros de auditoría con paginación y filtros
   * @async
   */
  static async obtenerRegistros(req, res) {
    try {
      const {
        usuario_id,
        accion,
        modulo,
        fecha_desde,
        fecha_hasta,
        pagina = 1,
        limite = 50
      } = req.query;

      const offset = (pagina - 1) * limite;

      const filtros = {
        usuario_id: usuario_id ? parseInt(usuario_id) : null,
        accion,
        modulo,
        fecha_desde,
        fecha_hasta,
        limit: parseInt(limite),
        offset: offset
      };

      // Filtrar valores null
      Object.keys(filtros).forEach(key => filtros[key] === null && delete filtros[key]);

      const registros = await ModeloAuditoria.obtenerRegistros(filtros);
      const total = await ModeloAuditoria.obtenerTotal(filtros);

      res.json({
        exito: true,
        datos: {
          registros,
          total,
          paginas: Math.ceil(total / limite),
          pagina_actual: pagina
        }
      });
    } catch (error) {
      logger.error(`Error al obtener registros: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener registros de auditoría'
      });
    }
  }

  /**
   * Obtiene estadísticas generales de auditoría
   * @async
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await ModeloAuditoria.obtenerEstadisticas();
      const actividadPorUsuario = await ModeloAuditoria.obtenerActividadPorUsuario();

      res.json({
        exito: true,
        datos: {
          estadisticas,
          actividad_por_usuario: actividadPorUsuario
        }
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Exporta registros de auditoría a CSV
   * @async
   */
  static async exportarCSV(req, res) {
    try {
      const {
        usuario_id,
        accion,
        modulo,
        fecha_desde,
        fecha_hasta
      } = req.query;

      const filtros = {
        usuario_id: usuario_id ? parseInt(usuario_id) : null,
        accion,
        modulo,
        fecha_desde,
        fecha_hasta,
        limit: 10000
      };

      Object.keys(filtros).forEach(key => filtros[key] === null && delete filtros[key]);

      const registros = await ModeloAuditoria.obtenerRegistros(filtros);

      // Convertir a CSV
      let csv = 'ID,Usuario,Acción,Módulo,Tabla Afectada,Descripción,Fecha,IP\n';
      registros.forEach(reg => {
        csv += `${reg.id},"${reg.usuario_nombre}","${reg.accion}","${reg.modulo}","${reg.tabla_afectada || ''}","${(reg.descripcion || '').replace(/"/g, '""')}","${reg.fecha_accion}","${reg.ip_address || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="auditoria.csv"');
      res.send(csv);
    } catch (error) {
      logger.error(`Error al exportar CSV: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al exportar registro'
      });
    }
  }

  /**
   * Limpia registros antiguos de auditoría
   * @async
   */
  static async limpiar(req, res) {
    try {
      const { dias = 90 } = req.body;

      const eliminados = await ModeloAuditoria.limpiar(dias);

      logger.warn(`[ADMIN] ${req.usuario.nombre} limpió auditoría: ${eliminados} registros`);

      res.json({
        exito: true,
        datos: {
          registros_eliminados: eliminados,
          mensaje: `Se eliminaron ${eliminados} registros de auditoría`
        }
      });
    } catch (error) {
      logger.error(`Error al limpiar auditoría: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al limpiar auditoría'
      });
    }
  }
}

module.exports = ControladorAuditoria;
