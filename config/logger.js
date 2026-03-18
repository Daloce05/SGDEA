/**
 * Configuración del sistema de logging (registro de eventos)
 * 
 * Utiliza Winston para crear logs estructurados y organizados
 * Los logs se guardan en archivos y se muestran en la consola
 */

const winston = require('winston');
const path = require('path');

/**
 * Define los niveles de log personalizados
 */
const nivelLog = {
  error: 0,
  advertencia: 1,
  info: 2,
  debug: 3
};

/**
 * Define los colores para los logs en consola
 */
const coloresLog = {
  error: 'red',
  advertencia: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(coloresLog);

/**
 * Crea y configura el logger de Winston
 */
const logger = winston.createLogger({
  levels: nivelLog,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack || ''}`;
    })
  ),
  transports: [
    // Log de errores en archivo separado
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Todos los logs en archivo general
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/general.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Logs en consola con colores
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ]
});

module.exports = logger;
