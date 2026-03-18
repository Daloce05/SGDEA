/**
 * Modelo de Oficina
 * 
 * Nivel raíz de la jerarquía TRD (Tabla de Retención Documental)
 * Una oficina representa la unidad administrativa responsable de los documentos
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');

class ModeloOficina {
  /**
   * Obtiene todas las oficinas activas
   * @async
   * @returns {Promise<Array>} Lista de oficinas
   */
  static async obtenerTodas() {
    try {
      const resultado = await pool.query(
        `SELECT 
          id_oficina,
          codigo_oficina,
          nombre_oficina,
          dependencia,
          activa,
          fecha_creacion,
          fecha_actualizacion
         FROM oficina 
         WHERE activa = true 
         ORDER BY codigo_oficina ASC`
      );
      
      // Obtener estadísticas para cada oficina
      const oficinasConEstadisticas = await Promise.all(
        resultado.rows.map(async (oficina) => {
          const series = await pool.query(
            'SELECT COUNT(*) as count FROM serie WHERE id_oficina = $1 AND activo = true',
            [oficina.id_oficina]
          );
          return {
            ...oficina,
            estadisticas: {
              total_series: parseInt(series.rows[0].count)
            }
          };
        })
      );
      
      return oficinasConEstadisticas;
    } catch (error) {
      logger.error(`Error al obtener oficinas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una oficina por ID con todas sus series
   * @async
   * @param {number} idOficina - ID de la oficina
   * @returns {Promise<Object|null>} Datos completos de la oficina
   */
  static async obtenerPorId(idOficina) {
    try {
      // Obtener datos de la oficina
      const oficina = await pool.query(
        'SELECT * FROM oficina WHERE id_oficina = $1 AND activa = true',
        [idOficina]
      );

      if (oficina.rows.length === 0) return null;

      // Obtener series asociadas
      const series = await pool.query(
        `SELECT * FROM serie 
         WHERE id_oficina = $1 AND activo = true 
         ORDER BY codigo ASC`,
        [idOficina]
      );

      // Obtener estadísticas
      const archivos = await pool.query(
        `SELECT COUNT(*) as count FROM archivo a
         INNER JOIN tipo_documental td ON a.id_tipo = td.id_tipo
         INNER JOIN subserie ss ON td.id_subserie = ss.id_subserie
         INNER JOIN serie s ON ss.id_serie = s.id_serie
         WHERE s.id_oficina = $1 AND a.activo = true`,
        [idOficina]
      );

      return {
        ...oficina.rows[0],
        series: series.rows,
        estadisticas: {
          total_series: series.rows.length,
          total_archivos: parseInt(archivos.rows[0].count)
        }
      };
    } catch (error) {
      logger.error(`Error al obtener oficina por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una oficina por código
   * @async
   * @param {string} codigoOficina - Código de la oficina (ej: '144')
   * @returns {Promise<Object|null>} Datos de la oficina
   */
  static async obtenerPorCodigo(codigoOficina) {
    try {
      const resultado = await pool.query(
        'SELECT * FROM oficina WHERE codigo_oficina = $1 AND activa = true',
        [codigoOficina]
      );

      return resultado.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener oficina por código: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva oficina
   * @async
   * @param {Object} datosOficina - Datos de la oficina
   * @returns {Promise<number>} ID de la oficina creada
   */
  static async crear(datosOficina) {
    try {
      const { codigo_oficina, nombre_oficina, dependencia } = datosOficina;

      // Validar campos obligatorios
      if (!codigo_oficina || !nombre_oficina) {
        throw new Error('Código de oficina y nombre son obligatorios');
      }

      // Verificar que el código sea único
      const existe = await pool.query(
        'SELECT id_oficina FROM oficina WHERE codigo_oficina = $1',
        [codigo_oficina]
      );

      if (existe.rows.length > 0) {
        throw new Error(`Oficina con código ${codigo_oficina} ya existe`);
      }

      const resultado = await pool.query(
        `INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
         VALUES ($1, $2, $3, true)
         RETURNING id_oficina`,
        [codigo_oficina, nombre_oficina, dependencia || null]
      );

      logger.info(`Nueva oficina creada: ${codigo_oficina} - ${nombre_oficina}`);
      return resultado.rows[0].id_oficina;
    } catch (error) {
      logger.error(`Error al crear oficina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza una oficina existente
   * @async
   * @param {number} idOficina - ID de la oficina
   * @param {Object} datosActualizados - Datos a actualizar
   * @returns {Promise<Object>} Oficina actualizada
   */
  static async actualizar(idOficina, datosActualizados) {
    try {
      const { nombre_oficina, dependencia } = datosActualizados;

      const resultado = await pool.query(
        `UPDATE oficina 
         SET nombre_oficina = COALESCE($1, nombre_oficina),
             dependencia = COALESCE($2, dependencia),
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_oficina = $3 AND activa = true
         RETURNING *`,
        [nombre_oficina || null, dependencia || null, idOficina]
      );

      if (resultado.rows.length === 0) {
        throw new Error('Oficina no encontrada');
      }

      logger.info(`Oficina actualizada: ID ${idOficina}`);
      return resultado.rows[0];
    } catch (error) {
      logger.error(`Error al actualizar oficina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva una oficina (soft delete)
   * @async
   * @param {number} idOficina - ID de la oficina
   * @returns {Promise<boolean>} Éxito de la operación
   */
  static async desactivar(idOficina) {
    try {
      // Verificar que no haya series activas
      const series = await pool.query(
        'SELECT COUNT(*) as count FROM serie WHERE id_oficina = $1 AND activo = true',
        [idOficina]
      );

      if (parseInt(series.rows[0].count) > 0) {
        throw new Error('No se puede desactivar una oficina con series activas');
      }

      const resultado = await pool.query(
        `UPDATE oficina 
         SET activa = false, 
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_oficina = $1
         RETURNING id_oficina`,
        [idOficina]
      );

      if (resultado.rows.length === 0) {
        throw new Error('Oficina no encontrada');
      }

      logger.info(`Oficina desactivada: ID ${idOficina}`);
      return true;
    } catch (error) {
      logger.error(`Error al desactivar oficina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene la jerarquía completa de una oficina
   * @async
   * @param {number} idOficina - ID de la oficina
   * @returns {Promise<Object>} Árbol jerárquico completo
   */
  static async obtenerJerarquiaCompleta(idOficina) {
    try {
      const resultado = await pool.query(
        `SELECT 
          o.id_oficina,
          o.codigo_oficina,
          o.nombre_oficina,
          json_agg(
            json_build_object(
              'id_serie', s.id_serie,
              'codigo', s.codigo,
              'nombre', s.nombre,
              'subseries', (
                SELECT json_agg(
                  json_build_object(
                    'id_subserie', ss.id_subserie,
                    'codigo', ss.codigo,
                    'nombre', ss.nombre
                  )
                )
                FROM subserie ss WHERE ss.id_serie = s.id_serie AND ss.activa = true
              )
            )
          ) as series
         FROM oficina o
         LEFT JOIN serie s ON o.id_oficina = s.id_oficina AND s.activo = true
         WHERE o.id_oficina = $1 AND o.activa = true
         GROUP BY o.id_oficina, o.codigo_oficina, o.nombre_oficina`,
        [idOficina]
      );

      return resultado.rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener jerarquía de oficina: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloOficina;
