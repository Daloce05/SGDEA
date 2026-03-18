/**
 * DOCUMENTACIÓN TÉCNICA - SGDEA Backend
 * 
 * Guía detallada para desarrolladores
 */

/**
 * ============================================
 * 1. ARQUITECTURA MVC
 * ============================================
 * 
 * MODELOS (M):
 * - Ubicación: src/modelos/
 * - Responsabilidad: Acceso a base de datos
 * - No contienen lógica de negocio
 * - Métodos estáticos que retornan promesas
 * - Ejemplo: ModeloUsuario.obtenerPorId(id)
 * 
 * CONTROLADORES (C):
 * - Ubicación: src/controladores/
 * - Responsabilidad: Lógica de negocio
 * - Usan modelos para obtener/guardar datos
 * - Validan datos después de middleware
 * - Responden al cliente
 * - Ejemplo: ControladorUsuarios.obtenerTodos(req, res)
 * 
 * VISTAS (V):
 * - Ubicación: src/rutas/
 * - Responsabilidad: Definición de endpoints
 * - Enrutan peticiones a controladores
 * - Aplican middleware específico
 * - Documentan parámetros y respuestas
 * - Ejemplo: router.get('/', autenticacion, controlador.accion)
 */

/**
 * ============================================
 * 2. FLUJO DE UNA PETICIÓN
 * ============================================
 * 
 * 1. Cliente envía petición HTTP
 * 2. Express la enruta al archivo de rutas correcto
 * 3. Se ejecutan middleware específicos de ruta:
 *    - verificarToken (autenticación)
 *    - validar* (validación de datos)
 * 4. Se llama al método del controlador
 * 5. Controlador usa modelos para datos
 * 6. Controlador responde al cliente con JSON
 */

/**
 * ============================================
 * 3. CREAR UN NUEVO MÓDULO
 * ============================================
 * 
 * Ejemplo: Sistema de Notificaciones
 * 
 * PASO 1: Crear modelo (src/modelos/ModeloNotificacion.js)
 * -------
 * class ModeloNotificacion {
 *   static async crear(datos) { ... }
 *   static async obtenerPorUsuario(usuarioId) { ... }
 *   static async marcarComoLeida(id) { ... }
 * }
 * 
 * PASO 2: Crear controlador (src/controladores/ControladorNotificaciones.js)
 * -------
 * class ControladorNotificaciones {
 *   static async obtener(req, res) {
 *     const notificaciones = await ModeloNotificacion.obtenerPorUsuario(req.usuario.id);
 *     res.json({ notificaciones });
 *   }
 * }
 * 
 * PASO 3: Crear rutas (src/rutas/notificaciones.js)
 * -------
 * const router = express.Router();
 * router.get('/', verificarToken, ControladorNotificaciones.obtener);
 * module.exports = router;
 * 
 * PASO 4: Registrar en app.js
 * -------
 * const rutasNotificaciones = require('./src/rutas/notificaciones');
 * app.use('/api/notificaciones', rutasNotificaciones);
 */

/**
 * ============================================
 * 4. CONVENCIONES DE CÓDIGO
 * ============================================
 * 
 * NOMBRES:
 * - Clases: PascalCase (ControladorUsuarios, ModeloDocumento)
 * - Funciones: camelCase (obtenerTodos, crearUsuario)
 * - Constantes: UPPER_SNAKE_CASE (DB_HOST, PUERTO)
 * - Variables: camelCase (usuario, documentoId)
 * 
 * ARCHIVOS:
 * - Controllers: Controlador*.js (ControladorUsuarios.js)
 * - Models: Modelo*.js (ModeloUsuario.js)
 * - Middleware: nombreMiddleware.js (autenticacion.js)
 * - Routes: nombreEntidad.js (usuarios.js)
 * 
 * FUNCIONES ASINCRÓNICAS:
 * - Siempre async/await, nunca callbacks
 * - Manejo de errores en try/catch
 * - Loguear errores importantes
 * 
 * PROMESAS:
 * - Usar Promise.all() para operaciones paralelas
 * - Nunca ignorar promesas (sin await)
 */

/**
 * ============================================
 * 5. PATRONES COMUNES
 * ============================================
 * 
 * VALIDAR RECURSO ANTES DE ACTUALIZAR:
 * -----
 * const recurso = await Modelo.obtenerPorId(id);
 * if (!recurso) {
 *   return res.status(404).json({ error: 'No encontrado' });
 * }
 * 
 * ACTUALIZAR MÚLTIPLES CAMPOS:
 * -----
 * const campos = [];
 * const valores = [];
 * if (datos.campo1) {
 *   campos.push('campo1 = ?');
 *   valores.push(datos.campo1);
 * }
 * if (campos.length === 0) return false;
 * valores.push(id);
 * 
 * PAGINACIÓN:
 * -----
 * const limite = parseInt(req.query.limite) || 20;
 * const pagina = parseInt(req.query.pagina) || 1;
 * const offset = (pagina - 1) * limite;
 * 
 * VALIDACIÓN DE PROPIEDAD:
 * -----
 * if (documento.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
 *   return res.status(403).json({ error: 'Sin permiso' });
 * }
 */

