/**
 * Modelo de Auditoría
 * 
 * Maneja todas las operaciones relacionadas con el registro de auditoría
 * Permite registrar, consultar y filtrar acciones de usuario
 */

const { pool } = require('../../config/postgresqlTRD');
const logger = require('../../config/logger');

class ModeloAuditoria {
  /**
   * Registra una acción en el sistema
   * @async
   * @param {Object} datos - Objeto con datos de auditoría
   * @returns {Promise<Object>} Registro de auditoría creado
   */
  static async registrar(datos) {
    try {
      const {
        usuario_id,
        usuario_nombre,
        accion,
        modulo,
        tabla_afectada,
        registro_id,
        descripcion,
        detalles_anteriores,
        detalles_nuevos,
        ip_address
      } = datos;

      const resultado = await pool.query(
        `INSERT INTO auditoria (
          usuario_id, usuario_nombre, accion, modulo, tabla_afectada,
          registro_id, descripcion, detalles_anteriores, detalles_nuevos,
          ip_address, fecha_accion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING id, fecha_accion`,
        [
          usuario_id,
          usuario_nombre,
          accion,
          modulo,
          tabla_afectada,
          registro_id,
          descripcion,
          detalles_anteriores ? JSON.stringify(detalles_anteriores) : null,
          detalles_nuevos ? JSON.stringify(detalles_nuevos) : null,
          ip_address
        ]
      );

      logger.info(`[AUDIT] ${usuario_nombre} - ${accion} en ${modulo}`);
      return resultado.rows[0];
    } catch (error) {
      logger.error(`Error al registrar auditoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de auditoría con filtros opcionales
   * @async
   * @param {Object} filtros - Objeto con filtros: usuario_id, accion, modulo, fecha_desde, fecha_hasta, limit, offset
   * @returns {Promise<Array>} Lista de registros
   */
  static async obtenerRegistros(filtros = {}) {
    try {
      let query = 'SELECT * FROM auditoria WHERE 1=1';
      let params = [];
      let paramCount = 1;

      if (filtros.usuario_id) {
        query += ` AND usuario_id = $${paramCount}`;
        params.push(filtros.usuario_id);
        paramCount++;
      }

      if (filtros.accion) {
        query += ` AND accion ILIKE $${paramCount}`;
        params.push(`%${filtros.accion}%`);
        paramCount++;
      }

      if (filtros.modulo) {
        query += ` AND modulo = $${paramCount}`;
        params.push(filtros.modulo);
        paramCount++;
      }

      if (filtros.fecha_desde) {
        query += ` AND fecha_accion >= $${paramCount}`;
        params.push(filtros.fecha_desde);
        paramCount++;
      }

      if (filtros.fecha_hasta) {
        query += ` AND fecha_accion <= $${paramCount}`;
        params.push(filtros.fecha_hasta);
        paramCount++;
      }

      query += ' ORDER BY fecha_accion DESC';

      if (filtros.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filtros.limit);
        paramCount++;
      } else {
        query += ` LIMIT 1000`;
      }

      if (filtros.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filtros.offset);
      }

      const resultado = await pool.query(query, params);
      return resultado.rows;
    } catch (error) {
      logger.error(`Error al obtener registros: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el total de registros de auditoría con filtros
   * @async
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<number>} Total de registros
   */
  static async obtenerTotal(filtros = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM auditoria WHERE 1=1';
      let params = [];
      let paramCount = 1;

      if (filtros.usuario_id) {
        query += ` AND usuario_id = $${paramCount}`;
        params.push(filtros.usuario_id);
        paramCount++;
      }

      if (filtros.accion) {
        query += ` AND accion ILIKE $${paramCount}`;
        params.push(`%${filtros.accion}%`);
        paramCount++;
      }

      if (filtros.modulo) {
        query += ` AND modulo = $${paramCount}`;
        params.push(filtros.modulo);
        paramCount++;
      }

      if (filtros.fecha_desde) {
        query += ` AND fecha_accion >= $${paramCount}`;
        params.push(filtros.fecha_desde);
        paramCount++;
      }

      if (filtros.fecha_hasta) {
        query += ` AND fecha_accion <= $${paramCount}`;
        params.push(filtros.fecha_hasta);
        paramCount++;
      }

      const resultado = await pool.query(query, params);
      return parseInt(resultado.rows[0].total);
    } catch (error) {
      logger.error(`Error al obtener total: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   * @async
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_acciones,
          COUNT(DISTINCT usuario_id) as usuarios_activos,
          COUNT(DISTINCT DATE(fecha_accion)) as dias_actividad,
          ARRAY_AGG(DISTINCT accion) as acciones_registradas
        FROM auditoria
        WHERE fecha_accion >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `;

      const resultado = await pool.query(query);
      return resultado.rows[0];
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas por usuario
   * @async
   * @returns {Promise<Array>} Actividad por usuario
   */
  static async obtenerActividadPorUsuario() {
    try {
      const query = `
        SELECT 
          usuario_id,
          usuario_nombre,
          COUNT(*) as total_acciones,
          MAX(fecha_accion) as ultima_actividad,
          ARRAY_AGG(DISTINCT accion) as acciones
        FROM auditoria
        WHERE fecha_accion >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY usuario_id, usuario_nombre
        ORDER BY total_acciones DESC
      `;

      const resultado = await pool.query(query);
      return resultado.rows;
    } catch (error) {
      logger.error(`Error al obtener actividad por usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpia registros de auditoría antiguos (> 90 días)
   * @async
   * @param {number} diasRetener - Días a retener (default 90)
   * @returns {Promise<number>} Registros eliminados
   */
  static async limpiar(diasRetener = 90) {
    try {
      const resultado = await pool.query(
        `DELETE FROM auditoria 
         WHERE fecha_accion < CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL
         RETURNING id`,
        [diasRetener]
      );

      logger.info(`Auditoría limpiada: ${resultado.rows.length} registros eliminados`);
      return resultado.rows.length;
    } catch (error) {
      logger.error(`Error al limpiar auditoría: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloAuditoria;
