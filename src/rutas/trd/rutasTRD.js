/**
 * Rutas TRD - Sistema de Gestión Documental
 * 
 * Rutas jerárquicas: OFICINA → SERIE → SUBSERIE → TIPO DOCUMENTAL → ARCHIVO
 * 
 * Estructura RESTful:
 * /api/trd/oficinas
 *  ├─ /api/trd/oficinas/:idOficina/series
 *  │  ├─ /api/trd/oficinas/:idOficina/series/:idSerie/subseries
 *  │  │  ├─ /api/trd/oficinas/:idOficina/series/:idSerie/subseries/:idSubserie/tipos
 *  │  │  │  ├─ /api/trd/oficinas/:idOficina/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ControladorOficina = require('../../controladores/trd/ControladorOficina');
const ControladorSerie = require('../../controladores/trd/ControladorSerie');
const ControladorSubserie = require('../../controladores/trd/ControladorSubserie');
const ControladorTipoDocumental = require('../../controladores/trd/ControladorTipoDocumental');
const ControladorArchivo = require('../../controladores/trd/ControladorArchivo');

const {
  validarSerie,
  validarSubserie,
  validarTipo,
  validarArchivo,
  validarIds
} = require('../../middleware/trd/validacionJerarquica');

const router = express.Router();

/**
 * Configuración de multer para carga de archivos PDF
 */
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../documentos/trd'));
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${uuidv4()}-${Date.now()}.pdf`;
    cb(null, nombreUnico);
  }
});

const filtrarPDFs = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se aceptan archivos PDF'), false);
  }
};

const cargarPDF = multer({
  storage: almacenamiento,
  fileFilter: filtrarPDFs,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// ============================================
// NIVEL 0: OFICINAS (Nueva raíz de jerarquía)
// ============================================

/**
 * GET /api/trd/oficinas
 * Obtiene todas las oficinas
 */
router.get('/oficinas', ControladorOficina.obtenerTodas);

/**
 * POST /api/trd/oficinas
 * Crea una nueva oficina
 */
router.post('/oficinas', ControladorOficina.crear);

/**
 * GET /api/trd/oficinas/:idOficina
 * Obtiene una oficina con sus series
 */
router.get('/oficinas/:idOficina', ControladorOficina.obtenerPorId);

/**
 * GET /api/trd/oficinas/:idOficina/jerarquia
 * Obtiene la jerarquía completa de una oficina
 */
router.get('/oficinas/:idOficina/jerarquia', ControladorOficina.obtenerJerarquia);

/**
 * PUT /api/trd/oficinas/:idOficina
 * Actualiza una oficina
 */
router.put('/oficinas/:idOficina', ControladorOficina.actualizar);

/**
 * DELETE /api/trd/oficinas/:idOficina
 * Desactiva una oficina
 */
router.delete('/oficinas/:idOficina', ControladorOficina.desactivar);

// ============================================
// NIVEL 1: SERIES (Ahora bajo OFICINAS)
// ============================================

/**
 * GET /api/trd/oficinas/:idOficina/series
 * Obtiene todas las series de una oficina
 */
router.get('/oficinas/:idOficina/series', ControladorSerie.obtenerPorOficina);

/**
 * POST /api/trd/oficinas/:idOficina/series
 * Crea una nueva serie en una oficina
 */
router.post('/oficinas/:idOficina/series', ControladorSerie.crear);

/**
 * Endpoint heredado para compatibilidad
 * GET /api/trd/series
 */
router.get('/series', ControladorSerie.obtenerTodas);

/**
 * POST /api/trd/series (LEGACY)
 * Crea una serie - id_oficina va en body
 */
router.post('/series', ControladorSerie.crearLegacy);

/**
 * GET /api/trd/series/:idSerie
 */
router.get('/series/:idSerie', validarIds, validarSerie, ControladorSerie.obtenerPorId);

/**
 * PUT /api/trd/series/:idSerie
 * Actualiza una serie
 */
router.put('/series/:idSerie', validarIds, validarSerie, ControladorSerie.actualizar);

/**
 * DELETE /api/trd/series/:idSerie
 * Desactiva una serie
 */
router.delete('/series/:idSerie', validarIds, validarSerie, ControladorSerie.desactivar);

// ============================================
// NIVEL 2: SUBSERIES
// ============================================

/**
 * GET /api/trd/series/:idSerie/subseries
 * Obtiene subseries de una serie
 */
router.get('/series/:idSerie/subseries', validarIds, validarSerie, ControladorSubserie.obtenerPorSerie);

/**
 * POST /api/trd/series/:idSerie/subseries
 * Crea una subserie en una serie
 */
router.post('/series/:idSerie/subseries', validarIds, validarSerie, ControladorSubserie.crear);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie
 * Obtiene una subserie específica
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie',
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorSubserie.obtenerPorId
);

/**
 * PUT /api/trd/series/:idSerie/subseries/:idSubserie
 * Actualiza una subserie
 */
router.put(
  '/series/:idSerie/subseries/:idSubserie',
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorSubserie.actualizar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie
 * Desactiva una subserie
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie',
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorSubserie.desactivar
);

// ============================================
// NIVEL 3: TIPOS DOCUMENTALES
// ============================================

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos
 * Obtiene tipos documentales de una subserie
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos',
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorTipoDocumental.obtenerPorSubserie
);

/**
 * POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos
 * Crea un tipo documental bajo una subserie (REQUERIDO)
 */
router.post(
  '/series/:idSerie/subseries/:idSubserie/tipos',
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorTipoDocumental.crear
);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 * Obtiene un tipo documental
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorTipoDocumental.obtenerPorId
);

/**
 * PUT /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 */
router.put(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorTipoDocumental.actualizar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorTipoDocumental.desactivar
);

// ============================================
// NIVEL 4: ARCHIVOS
// ============================================

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
 * Obtiene archivos de un tipo
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos',
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorArchivo.obtenerPorTipo
);

/**
 * POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
 * Carga un archivo PDF
 */
router.post(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos',
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  cargarPDF.single('archivo'),
  ControladorArchivo.cargar
);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
 * Obtiene información de un archivo
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo',
  validarIds,
  validarArchivo,
  ControladorArchivo.obtenerPorId
);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar
 * Descarga un archivo PDF
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar',
  validarIds,
  validarArchivo,
  ControladorArchivo.descargar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
 * Desactiva un archivo
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo',
  validarIds,
  validarArchivo,
  ControladorArchivo.desactivar
);

// ============================================
// RUTAS ESPECÍFICAS
// ============================================

/**
 * GET /api/trd/archivos/buscar
 * Busca archivos por criterios
 */
router.get('/archivos/buscar', ControladorArchivo.buscar);

/**
 * GET /api/trd/archivos/estadisticas
 * Obtiene estadísticas generales
 */
router.get('/archivos/estadisticas', ControladorArchivo.estadisticas);

// ============================================
// MANEJO DE ERRORES
// ============================================

/**
 * Manejo de errores de multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Archivo muy grande' });
    }
    return res.status(400).json({ error: 'Error al cargar archivo' });
  }
  if (error) {
    return res.status(400).json({ error: error.message || 'Error de validación' });
  }
  next();
});

module.exports = router;
