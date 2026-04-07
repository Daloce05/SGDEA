/**
 * Archivo principal de la aplicación - Backend SGDEA
 * 
 * Sistema de Gestión Documental Empresarial Avanzado
 * Este archivo configura e inicializa el servidor Express
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./config/logger');

// Importar rutas
const rutasUsuarios = require('./src/rutas/usuarios');
const rutasAutenticacion = require('./src/rutas/autenticacion');
const rutasTRD = require('./src/rutas/trd/rutasTRD');
const rutasAdmin = require('./src/rutas/admin');

// Importar middleware de autenticación
const verificarToken = require('./src/middleware/autenticacion').verificarToken;

// Prueba de conexión a PostgreSQL
const { probarConexionPostgres } = require('./config/postgresqlTRD');

/**
 * Inicializa la aplicación Express
 */
const app = express();
const PUERTO = process.env.PUERTO || 3000;

/**
 * ============================================
 * MIDDLEWARE GLOBAL
 * ============================================
 */

// Seguridad: Helmet agrega cabeceras HTTP seguras
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}));

// CORS: Permite peticiones desde otros dominios
app.use(cors({
  origin: process.env.ORIGEN_PERMITIDO || 'http://localhost:3001',
  credentials: true
}));

// Body parser: Parsea JSON en las peticiones
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Middleware de logging de peticiones
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * ============================================
 * RUTAS
 * ============================================
 */

// Ruta de prueba
app.get('/api/prueba', (req, res) => {
  res.json({ 
    mensaje: 'Backend SGDEA funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz - sirve la aplicación frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de la aplicación
app.use('/api/autenticacion', rutasAutenticacion);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/trd', rutasTRD);

// Rutas protegidas de administración (requieren autenticación)
app.use('/api/admin', verificarToken, rutasAdmin);

/**
 * ============================================
 * MANEJO DE ERRORES
 * ============================================
 */

// Ruta 404 - No encontrado
app.use((req, res) => {
  logger.advertencia(`Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    metodo: req.method
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  logger.error(`Error en ${req.method} ${req.path}: ${err.message}`);
  
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.AMBIENTE === 'desarrollo' && { stack: err.stack })
  });
});

/**
 * ============================================
 * INICIALIZACIÓN DEL SERVIDOR
 * ============================================
 */

async function iniciarServidor() {
  try {
    // Probar conexión a PostgreSQL TRD
    await probarConexionPostgres();
    
    // Iniciar servidor
    app.listen(PUERTO, () => {
      logger.info(`========================================`);
      logger.info(`✓ Servidor SGDEA iniciado`);
      logger.info(`✓ Puerto: ${PUERTO}`);
      logger.info(`✓ Ambiente: ${process.env.AMBIENTE}`);
      logger.info(`✓ URL: http://localhost:${PUERTO}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Inicia la aplicación
 */
if (require.main === module) {
  iniciarServidor();
}

module.exports = app;
