/**
 * Modelo de Documento
 * 
 * Maneja todas las operaciones relacionadas con documentos en la base de datos
 * Incluye métodos para crear, buscar, actualizar y eliminar documentos
 */

const { pool } = require('../../config/baseDatos');
const logger = require('../../config/logger');

class ModeloDocumento {
  /**
   * Obtiene todos los documentos con filtros opcionales
   * @async
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} filtros.usuario_id - ID del usuario propietario
   * @param {string} filtros.estado - Estado del documento (activo, archivado, eliminado)
   * @param {number} filtros.limite - Cantidad de resultados (paginación)
   * @param {number} filtros.offset - Desplazamiento (paginación)
   * @returns {Promise<Array>} Lista de documentos
   */
  static async obtenerTodos(filtros = {}) {
    try {
      let consulta = 'SELECT * FROM documentos WHERE 1=1';
      const valores = [];

      if (filtros.usuario_id) {
        consulta += ' AND usuario_id = ?';
        valores.push(filtros.usuario_id);
      }

      if (filtros.estado) {
        consulta += ' AND estado = ?';
        valores.push(filtros.estado);
      } else {
        consulta += ' AND estado != ?';
        valores.push('eliminado');
      }

      consulta += ' ORDER BY fecha_creacion DESC';

      if (filtros.limite) {
        consulta += ' LIMIT ?';
        valores.push(filtros.limite);
      }

      if (filtros.offset) {
        consulta += ' OFFSET ?';
        valores.push(filtros.offset);
      }

      const [documentos] = await pool.query(consulta, valores);
      return documentos;
    } catch (error) {
      logger.error(`Error al obtener documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un documento específico por ID
   * @async
   * @param {number} id - ID del documento
   * @returns {Promise<Object|null>} Datos del documento o null
   */
  static async obtenerPorId(id) {
    try {
      const [documentos] = await pool.query(
        'SELECT * FROM documentos WHERE id = ? AND estado != ?',
        [id, 'eliminado']
      );
      return documentos[0] || null;
    } catch (error) {
      logger.error(`Error al obtener documento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca documentos por palabra clave en título o descripción
   * @async
   * @param {string} termino - Término de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Documentos encontrados
   */
  static async buscar(termino, limite = 20) {
    try {
      const [documentos] = await pool.query(
        `SELECT * FROM documentos 
         WHERE (titulo LIKE ? OR descripcion LIKE ? OR palabras_clave LIKE ?) 
         AND estado != ? 
         ORDER BY fecha_creacion DESC 
         LIMIT ?`,
        [`%${termino}%`, `%${termino}%`, `%${termino}%`, 'eliminado', limite]
      );
      return documentos;
    } catch (error) {
      logger.error(`Error al buscar documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un documento nuevo
   * @async
   * @param {Object} datosDocumento - Datos del documento
   * @returns {Promise<number>} ID del documento creado
   */
  static async crear(datosDocumento) {
    try {
      const { 
        titulo, 
        descripcion, 
        usuario_id, 
        tipo_documento, 
        ruta_archivo, 
        tamaño_archivo,
        palabras_clave
      } = datosDocumento;

      const [resultado] = await pool.query(
        `INSERT INTO documentos 
         (titulo, descripcion, usuario_id, tipo_documento, ruta_archivo, tamaño_archivo, palabras_clave, estado, fecha_creacion, vista_publica) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), false)`,
        [titulo, descripcion, usuario_id, tipo_documento, ruta_archivo, tamaño_archivo, palabras_clave, 'activo']
      );

      logger.info(`Documento creado: ${titulo} (ID: ${resultado.insertId})`);
      return resultado.insertId;
    } catch (error) {
      logger.error(`Error al crear documento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza los datos de un documento
   * @async
   * @param {number} id - ID del documento
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<boolean>} true si se actualizó
   */
  static async actualizar(id, datosActualizacion) {
    try {
      const campos = [];
      const valores = [];

      if (datosActualizacion.titulo !== undefined) {
        campos.push('titulo = ?');
        valores.push(datosActualizacion.titulo);
      }
      if (datosActualizacion.descripcion !== undefined) {
        campos.push('descripcion = ?');
        valores.push(datosActualizacion.descripcion);
      }
      if (datosActualizacion.palabras_clave !== undefined) {
        campos.push('palabras_clave = ?');
        valores.push(datosActualizacion.palabras_clave);
      }
      if (datosActualizacion.vista_publica !== undefined) {
        campos.push('vista_publica = ?');
        valores.push(datosActualizacion.vista_publica);
      }

      if (campos.length === 0) return false;

      campos.push('fecha_actualizacion = NOW()');
      valores.push(id);

      const consulta = `UPDATE documentos SET ${campos.join(', ')} WHERE id = ?`;
      const [resultado] = await pool.query(consulta, valores);

      logger.info(`Documento actualizado: ID ${id}`);
      return resultado.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al actualizar documento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca un documento como eliminado (eliminación lógica)
   * @async
   * @param {number} id - ID del documento
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async eliminar(id) {
    try {
      const [resultado] = await pool.query(
        'UPDATE documentos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
        ['eliminado', id]
      );

      logger.info(`Documento marcado como eliminado: ID ${id}`);
      return resultado.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al eliminar documento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Incrementa el contador de descargas de un documento
   * @async
   * @param {number} id - ID del documento
   * @returns {Promise<boolean>} true si se incrementó
   */
  static async incrementarDescargas(id) {
    try {
      const [resultado] = await pool.query(
        'UPDATE documentos SET descargas = descargas + 1 WHERE id = ?',
        [id]
      );

      return resultado.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al incrementar descargas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloDocumento;
