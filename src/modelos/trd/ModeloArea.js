/**
 * Modelo de Área
 * 
 * Agrupación lógica de series documentales.
 * Permite organizar la información por áreas sin alterar la jerarquía existente.
 * Las series asignadas a un área siguen apareciendo en la vista general.
 */

const { pool } = require('../../../config/postgresqlTRD');
const logger = require('../../../config/logger');

class ModeloArea {
  /**
   * Obtiene todas las áreas activas con estadísticas
   */
  static async obtenerTodas() {
    try {
      const resultado = await pool.query(
        `SELECT 
          a.id_area,
          a.codigo_area,
          a.nombre_area,
          a.dependencia_productora,
          a.oficina_productora,
          a.codigo_oficina,
          a.descripcion,
          a.activa,
          a.fecha_creacion,
          a.fecha_actualizacion,
          COUNT(DISTINCT s.id_serie) FILTER (WHERE s.activo = true) AS total_series
         FROM area a
         LEFT JOIN serie s ON a.id_area = s.id_area
         WHERE a.activa = true
         GROUP BY a.id_area
         ORDER BY a.codigo_area ASC`
      );

      return resultado.rows;
    } catch (error) {
      logger.error(`Error al obtener áreas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un área por ID con sus series
   */
  static async obtenerPorId(idArea) {
    try {
      const area = await pool.query(
        'SELECT * FROM area WHERE id_area = $1 AND activa = true',
        [idArea]
      );

      if (area.rows.length === 0) return null;

      const series = await pool.query(
        `SELECT s.*, o.nombre_oficina, o.codigo_oficina,
                COUNT(DISTINCT ss.id_subserie) FILTER (WHERE ss.activa = true) AS total_subseries
         FROM serie s
         LEFT JOIN oficina o ON s.id_oficina = o.id_oficina
         LEFT JOIN subserie ss ON s.id_serie = ss.id_serie
         WHERE s.id_area = $1 AND s.activo = true
         GROUP BY s.id_serie, o.nombre_oficina, o.codigo_oficina
         ORDER BY s.codigo ASC`,
        [idArea]
      );

      return {
        ...area.rows[0],
        series: series.rows,
        estadisticas: {
          total_series: series.rows.length
        }
      };
    } catch (error) {
      logger.error(`Error al obtener área por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene la jerarquía completa de un área
   */
  static async obtenerJerarquia(idArea) {
    try {
      const area = await pool.query(
        'SELECT * FROM area WHERE id_area = $1 AND activa = true',
        [idArea]
      );

      if (area.rows.length === 0) return null;

      const jerarquia = await pool.query(
        `SELECT 
          s.id_serie, s.codigo AS serie_codigo, s.nombre AS serie_nombre,
          ss.id_subserie, ss.codigo AS subserie_codigo, ss.nombre AS subserie_nombre,
          td.id_tipo, td.codigo AS tipo_codigo, td.nombre AS tipo_nombre,
          COUNT(a.id_archivo) FILTER (WHERE a.activo = true) AS total_archivos
         FROM serie s
         LEFT JOIN subserie ss ON s.id_serie = ss.id_serie AND ss.activa = true
         LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie AND td.activo = true
         LEFT JOIN archivo a ON td.id_tipo = a.id_tipo
         WHERE s.id_area = $1 AND s.activo = true
         GROUP BY s.id_serie, s.codigo, s.nombre,
                  ss.id_subserie, ss.codigo, ss.nombre,
                  td.id_tipo, td.codigo, td.nombre
         ORDER BY s.codigo, ss.codigo, td.nombre`,
        [idArea]
      );

      return {
        ...area.rows[0],
        jerarquia: jerarquia.rows
      };
    } catch (error) {
      logger.error(`Error al obtener jerarquía del área: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva área
   */
  static async crear(datosArea) {
    try {
      const { codigo_area, nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion } = datosArea;

      if (!codigo_area || !nombre_area) {
        throw new Error('Código y nombre del área son obligatorios');
      }

      const existe = await pool.query(
        'SELECT id_area FROM area WHERE codigo_area = $1',
        [codigo_area]
      );

      if (existe.rows.length > 0) {
        throw new Error(`Área con código ${codigo_area} ya existe`);
      }

      const resultado = await pool.query(
        `INSERT INTO area (codigo_area, nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion, activa)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id_area`,
        [codigo_area, nombre_area, dependencia_productora || null, oficina_productora || null, codigo_oficina || null, descripcion || null]
      );

      logger.info(`Nueva área creada: ${codigo_area} - ${nombre_area}`);
      return resultado.rows[0].id_area;
    } catch (error) {
      logger.error(`Error al crear área: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un área existente
   */
  static async actualizar(idArea, datosActualizados) {
    try {
      const { nombre_area, dependencia_productora, oficina_productora, codigo_oficina, descripcion } = datosActualizados;

      const resultado = await pool.query(
        `UPDATE area 
         SET nombre_area = COALESCE($1, nombre_area),
             dependencia_productora = COALESCE($2, dependencia_productora),
             oficina_productora = COALESCE($3, oficina_productora),
             codigo_oficina = COALESCE($4, codigo_oficina),
             descripcion = COALESCE($5, descripcion),
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_area = $6 AND activa = true
         RETURNING *`,
        [nombre_area || null, dependencia_productora || null, oficina_productora || null, codigo_oficina || null, descripcion || null, idArea]
      );

      if (resultado.rows.length === 0) {
        throw new Error('Área no encontrada');
      }

      logger.info(`Área actualizada: ID ${idArea}`);
      return resultado.rows[0];
    } catch (error) {
      logger.error(`Error al actualizar área: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactiva un área (soft delete). No elimina las series asociadas,
   * solo les quita la asociación con el área.
   */
  static async desactivar(idArea) {
    try {
      const area = await pool.query(
        'SELECT * FROM area WHERE id_area = $1 AND activa = true',
        [idArea]
      );

      if (area.rows.length === 0) {
        throw new Error('Área no encontrada');
      }

      // Desasociar series del área (no eliminarlas)
      await pool.query(
        'UPDATE serie SET id_area = NULL WHERE id_area = $1',
        [idArea]
      );

      await pool.query(
        `UPDATE area SET activa = false, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_area = $1`,
        [idArea]
      );

      logger.info(`Área desactivada: ID ${idArea}`);
      return true;
    } catch (error) {
      logger.error(`Error al desactivar área: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asocia una serie existente a un área
   */
  static async asociarSerie(idArea, idSerie) {
    try {
      const area = await pool.query(
        'SELECT id_area FROM area WHERE id_area = $1 AND activa = true',
        [idArea]
      );
      if (area.rows.length === 0) throw new Error('Área no encontrada');

      const serie = await pool.query(
        'SELECT id_serie FROM serie WHERE id_serie = $1 AND activo = true',
        [idSerie]
      );
      if (serie.rows.length === 0) throw new Error('Serie no encontrada');

      await pool.query(
        'UPDATE serie SET id_area = $1 WHERE id_serie = $2',
        [idArea, idSerie]
      );

      logger.info(`Serie ${idSerie} asociada al área ${idArea}`);
      return true;
    } catch (error) {
      logger.error(`Error al asociar serie a área: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desasocia una serie de un área
   */
  static async desasociarSerie(idArea, idSerie) {
    try {
      await pool.query(
        'UPDATE serie SET id_area = NULL WHERE id_serie = $1 AND id_area = $2',
        [idSerie, idArea]
      );

      logger.info(`Serie ${idSerie} desasociada del área ${idArea}`);
      return true;
    } catch (error) {
      logger.error(`Error al desasociar serie del área: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ModeloArea;
