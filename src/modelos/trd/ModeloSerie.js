/**
 * Modelo de Serie Documental
 * 
 * Nivel 1 de la jerarquía TRD
 * Una serie es el conjunto de documentos de la misma naturaleza
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');

class ModeloSerie {
  /**
   * Obtiene todas las series
   * @async
   * @param {number} [idOficina] - Opcional: filtrar por oficina
   * @returns {Promise<Array>} Lista de series
   */
  static async obtenerTodas(idOficina = null) {
    try {
      let consulta = `SELECT 
          s.id_serie,
          s.id_oficina,
          s.id_area,
          s.codigo,
          s.nombre,
          s.descripcion,
          s.tiempo_gestion as años_retencion,
          s.activo,
          s.fecha_creacion,
          s.fecha_actualizacion,
          o.codigo_oficina,
          o.nombre_oficina
         FROM serie s
         LEFT JOIN oficina o ON s.id_oficina = o.id_oficina
         WHERE s.activo = true`;
      
      const valores = [];
      if (idOficina) {
        consulta += ' AND s.id_oficina = $1';
        valores.push(idOficina);
      }
      consulta += ' ORDER BY s.codigo ASC';
      
      const resultado = await pool.query(consulta, valores);
      
      // Obtener estadísticas para cada serie
      const seriesConEstadisticas = await Promise.all(
        resultado.rows.map(async (serie) => {
          const subseries = await pool.query(
            'SELECT COUNT(*) as count FROM subserie WHERE id_serie = $1 AND activa = true',
            [serie.id_serie]
          );
          return {
            ...serie,
            estadisticas: {
              total_subseries: parseInt(subseries.rows[0].count)
            }
          };
        })
      );
      
      return seriesConEstadisticas;
    } catch (error) {
      logger.error(`Error al obtener series: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una serie por ID con sus subseries
   * @async
   * @param {number} idSerie - ID de la serie
   * @returns {Promise<Object|null>} Datos completos de la serie
   */
  static async obtenerPorId(idSerie) {
    try {
      // Obtener datos de la serie
      const serie = await pool.query(
        'SELECT * FROM serie WHERE id_serie = $1 AND activo = true',
        [idSerie]
      );

      if (serie.rows.length === 0) return null;

      // Obtener subseries asociadas
      const subseries = await pool.query(
        'SELECT * FROM subserie WHERE id_serie = $1 AND activa = true',
        [idSerie]
      );

      // Obtener disposición final
      const disposicion = await pool.query(
        'SELECT * FROM disposicion_final WHERE id_serie = $1',
        [idSerie]
      );

      return {
        ...serie.rows[0],
        subseries: subseries.rows,
        disposicion: disposicion.rows[0] || null
      };
    } catch (error) {
      logger.error(`Error al obtener serie por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva serie
   * @async
   * @param {number} idOficina - ID de la oficina contenedora (REQUERIDO)
   * @param {Object} datosSerie - Datos de la serie
   * @returns {Promise<number>} ID de la serie creada
   */
  static async crear(idOficina, datosSerie) {
    try {
      const { codigo, nombre, tiempo_gestion, tiempo_central, descripcion } = datosSerie;

      // Validar campos obligatorios
      if (!idOficina || !codigo || !nombre) {
        throw new Error('Oficina, código y nombre son obligatorios');
      }

      // Validar que la oficina exista
      const oficina = await pool.query(
        'SELECT id_oficina FROM oficina WHERE id_oficina = $1 AND activa = true',
        [idOficina]
      );

      if (oficina.rows.length === 0) {
        throw new Error(`Oficina ${idOficina} no existe o está inactiva`);
      }

      // Validar código único
      const existe = await pool.query(
        'SELECT id_serie FROM serie WHERE codigo = $1',
        [codigo]
      );

      if (existe.rows.length > 0) {
        throw new Error(`Código de serie ${codigo} ya existe`);
      }

      const resultado = await pool.query(
        `INSERT INTO serie 
         (id_oficina, codigo, nombre, tiempo_gestion, tiempo_central, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id_serie`,
        [idOficina, codigo, nombre, tiempo_gestion || 0, tiempo_central || 0, descripcion || '']
      );

      logger.info(`Serie creada: ${codigo} - ${nombre} en oficina ${idOficina}`);
      return resultado.rows[0].id_serie;
    } catch (error) {
      logger.error(`Error al crear serie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza una serie
   * @async
   * @param {number} idSerie - ID de la serie
   * @param {Object} actualizacion - Campos a actualizar
   * @returns {Promise<boolean>} true si se actualizó
   */
  static async actualizar(idSerie, actualizacion) {
    try {
      const campos = [];
      const valores = [];
      let contador = 1;

      if (actualizacion.nombre !== undefined) {
        campos.push(`nombre = $${contador++}`);
        valores.push(actualizacion.nombre);
      }
      if (actualizacion.tiempo_gestion !== undefined) {
        campos.push(`tiempo_gestion = $${contador++}`);
        valores.push(actualizacion.tiempo_gestion);
      }
      if (actualizacion.tiempo_central !== undefined) {
        campos.push(`tiempo_central = $${contador++}`);
        valores.push(actualizacion.tiempo_central);
      }
      if (actualizacion.descripcion !== undefined) {
        campos.push(`descripcion = $${contador++}`);
        valores.push(actualizacion.descripcion);
      }

      if (campos.length === 0) return false;

      campos.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
      valores.push(idSerie);

      const consulta = `UPDATE serie SET ${campos.join(', ')} 
                       WHERE id_serie = $${contador++} 
                       RETURNING id_serie`;

      const resultado = await pool.query(consulta, valores);

      logger.info(`Serie actualizada: ID ${idSerie}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al actualizar serie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva una serie (no puede eliminarse si tiene subseries activas)
   * @async
   * @param {number} idSerie - ID de la serie
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async desactivar(idSerie) {
    try {
      // Verificar si tiene subseries activas
      const subseries = await pool.query(
        'SELECT COUNT(*) FROM subserie WHERE id_serie = $1 AND activa = true',
        [idSerie]
      );

      if (subseries.rows[0].count > 0) {
        throw new Error('No se puede desactivar una serie que tiene subseries activas');
      }

      const resultado = await pool.query(
        `UPDATE serie SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
         WHERE id_serie = $1 
         RETURNING id_serie`,
        [idSerie]
      );

      logger.info(`Serie desactivada: ID ${idSerie}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al desactivar serie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de una serie
   * @async
   * @param {number} idSerie - ID de la serie
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas(idSerie) {
    try {
      const estadisticas = await pool.query(
        `SELECT 
          s.id_serie,
          s.codigo,
          s.nombre,
          COUNT(DISTINCT ss.id_subserie) as total_subseries,
          COUNT(DISTINCT td.id_tipo) as total_tipos,
          COUNT(DISTINCT a.id_archivo) as total_archivos
         FROM serie s
         LEFT JOIN subserie ss ON s.id_serie = ss.id_serie
         LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie
         LEFT JOIN archivo a ON td.id_tipo = a.id_tipo
         WHERE s.id_serie = $1
         GROUP BY s.id_serie, s.codigo, s.nombre`,
        [idSerie]
      );

      return estadisticas.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloSerie;
