/**
 * Modelo de Tipo Documental
 * 
 * Nivel 3 de la jerarquía TRD
 * Un tipo documental es la clasificación específica de documentos
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');

class ModeloTipoDocumental {
  /**
   * Obtiene todos los tipos de una subserie
   * @async
   * @param {number} idSubserie - ID de la subserie
   * @returns {Promise<Array>} Lista de tipos documentales
   */
  static async obtenerPorSubserie(idSubserie) {
    try {
      const resultado = await pool.query(
        `SELECT * FROM tipo_documental 
         WHERE id_subserie = $1 AND activo = true 
         ORDER BY nombre ASC`,
        [idSubserie]
      );
      return resultado.rows;
    } catch (error) {
      logger.error(`Error al obtener tipos documentales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un tipo documental específico con sus archivos
   * @async
   * @param {number} idTipo - ID del tipo documental
   * @returns {Promise<Object|null>} Datos del tipo con archivos
   */
  static async obtenerPorId(idTipo) {
    try {
      const tipo = await pool.query(
        'SELECT * FROM tipo_documental WHERE id_tipo = $1 AND activo = true',
        [idTipo]
      );

      if (tipo.rows.length === 0) return null;

      // Obtener archivos
      const archivos = await pool.query(
        `SELECT * FROM archivo 
         WHERE id_tipo = $1 AND activo = true 
         ORDER BY fecha_carga DESC`,
        [idTipo]
      );

      return {
        ...tipo.rows[0],
        archivos: archivos.rows
      };
    } catch (error) {
      logger.error(`Error al obtener tipo documental: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un nuevo tipo documental bajo una subserie
   * @async
   * @param {number} idSubserie - ID de la subserie padre (REQUERIDO)
   * @param {Object} datosTipo - Datos del tipo documental
   * @returns {Promise<number>} ID del tipo creado
   */
  static async crear(idSubserie, datosTipo) {
    try {
      const { nombre, descripcion } = datosTipo;

      // Validar que subserie es obligatoria
      if (!idSubserie || !nombre) {
        throw new Error('Subserie y nombre son obligatorios');
      }

      // Validar que la subserie existe
      const subserie = await pool.query(
        'SELECT id_subserie FROM subserie WHERE id_subserie = $1 AND activa = true',
        [idSubserie]
      );

      if (subserie.rows.length === 0) {
        throw new Error(`Subserie ${idSubserie} no existe o está inactiva`);
      }

      const resultado = await pool.query(
        `INSERT INTO tipo_documental 
         (id_subserie, nombre, descripcion)
         VALUES ($1, $2, $3)
         RETURNING id_tipo`,
        [idSubserie, nombre, descripcion || '']
      );

      logger.info(`Tipo documental creado: ${nombre} bajo subserie ${idSubserie}`);
      return resultado.rows[0].id_tipo;
    } catch (error) {
      logger.error(`Error al crear tipo documental: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un tipo documental
   * @async
   * @param {number} idTipo - ID del tipo
   * @param {Object} actualizacion - Campos a actualizar
   * @returns {Promise<boolean>} true si se actualizó
   */
  static async actualizar(idTipo, actualizacion) {
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

      valores.push(idTipo);

      const consulta = `UPDATE tipo_documental SET ${campos.join(', ')} 
                       WHERE id_tipo = $${contador++} 
                       RETURNING id_tipo`;

      const resultado = await pool.query(consulta, valores);

      logger.info(`Tipo documental actualizado: ID ${idTipo}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al actualizar tipo documental: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva un tipo documental
   * @async
   * @param {number} idTipo - ID del tipo
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async desactivar(idTipo) {
    try {
      // Verificar si tiene archivos activos
      const archivos = await pool.query(
        'SELECT COUNT(*) FROM archivo WHERE id_tipo = $1 AND activo = true',
        [idTipo]
      );

      if (archivos.rows[0].count > 0) {
        throw new Error('No se puede desactivar un tipo con archivos activos');
      }

      const resultado = await pool.query(
        `UPDATE tipo_documental SET activo = false 
         WHERE id_tipo = $1 
         RETURNING id_tipo`,
        [idTipo]
      );

      logger.info(`Tipo documental desactivado: ID ${idTipo}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al desactivar tipo documental: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloTipoDocumental;
