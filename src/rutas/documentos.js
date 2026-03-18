/**
 * Rutas de Documentos
 * 
 * Define los endpoints para gestión de documentos
 * Requiere autenticación en todas las rutas
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ControladorDocumentos = require('../controladores/ControladorDocumentos');
const { verificarToken } = require('../middleware/autenticacion');
const { 
  validarCargaDocumento, 
  validarActualizacionDocumento, 
  validarBusqueda, 
  validarId 
} = require('../middleware/validacion');

const router = express.Router();

/**
 * Configuración de multer para carga de archivos
 */
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../documentos'));
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, nombreUnico);
  }
});

const filtrarArchivos = (req, file, cb) => {
  // Tipos MIME permitidos
  const tiposPermitidos = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain'
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const cargar = multer({
  storage: almacenamiento,
  fileFilter: filtrarArchivos,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

/**
 * GET /api/documentos
 * Obtiene la lista de todos los documentos
 * Requiere: Token válido
 * 
 * Query:
 *   - limite (number, optional): Límite de resultados (default: 20)
 *   - pagina (number, optional): Número de página (default: 1)
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - total (number): Cantidad de documentos
 *   - documentos (array): Lista de documentos
 */
router.get('/', verificarToken, ControladorDocumentos.obtenerTodos);

/**
 * GET /api/documentos/buscar
 * Busca documentos por término
 * Requiere: Token válido
 * 
 * Query:
 *   - termino (string): Término de búsqueda (min 3 caracteres)
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - documentos (array): Documentos encontrados
 */
router.get('/buscar', verificarToken, validarBusqueda, ControladorDocumentos.buscar);

/**
 * GET /api/documentos/:id
 * Obtiene un documento específico por ID
 * Requiere: Token válido
 * 
 * Params:
 *   - id (number): ID del documento
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - documento (object): Datos del documento
 */
router.get('/:id', verificarToken, validarId, ControladorDocumentos.obtenerPorId);

/**
 * POST /api/documentos
 * Carga un documento nuevo
 * Requiere: Token válido
 * 
 * Form Data:
 *   - archivo (file): Archivo a cargar
 *   - titulo (string): Título del documento
 *   - tipo_documento (string): Tipo de documento
 *   - descripcion (string, optional): Descripción
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - documento_id (number): ID del documento creado
 */
router.post('/', verificarToken, cargar.single('archivo'), validarCargaDocumento, ControladorDocumentos.cargar);

/**
 * PUT /api/documentos/:id
 * Actualiza los datos de un documento
 * Requiere: Token válido
 * 
 * Params:
 *   - id (number): ID del documento
 * 
 * Body:
 *   - titulo (string, optional): Nuevo título
 *   - descripcion (string, optional): Nueva descripción
 *   - palabras_clave (string, optional): Palabras clave
 * 
 * Response:
 *   - mensaje (string): Confirmación
 *   - documento (object): Datos actualizados
 */
router.put('/:id', verificarToken, validarId, validarActualizacionDocumento, ControladorDocumentos.actualizar);

/**
 * GET /api/documentos/:id/descargar
 * Descarga un documento
 * Requiere: Token válido
 * 
 * Params:
 *   - id (number): ID del documento
 * 
 * Response: Archivo descargado
 */
router.get('/:id/descargar', verificarToken, validarId, ControladorDocumentos.descargar);

/**
 * DELETE /api/documentos/:id
 * Elimina un documento
 * Requiere: Token válido
 * 
 * Params:
 *   - id (number): ID del documento
 * 
 * Response:
 *   - mensaje (string): Confirmación
 */
router.delete('/:id', verificarToken, validarId, ControladorDocumentos.eliminar);

module.exports = router;
