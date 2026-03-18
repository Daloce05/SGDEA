/**
 * Utilidades Generales
 * 
 * Funciones auxiliares reutilizables en toda la aplicación
 */

/**
 * Genera una respuesta estándar de éxito
 * @param {string} mensaje - Mensaje de respuesta
 * @param {*} datos - Datos adicionales
 * @returns {Object} Objeto de respuesta formateado
 */
function respuestaExito(mensaje, datos = null) {
  return {
    exito: true,
    mensaje,
    ...(datos && { datos })
  };
}

/**
 * Genera una respuesta estándar de error
 * @param {string} error - Mensaje de error
 * @param {number} codigo - Código de error (default: 500)
 * @returns {Object} Objeto de error formateado
 */
function respuestaError(error, codigo = 500) {
  return {
    exito: false,
    error,
    codigo
  };
}

/**
 * Valida que un email tenga formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Genera una cadena aleatoria de caracteres
 * @param {number} longitud - Longitud de la cadena
 * @returns {string} Cadena aleatoria
 */
function generarCadenaAleatoria(longitud = 20) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return resultado;
}

/**
 * Formatea una fecha al formato YYYY-MM-DD HH:mm:ss
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha || !(fecha instanceof Date)) {
    return null;
  }

  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const día = String(fecha.getDate()).padStart(2, '0');
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const segundos = String(fecha.getSeconds()).padStart(2, '0');

  return `${año}-${mes}-${día} ${horas}:${minutos}:${segundos}`;
}

/**
 * Convierte bytes a formato legible (KB, MB, GB)
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
function formatearTamaño(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const tamaños = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
}

/**
 * Pagina un array de datos
 * @param {Array} datos - Array a paginar
 * @param {number} pagina - Número de página
 * @param {number} porPagina - Elementos por página
 * @returns {Object} Objeto con datos paginados y información
 */
function paginar(datos, pagina = 1, porPagina = 20) {
  const total = datos.length;
  const totalPaginas = Math.ceil(total / porPagina);
  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina;

  return {
    datos: datos.slice(inicio, fin),
    paginacion: {
      pagina,
      porPagina,
      total,
      totalPaginas,
      tieneSiguiente: pagina < totalPaginas,
      tieneAnterior: pagina > 1
    }
  };
}

/**
 * Obtiene el tipo MIME de una extensión de archivo
 * @param {string} extension - Extensión del archivo (sin punto)
 * @returns {string} Tipo MIME
 */
function obtenerMimeType(extension) {
  const tipos = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'zip': 'application/zip'
  };

  return tipos[extension.toLowerCase()] || 'application/octet-stream';
}

module.exports = {
  respuestaExito,
  respuestaError,
  validarEmail,
  generarCadenaAleatoria,
  formatearFecha,
  formatearTamaño,
  paginar,
  obtenerMimeType
};
