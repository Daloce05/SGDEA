/**
 * Modelo de Archivo
 * 
 * Nivel 4 de la jerarquía TRD
 * Un archivo es el documento físico o digital almacenado
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');
const crypto = require('crypto');
const fs = require('fs').promises;

class ModeloArchivo {
  /**
   * Obtiene todos los archivos de un tipo documental
   * @async
   * @param {number} idTipo - ID del tipo documental
   * @returns {Promise<Array>} Lista de archivos
   */
  static async obtenerPorTipo(idTipo) {
    try {
      const resultado = await pool.query(
        `SELECT id_archivo, nombre_archivo, tamaño_kb, estado, fecha_carga, ruta_pdf
         FROM archivo 
         WHERE id_tipo = $1 AND activo = true 
         ORDER BY fecha_carga DESC`,
        [idTipo]
      );
      
      // Transformar nombres de columnas para el frontend
      return resultado.rows.map(row => ({
        id_archivo: row.id_archivo,
        nombre_original: row.nombre_archivo,
        tamano_bytes: row.tamaño_kb * 1024, // Convertir KB a bytes
        estado: row.estado,
        creado_en: row.fecha_carga,
        ruta_pdf: row.ruta_pdf
      }));
    } catch (error) {
      logger.error(`Error al obtener archivos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un archivo específico
   * @async
   * @param {number} idArchivo - ID del archivo
   * @returns {Promise<Object|null>} Datos del archivo
   */
  static async obtenerPorId(idArchivo) {
    try {
      const resultado = await pool.query(
        'SELECT id_archivo, nombre_archivo, tamaño_kb, estado, fecha_carga, ruta_pdf FROM archivo WHERE id_archivo = $1 AND activo = true',
        [idArchivo]
      );
      
      if (resultado.rows.length === 0) return null;
      
      const row = resultado.rows[0];
      // Transformar nombres de columnas para el frontend
      return {
        id_archivo: row.id_archivo,
        nombre_original: row.nombre_archivo,
        tamano_bytes: row.tamaño_kb * 1024, // Convertir KB a bytes
        estado: row.estado,
        creado_en: row.fecha_carga,
        ruta_pdf: row.ruta_pdf
      };
    } catch (error) {
      logger.error(`Error al obtener archivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula MD5 hash de un archivo
   * @param {Buffer} contenido - Contenido del archivo
   * @returns {string} Hash MD5
   */
  static calcularHashMD5(contenido) {
    return crypto.createHash('md5').update(contenido).digest('hex');
  }

  /**
   * Carga un nuevo archivo
   * @async
   * @param {number} idTipo - ID del tipo documental
   * @param {Object} datosArchivo - Datos del archivo
   * @param {Buffer} contenidoPDF - Buffer del archivo PDF
   * @returns {Promise<number>} ID del archivo creado
   */
  static async crear(idTipo, datosArchivo, contenidoPDF) {
    try {
      const {
        nombre_archivo,
        estado,
        fecha_documento,
        subido_por,
        observaciones
      } = datosArchivo;

      // Verificar que el tipo existe
      const tipo = await pool.query(
        'SELECT id_tipo FROM tipo_documental WHERE id_tipo = $1 AND activo = true',
        [idTipo]
      );

      if (tipo.rows.length === 0) {
        throw new Error(`Tipo documental ${idTipo} no existe`);
      }

      // Calcular hash y tamaño
      const hashMD5 = this.calcularHashMD5(contenidoPDF);
      const tamaño = Math.ceil(contenidoPDF.length / 1024); // KB

      // Generar ruta del archivo
      const timestamp = Date.now();
      const nombreArchivo = `${timestamp}-${nombre_archivo}`;
      const rutaPDF = `/documentos/trd/${nombreArchivo}`;

      // Insertar en BD
      const resultado = await pool.query(
        `INSERT INTO archivo 
         (id_tipo, nombre_archivo, estado, ruta_pdf, fecha_documento, 
          tamaño_kb, hash_md5, subido_por, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id_archivo`,
        [
          idTipo,
          nombre_archivo,
          estado || 'digital',
          rutaPDF,
          fecha_documento || new Date(),
          tamaño,
          hashMD5,
          subido_por || 'sistema',
          observaciones || ''
        ]
      );

      logger.info(`Archivo creado: ${nombre_archivo} (${tamaño}KB)`);
      return {
        id: resultado.rows[0].id_archivo,
        ruta: rutaPDF,
        nombre: nombreArchivo
      };
    } catch (error) {
      logger.error(`Error al crear archivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza metadatos de un archivo
   * @async
   * @param {number} idArchivo - ID del archivo
   * @param {Object} actualizacion - Campos a actualizar
   * @returns {Promise<boolean>} true si se actualizó
   */
  static async actualizar(idArchivo, actualizacion) {
    try {
      const campos = [];
      const valores = [];
      let contador = 1;

      if (actualizacion.nombre_archivo !== undefined) {
        campos.push(`nombre_archivo = $${contador++}`);
        valores.push(actualizacion.nombre_archivo);
      }
      if (actualizacion.fecha_documento !== undefined) {
        campos.push(`fecha_documento = $${contador++}`);
        valores.push(actualizacion.fecha_documento);
      }
      if (actualizacion.observaciones !== undefined) {
        campos.push(`observaciones = $${contador++}`);
        valores.push(actualizacion.observaciones);
      }
      if (actualizacion.estado !== undefined) {
        campos.push(`estado = $${contador++}`);
        valores.push(actualizacion.estado);
      }

      if (campos.length === 0) return false;

      campos.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
      valores.push(idArchivo);

      const consulta = `UPDATE archivo SET ${campos.join(', ')} 
                       WHERE id_archivo = $${contador++} 
                       RETURNING id_archivo`;

      const resultado = await pool.query(consulta, valores);

      logger.info(`Archivo actualizado: ID ${idArchivo}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al actualizar archivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva un archivo
   * @async
   * @param {number} idArchivo - ID del archivo
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async desactivar(idArchivo) {
    try {
      const resultado = await pool.query(
        `UPDATE archivo SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
         WHERE id_archivo = $1 
         RETURNING id_archivo`,
        [idArchivo]
      );

      logger.info(`Archivo desactivado: ID ${idArchivo}`);
      return resultado.rows.length > 0;
    } catch (error) {
      logger.error(`Error al desactivar archivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca archivos por criterios
   * @async
   * @param {Object} criterios - Criterios de búsqueda
   * @returns {Promise<Array>} Archivos encontrados
   */
  static async buscar(criterios) {
    try {
      let consulta = 'SELECT * FROM archivo WHERE activo = true';
      const valores = [];
      let contador = 1;

      if (criterios.termino) {
        consulta += ` AND (nombre_archivo ILIKE $${contador} OR observaciones ILIKE $${contador})`;
        valores.push(`%${criterios.termino}%`);
        contador++;
      }

      if (criterios.estado) {
        consulta += ` AND estado = $${contador++}`;
        valores.push(criterios.estado);
      }

      if (criterios.fecha_desde) {
        consulta += ` AND fecha_documento >= $${contador++}`;
        valores.push(criterios.fecha_desde);
      }

      if (criterios.fecha_hasta) {
        consulta += ` AND fecha_documento <= $${contador++}`;
        valores.push(criterios.fecha_hasta);
      }

      consulta += ' ORDER BY fecha_carga DESC LIMIT 100';

      const resultado = await pool.query(consulta, valores);
      
      // Transformar nombres de columnas para el frontend
      return resultado.rows.map(row => ({
        id_archivo: row.id_archivo,
        nombre_original: row.nombre_archivo,
        tamano_bytes: (row.tamaño_kb || 0) * 1024,
        estado: row.estado,
        creado_en: row.fecha_carga,
        ruta_pdf: row.ruta_pdf
      }));
    } catch (error) {
      logger.error(`Error al buscar archivos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de archivos
   * @async
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async obtenerEstadisticas() {
    try {
      const resultado = await pool.query(
        `SELECT 
          COUNT(*) as total_archivos,
          COUNT(CASE WHEN estado = 'digital' THEN 1 END) as archivos_digitales,
          COUNT(CASE WHEN estado = 'fisico' THEN 1 END) as archivos_fisicos,
          COUNT(CASE WHEN estado = 'ambos' THEN 1 END) as archivos_hibridos,
          ROUND(SUM("tamaño_kb")::numeric / 1024, 2) as tamano_total_mb,
          ROUND(AVG("tamaño_kb")::numeric / 1024, 2) as tamano_promedio_mb
         FROM archivo WHERE activo = true`
      );
      
      const stats = resultado.rows[0];
      
      // Transformar a formato esperado por frontend
      return {
        total_archivos: parseInt(stats.total_archivos) || 0,
        tamano_total_mb: parseFloat(stats.tamano_total_mb) || 0,
        tamano_promedio_mb: parseFloat(stats.tamano_promedio_mb) || 0,
        por_estado: {
          digital: parseInt(stats.archivos_digitales) || 0,
          fisico: parseInt(stats.archivos_fisicos) || 0,
          hibrido: parseInt(stats.archivos_hibridos) || 0
        }
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloArchivo;