/**
 * ============================================
 * 6. SEGURIDAD
 * ============================================
 * 
 * AUTENTICACIÓN:
 * - Usar middleware verificarToken en rutas privadas
 * - Token JWT contiene: id, email, rol
 * - Expiración configurable en .env
 * 
 * AUTORIZACIÓN:
 * - Usar verificarAdmin para operaciones admnistrativas
 * - Usar verificarGerente para operaciones de gestión
 * - Verificar propiedad en operaciones de usuario
 * 
 * VALIDACIÓN:
 * - Validar entrada antes de usarla
 * - Sanitizar datos de entrada
 * - Usar express-validator
 * 
 * CONTRASEÑAS:
 * - Nunca guardar en texto plano
 * - Usar bcryptjs para encriptación
 * - Mínimo 8 caracteres en validación
 * 
 * SQL INJECTION:
 * - Usar prepared statements (placeholders ?)
 * - Nunca concatenar SQL directamente
 * - mysql2 usa prepared statements automáticamente
 */

/**
 * ============================================
 * 7. MANEJO DE ERRORES
 * ============================================
 * 
 * try/catch EN CONTROLADORES:
 * -----
 * try {
 *   const datos = await Modelo.accion();
 *   res.json({ datos });
 * } catch (error) {
 *   logger.error(`Descripción: ${error.message}`);
 *   res.status(500).json({ error: 'Mensaje para usuario' });
 * }
 * 
 * CÓDIGOS HTTP:
 * - 200: Éxito
 * - 201: Creado
 * - 400: Solicitud incorrecta
 * - 401: No autenticado
 * - 403: No autorizado
 * - 404: No encontrado
 * - 500: Error del servidor
 * 
 * LOGGING:
 * - logger.info() - Información general
 * - logger.advertencia() - Advertencias
 * - logger.error() - Errores
 * - logger.debug() - Información de debug
 */

/**
 * ============================================
 * 8. TESTING
 * ============================================
 * 
 * ESTRUCTURA:
 * -----
 * describe('ControladorUsuarios', () => {
 *   describe('obtenerTodos', () => {
 *     it('debería retornar lista de usuarios', async () => {
 *       const res = await request(app).get('/api/usuarios');
 *       expect(res.status).toBe(200);
 *       expect(res.body.usuarios).toBeDefined();
 *     });
 *   });
 * });
 * 
 * MOCKING:
 * - Moclear modelos para no afectar BD
 * - Usar supertest para peticiones HTTP
 * - Limpieza de datos de prueba
 */

/**
 * ============================================
 * 9. PERFORMANCE
 * ============================================
 * 
 * ÍNDICES:
 * - Crear índices en columnas de búsqueda
 * - Usar FULLTEXT para búsqueda de texto
 * - Índices en FK para joins
 * 
 * CONSULTAS:
 * - Evitar SELECT * (especificar columnas)
 * - Usar LIMIT en búsquedas
 * - Paginación obligatoria para listas grandes
 * 
 * CACHÉ:
 * - Considerar Redis para datos frecuentes
 * - Caché de sesiones
 * 
 * POOL DE CONEXIONES:
 * - Ya configurado en baseDatos.js
 * - 10 conexiones máximo por defecto
 * - Ajustar según carga esperada
 */

/**
 * ============================================
 * 10. DEPLOYMENT
 * ============================================
 * 
 * PRODUCCIÓN:
 * 1. Cambiar AMBIENTE a 'produccion' en .env
 * 2. Usar contraseña fuerte para JWT_SECRETO
 * 3. Configurar DB con host remoto
 * 4. Usar variables de entorno seguras
 * 5. Habilitar HTTPS (reverse proxy nginx)
 * 6. Monitorear logs y errores
 * 7. Backups automáticos de BD
 * 8. Usar PM2 u similar para manage proceso
 */

/**
 * ============================================
 * 11. ESTRUCTURA DE RESPUESTAS
 * ============================================
 * 
 * ÉXITO (200):
 * {
 *   "mensaje": "Operación realizada exitosamente",
 *   "data": { ... },
 *   "total": 10
 * }
 * 
 * ERROR (400+):
 * {
 *   "error": "Descripción del error",
 *   "detalles": [ ... ]
 * }
 * 
 * PAGINADO:
 * {
 *   "mensaje": "Datos obtenidos",
 *   "total": 100,
 *   "pagina": 1,
 *   "limite": 20,
 *   "datos": [ ... ]
 * }
 */

/**
 * ============================================
 * 12. RECURSOS ADICIONALES
 * ============================================
 * 
 * - Express: https://expressjs.com/
 * - MySQL2: https://github.com/sidorares/node-mysql2
 * - JWT: https://jwt.io/
 * - Documentación API: http://localhost:3000/api/prueba
 * - Logs: /logs/general.log
 */

module.exports = {
  documentacion: 'Ver comentarios en este archivo para documentación técnica completa'
};
