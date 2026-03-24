/**
 * Modelo de Subserie Documental
 * 
 * Nivel 2 de la jerarquía TRD
 * Una subserie es una subdivisión de una serie
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');

class ModeloSubserie {
  /**
   * Obtiene todas las subseries de una serie
   * @async
   * @param {number} idSerie - ID de la serie padre
   * @returns {Promise<Array>} Lista de subseries con contador de tipos
   */
  static async obtenerPorSerie(idSerie) {
    try {
      let resultado;
      try {
        // Intentar primero con esquema nuevo (activo)
        resultado = await pool.query(
          `SELECT 
            s.*,
            COALESCE(COUNT(td.id_tipo), 0) as total_tipos
           FROM subserie s
           LEFT JOIN tipo_documental td ON s.id_subserie = td.id_subserie AND td.activo = true
           WHERE s.id_serie = $1 AND s.activa = true 
           GROUP BY s.id_subserie, s.id_serie, s.codigo, s.nombre, s.descripcion, s.fecha_creacion
           ORDER BY s.codigo ASC`,
          [idSerie]
        );
      } catch (schemaError) {
        // Fallback a esquema antiguo (activa)
        logger.info('obtenerPorSerie: Intentando con esquema antiguo...');
        resultado = await pool.query(
          `SELECT 
            s.*,
            COALESCE(COUNT(td.id_tipo), 0) as total_tipos
           FROM subserie s
           LEFT JOIN tipo_documental td ON s.id_subserie = td.id_subserie AND td.activa = true
           WHERE s.id_serie = $1 AND s.activa = true 
           GROUP BY s.id_subserie, s.id_serie, s.codigo, s.nombre, s.descripcion, s.fecha_creacion
           ORDER BY s.codigo ASC`,
          [idSerie]
        );
      }
      return resultado.rows;
    } catch (error) {
      logger.error(`Error al obtener subseries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una subserie por ID con sus tipos documentales
   * @async
   * @param {number} idSubserie - ID de la subserie
   * @returns {Promise<Object|null>} Datos completos de la subserie
   */
  static async obtenerPorId(idSubserie) {
    try {
      const subserie = await pool.query(
        'SELECT * FROM subserie WHERE id_subserie = $1 AND activa = true',
        [idSubserie]
      );

      if (subserie.rows.length === 0) return null;

      // Obtener tipos documentales con fallback de esquema
      let tipos;
      try {
        tipos = await pool.query(
          'SELECT * FROM tipo_documental WHERE id_subserie = $1 AND activo = true',
          [idSubserie]
        );
      } catch (tiposError) {
        logger.info('obtenerPorId tipos: Intentando con esquema antiguo...');
        tipos = await pool.query(
          'SELECT * FROM tipo_documental WHERE id_subserie = $1 AND activa = true',
          [idSubserie]
        );
      }

      return {
        ...subserie.rows[0],
        tipos_documentales: tipos.rows
      };
    } catch (error) {
      logger.error(`Error al obtener subserie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva subserie bajo una serie
   * @async
   * @param {number} idSerie - ID de la serie padre
   * @param {Object} datosSubserie - Datos de la subserie
   * @returns {Promise<number>} ID de la subserie creada
   */
  static async crear(idSerie, datosSubserie) {
    try {
      const { codigo, nombre, descripcion } = datosSubserie;

      // Verificar que la serie existe
      const serie = await pool.query(
        'SELECT id_serie FROM serie WHERE id_serie = $1 AND activo = true',
        [idSerie]
      );

      if (serie.rows.length === 0) {
        throw new Error(`Serie con ID ${idSerie} no existe`);
      }

      // Validar código único
      const existe = await pool.query(
        'SELECT id_subserie FROM subserie WHERE codigo = $1',
        [codigo]
      );

      if (existe.rows.length > 0) {
        throw new Error(`Código de subserie ${codigo} ya existe`);
      }

      const resultado = await pool.query(
        `INSERT INTO subserie (id_serie, codigo, nombre, descripcion)
         VALUES ($1, $2, $3, $4)
         RETURNING id_subserie`,
        [idSerie, codigo, nombre, descripcion || '']
      );

      logger.info(`Subserie creada: ${codigo} bajo serie ${idSerie}`);
      return resultado.rows[0].id_subserie;
    } catch (error) {
      logger.error(`Error al crear subserie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza una subserie
   * @async
   * @param {number} idSubserie - ID de la subserie
   * @param {Object} actualizacion - Campos a actualizar
   * @returns {Promise<boolean>} true si se actualizó
   */
  static async actualizar(idSubserie, actualizacion) {
    try {
      const campos = [];
      const valores = [];
      let contador = 1;

      if (actualizacion.nombre !== undefined) {
        campos.push(`nombre = $${contador++}`);
        valores.push(actualizacion.nombre);
      }
      if (actualizacion.descripcion !== undefined) {
        campos.push(`descripcion = $${contador++}`);
        valores.push(actualizacion.descripcion);
      }

      if (campos.length === 0) return false;

      valores.push(idSubserie);

      const consulta = `UPDATE subserie SET ${campos.join(', ')} 
                       WHERE id_subserie = $${contador++} 
                       RETURNING id_subserie`;

      const resultado = await pool.query(consulta, valores);

      logger.info(`Subserie actualizada: ID ${idSubserie}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al actualizar subserie: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva una subserie
   * @async
   * @param {number} idSubserie - ID de la subserie
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async desactivar(idSubserie) {
    try {
      // Verificar si tiene tipos documentales activos
      const tipos = await pool.query(
        'SELECT COUNT(*) FROM tipo_documental WHERE id_subserie = $1 AND activo = true',
        [idSubserie]
      );

      if (tipos.rows[0].count > 0) {
        throw new Error('No se puede desactivar una subserie que tiene tipos documentales activos');
      }

      const resultado = await pool.query(
        `UPDATE subserie SET activa = false 
         WHERE id_subserie = $1 
         RETURNING id_subserie`,
        [idSubserie]
      );

      logger.info(`Subserie desactivada: ID ${idSubserie}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al desactivar subserie: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloSubserie;
