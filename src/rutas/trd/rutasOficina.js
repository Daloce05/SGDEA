/**
 * Rutas de Oficinas - TRD
 * 
 * Endpoints para gestión de oficinas
 * Requiere autenticación y autorización
 */

const express = require('express');
const router = express.Router();
const ControladorOficina = require('../../controladores/trd/ControladorOficina');
const { autenticar } = require('../../middleware/autenticacion');
const { validar, body, param } = require('express-validator');

/**
 * GET /api/trd/oficinas
 * Obtiene todas las oficinas
 */
router.get(
  '/',
  autenticar,
  ControladorOficina.obtenerTodas
);

/**
 * GET /api/trd/oficinas/:idOficina
 * Obtiene una oficina específica
 */
router.get(
  '/:idOficina',
  autenticar,
  param('idOficina').isInt().toInt(),
  validar,
  ControladorOficina.obtenerPorId
);

/**
 * GET /api/trd/oficinas/codigo/:codigo
 * Obtiene una oficina por código
 */
router.get(
  '/codigo/:codigo',
  autenticar,
  param('codigo').isString().trim(),
  validar,
  ControladorOficina.obtenerPorCodigo
);

/**
 * GET /api/trd/oficinas/:idOficina/jerarquia
 * Obtiene la jerarquía completa de una oficina
 */
router.get(
  '/:idOficina/jerarquia',
  autenticar,
  param('idOficina').isInt().toInt(),
  validar,
  ControladorOficina.obtenerJerarquia
);

/**
 * POST /api/trd/oficinas
 * Crea una nueva oficina (requiere admin)
 */
router.post(
  '/',
  autenticar,
  body('codigo_oficina').isString().trim().notEmpty(),
  body('nombre_oficina').isString().trim().notEmpty(),
  body('dependencia').optional().isString().trim(),
  validar,
  ControladorOficina.crear
);

/**
 * PUT /api/trd/oficinas/:idOficina
 * Actualiza una oficina
 */
router.put(
  '/:idOficina',
  autenticar,
  param('idOficina').isInt().toInt(),
  body('nombre_oficina').optional().isString().trim(),
  body('dependencia').optional().isString().trim(),
  validar,
  ControladorOficina.actualizar
);

/**
 * DELETE /api/trd/oficinas/:idOficina
 * Desactiva una oficina
 */
router.delete(
  '/:idOficina',
  autenticar,
  param('idOficina').isInt().toInt(),
  validar,
  ControladorOficina.desactivar
);

module.exports = router;
