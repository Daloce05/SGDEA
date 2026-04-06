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

// Middleware de autenticación y autorización
const { verificarToken } = require('../../middleware/autenticacion');
const {
  verificarAdministrador,
  verificarCargador,
  verificarConsultor,
  permitirModificacion,
  permitirAdministracion
} = require('../../middleware/autorizacion');

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
 * Acceso: Cualquier usuario autenticado
 */
router.get('/oficinas', verificarToken, verificarConsultor, ControladorOficina.obtenerTodas);

/**
 * POST /api/trd/oficinas
 * Crea una nueva oficina
 * Acceso: Solo administrador
 */
router.post('/oficinas', verificarToken, permitirAdministracion, ControladorOficina.crear);

/**
 * GET /api/trd/oficinas/:idOficina
 * Obtiene una oficina con sus series
 * Acceso: Cualquier usuario autenticado
 */
router.get('/oficinas/:idOficina', verificarToken, verificarConsultor, ControladorOficina.obtenerPorId);

/**
 * GET /api/trd/oficinas/:idOficina/jerarquia
 * Obtiene la jerarquía completa de una oficina
 * Acceso: Cualquier usuario autenticado
 */
router.get('/oficinas/:idOficina/jerarquia', verificarToken, verificarConsultor, ControladorOficina.obtenerJerarquia);

/**
 * PUT /api/trd/oficinas/:idOficina
 * Actualiza una oficina
 * Acceso: Solo administrador
 */
router.put('/oficinas/:idOficina', verificarToken, permitirAdministracion, ControladorOficina.actualizar);

/**
 * DELETE /api/trd/oficinas/:idOficina
 * Desactiva una oficina
 * Acceso: Solo administrador
 */
router.delete('/oficinas/:idOficina', verificarToken, permitirAdministracion, ControladorOficina.desactivar);

// ============================================
// NIVEL 1: SERIES (Ahora bajo OFICINAS)
// ============================================

/**
 * GET /api/trd/oficinas/:idOficina/series
 * Obtiene todas las series de una oficina
 * Acceso: Cualquier usuario autenticado
 */
router.get('/oficinas/:idOficina/series', verificarToken, verificarConsultor, ControladorSerie.obtenerPorOficina);

/**
 * POST /api/trd/oficinas/:idOficina/series
 * Crea una nueva serie en una oficina
 * Acceso: Solo administrador
 */
router.post('/oficinas/:idOficina/series', verificarToken, permitirAdministracion, ControladorSerie.crear);

/**
 * Endpoint heredado para compatibilidad
 * GET /api/trd/series
 */
router.get('/series', verificarToken, verificarConsultor, ControladorSerie.obtenerTodas);

/**
 * POST /api/trd/series (LEGACY)
 * Crea una serie - id_oficina va en body
 * Acceso: Solo administrador
 */
router.post('/series', verificarToken, permitirAdministracion, ControladorSerie.crearLegacy);

/**
 * GET /api/trd/series/:idSerie
 */
router.get('/series/:idSerie', verificarToken, verificarConsultor, validarIds, validarSerie, ControladorSerie.obtenerPorId);

/**
 * PUT /api/trd/series/:idSerie
 * Actualiza una serie
 * Acceso: Solo administrador
 */
router.put('/series/:idSerie', verificarToken, permitirAdministracion, validarIds, validarSerie, ControladorSerie.actualizar);

/**
 * DELETE /api/trd/series/:idSerie
 * Desactiva una serie
 * Acceso: Solo administrador
 */
router.delete('/series/:idSerie', verificarToken, permitirAdministracion, validarIds, validarSerie, ControladorSerie.desactivar);

// ============================================
// NIVEL 2: SUBSERIES
// ============================================

/**
 * GET /api/trd/series/:idSerie/subseries
 * Obtiene subseries de una serie
 * Acceso: Cualquier usuario autenticado
 */
router.get('/series/:idSerie/subseries', verificarToken, verificarConsultor, validarIds, validarSerie, ControladorSubserie.obtenerPorSerie);

/**
 * POST /api/trd/series/:idSerie/subseries
 * Crea una subserie en una serie
 * Acceso: Solo administrador
 */
router.post('/series/:idSerie/subseries', verificarToken, permitirAdministracion, validarIds, validarSerie, ControladorSubserie.crear);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie
 * Obtiene una subserie específica
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie',
  verificarToken, verificarConsultor,
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorSubserie.obtenerPorId
);

/**
 * PUT /api/trd/series/:idSerie/subseries/:idSubserie
 * Actualiza una subserie
 * Acceso: Solo administrador
 */
router.put(
  '/series/:idSerie/subseries/:idSubserie',
  verificarToken, permitirAdministracion,
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorSubserie.actualizar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie
 * Desactiva una subserie
 * Acceso: Solo administrador
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie',
  verificarToken, permitirAdministracion,
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
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos',
  verificarToken, verificarConsultor,
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorTipoDocumental.obtenerPorSubserie
);

/**
 * POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos
 * Crea un tipo documental bajo una subserie (REQUERIDO)
 * Acceso: Solo administrador
 */
router.post(
  '/series/:idSerie/subseries/:idSubserie/tipos',
  verificarToken, permitirAdministracion,
  validarIds,
  validarSerie,
  validarSubserie,
  ControladorTipoDocumental.crear
);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 * Obtiene un tipo documental
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  verificarToken, verificarConsultor,
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorTipoDocumental.obtenerPorId
);

/**
 * PUT /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 * Acceso: Solo administrador
 */
router.put(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  verificarToken, permitirAdministracion,
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorTipoDocumental.actualizar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
 * Acceso: Solo administrador
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo',
  verificarToken, permitirAdministracion,
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
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos',
  verificarToken, verificarConsultor,
  validarIds,
  validarSerie,
  validarSubserie,
  validarTipo,
  ControladorArchivo.obtenerPorTipo
);

/**
 * POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
 * Carga un archivo PDF
 * Acceso: Administrador y Cargador
 */
router.post(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos',
  verificarToken, permitirModificacion,
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
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo',
  verificarToken, verificarConsultor,
  validarIds,
  validarArchivo,
  ControladorArchivo.obtenerPorId
);

/**
 * GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar
 * Descarga un archivo PDF
 * Acceso: Cualquier usuario autenticado
 */
router.get(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar',
  verificarToken, verificarConsultor,
  validarIds,
  validarArchivo,
  ControladorArchivo.descargar
);

/**
 * DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
 * Desactiva un archivo
 * Acceso: Administrador y Cargador
 */
router.delete(
  '/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo',
  verificarToken, permitirModificacion,
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
 * Acceso: Cualquier usuario autenticado
 */
router.get('/archivos/buscar', verificarToken, verificarConsultor, ControladorArchivo.buscar);

/**
 * GET /api/trd/archivos/estadisticas
 * Obtiene estadísticas generales
 * Acceso: Cualquier usuario autenticado
 */
router.get('/archivos/estadisticas', verificarToken, verificarConsultor, ControladorArchivo.estadisticas);

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
