/**
 * Middleware de Validación Jerárquica TRD
 * 
 * Valida que las entidades cumplan con la jerarquía
 * SERIE → SUBSERIE → TIPO DOCUMENTAL → ARCHIVO
 */

const logger = require('../../../config/logger');
const { pool } = require('../../../config/postgresqlTRD');

/**
 * Valida que una serie existe y está activa
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
async function validarSerie(req, res, next) {
  try {
    const { idSerie } = req.params;

    if (!idSerie) {
      return res.status(400).json({ exito: false, error: 'ID de serie es requerido' });
    }

    const resultado = await pool.query(
      'SELECT id_serie FROM serie WHERE id_serie = $1 AND activo = true',
      [idSerie]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, error: 'Serie no encontrada o inactiva' });
    }

    next();
  } catch (error) {
    logger.error(`Error validar serie: ${error.message}`);
    res.status(500).json({ exito: false, error: 'Error al validar serie' });
  }
}

/**
 * Valida que una subserie existe, está activa y pertenece a la serie
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
async function validarSubserie(req, res, next) {
  try {
    const { idSerie, idSubserie } = req.params;

    if (!idSerie || !idSubserie) {
      return res.status(400).json({ exito: false, error: 'ID de serie y subserie son requeridos' });
    }

    const resultado = await pool.query(
      'SELECT id_subserie FROM subserie WHERE id_subserie = $1 AND id_serie = $2 AND activa = true',
      [idSubserie, idSerie]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ 
        exito: false,
        error: 'Subserie no encontrada, inactiva o no pertenece a esta serie' 
      });
    }

    next();
  } catch (error) {
    logger.error(`Error validar subserie: ${error.message}`);
    res.status(500).json({ exito: false, error: 'Error al validar subserie' });
  }
}

/**
 * Valida que un tipo documental existe y está activo
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
async function validarTipo(req, res, next) {
  try {
    const { idTipo } = req.params;

    if (!idTipo) {
      return res.status(400).json({ exito: false, error: 'ID de tipo es requerido' });
    }

    const resultado = await pool.query(
      'SELECT id_tipo FROM tipo_documental WHERE id_tipo = $1 AND activo = true',
      [idTipo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, error: 'Tipo documental no encontrado o inactivo' });
    }

    next();
  } catch (error) {
    logger.error(`Error validar tipo: ${error.message}`);
    res.status(500).json({ exito: false, error: 'Error al validar tipo' });
  }
}

/**
 * Valida que un archivo existe y está activo
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
async function validarArchivo(req, res, next) {
  try {
    const { idArchivo } = req.params;

    if (!idArchivo) {
      return res.status(400).json({ exito: false, error: 'ID de archivo es requerido' });
    }

    const resultado = await pool.query(
      'SELECT id_archivo FROM archivo WHERE id_archivo = $1 AND activo = true',
      [idArchivo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, error: 'Archivo no encontrado o inactivo' });
    }

    next();
  } catch (error) {
    logger.error(`Error validar archivo: ${error.message}`);
    res.status(500).json({ exito: false, error: 'Error al validar archivo' });
  }
}

/**
 * Valida que los IDs son números válidos
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
function validarIds(req, res, next) {
  const { idSerie, idSubserie, idTipo, idArchivo } = req.params;

  const ids = { idSerie, idSubserie, idTipo, idArchivo };

  for (const [key, value] of Object.entries(ids)) {
    if (value && isNaN(parseInt(value))) {
      return res.status(400).json({ exito: false, error: `${key} debe ser un número válido` });
    }
  }

  next();
}

module.exports = {
  validarSerie,
  validarSubserie,
  validarTipo,
  validarArchivo,
  validarIds
};
