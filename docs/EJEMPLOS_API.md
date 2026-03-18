/**
 * EJEMPLOS DE USO - API REST SGDEA
 * 
 * Ejemplos de peticiones HTTP reales para probar los endpoints
 * Usar con cliente HTTP como Postman, Thunder Client o curl
 */

/**
 * ============================================
 * 1. AUTENTICACIÓN
 * ============================================
 */

// POST /api/autenticacion/registro
// Registrar un usuario nuevo
{
  "nombre": "Juan",
  "apellido": "Pérez García",
  "email": "juan.perez@empresa.com",
  "contraseña": "MiContraseña123!"
}

// Respuesta esperada (201):
{
  "mensaje": "Usuario registrado correctamente",
  "usuario_id": 1
}

---

// POST /api/autenticacion/login
// Iniciar sesión
{
  "email": "juan.perez@empresa.com",
  "contraseña": "MiContraseña123!"
}

// Respuesta esperada (200):
{
  "mensaje": "Sesión iniciada correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez García",
    "email": "juan.perez@empresa.com",
    "rol": "usuario"
  }
}

---

// GET /api/autenticacion/validar
// Headers: Authorization: Bearer <token>
// Validar que un token es válido
// Respuesta esperada (200):
{
  "valido": true,
  "usuario": {
    "id": 1,
    "email": "juan.perez@empresa.com",
    "rol": "usuario",
    "iat": 1710600000,
    "exp": 1710686400
  }
}

/**
 * ============================================
 * 2. GESTIÓN DE USUARIOS
 * ============================================
 */

// GET /api/usuarios/perfil
// Headers: Authorization: Bearer <token>
// Obtener perfil del usuario autenticado
// Respuesta esperada (200):
{
  "mensaje": "Perfil obtenido correctamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez García",
    "email": "juan.perez@empresa.com",
    "rol": "usuario",
    "estado": true,
    "fecha_creacion": "2024-03-16 10:30:00",
    "fecha_actualizacion": "2024-03-16 10:30:00"
  }
}

---

// GET /api/usuarios
// Headers: Authorization: Bearer <token_admin>
// Obtener todos los usuarios (requiere rol admin)
// Respuesta esperada (200):
{
  "mensaje": "Usuarios obtenidos correctamente",
  "total": 5,
  "usuarios": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@ejemplo.com",
      "rol": "usuario",
      "estado": true,
      "fecha_creacion": "2024-03-16 10:30:00"
    },
    ...
  ]
}

---

// GET /api/usuarios/1
// Headers: Authorization: Bearer <token_admin>
// Obtener un usuario específico
// Respuesta esperada (200): Similar a la de arriba

---

// PUT /api/usuarios/1
// Headers: Authorization: Bearer <token_admin>
// Actualizar un usuario
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "rol": "gerente"
}

// Respuesta esperada (200):
{
  "mensaje": "Usuario actualizado correctamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan Carlos",
    "apellido": "Pérez García",
    "email": "juan@ejemplo.com",
    "rol": "gerente",
    "estado": true,
    "fecha_creacion": "2024-03-16 10:30:00",
    "fecha_actualizacion": "2024-03-16 11:00:00"
  }
}

---

// DELETE /api/usuarios/1
// Headers: Authorization: Bearer <token_admin>
// Desactivar un usuario
// Respuesta esperada (200):
{
  "mensaje": "Usuario desactivado correctamente"
}

/**
 * ============================================
 * 3. GESTIÓN DE DOCUMENTOS
 * ============================================
 */

// GET /api/documentos
// Headers: Authorization: Bearer <token>
// Query: ?limite=20&pagina=1
// Obtener todos los documentos (con paginación)
// Respuesta esperada (200):
{
  "mensaje": "Documentos obtenidos correctamente",
  "total": 15,
  "pagina": 1,
  "limite": 20,
  "documentos": [
    {
      "id": 1,
      "titulo": "Reporte Anual 2024",
      "descripcion": "Reporte anual de resultados financieros",
      "usuario_id": 1,
      "tipo_documento": "Reporte",
      "estado": "activo",
      "vista_publica": false,
      "descargas": 5,
      "fecha_creacion": "2024-03-16 09:00:00",
      "tamaño_archivo": 2048576
    },
    ...
  ]
}

---

// GET /api/documentos/buscar
// Headers: Authorization: Bearer <token>
// Query: ?termino=reporte
// Buscar documentos (búsqueda de texto)
// Respuesta esperada (200):
{
  "mensaje": "Búsqueda realizada correctamente",
  "total": 3,
  "termino": "reporte",
  "documentos": [
    { ... documento que coincide ... },
    ...
  ]
}

---

// POST /api/documentos
// Headers: Authorization: Bearer <token>
// Content-Type: multipart/form-data
// Cargar un documento nuevo
//
// Form Data:
// - archivo: [archivo.pdf]
// - titulo: "Mi Documento Importante"
// - tipo_documento: "Contrato"
// - descripcion: "Descripción del documento"
//
// Respuesta esperada (201):
{
  "mensaje": "Documento cargado correctamente",
  "documento_id": 5,
  "archivo": {
    "nombre": "a1b2c3d4-1710600000.pdf",
    "tamaño": 2048576
  }
}

---

// GET /api/documentos/1
// Headers: Authorization: Bearer <token>
// Obtener detalles de un documento
// Respuesta esperada (200):
{
  "mensaje": "Documento obtenido correctamente",
  "documento": {
    "id": 1,
    "titulo": "Reporte Anual 2024",
    "descripcion": "...",
    "usuario_id": 1,
    "tipo_documento": "Reporte",
    "ruta_archivo": "./documentos/uuid-timestamp.pdf",
    "tamaño_archivo": 2048576,
    "palabras_clave": "reporte, finanzas, anual",
    "estado": "activo",
    "vista_publica": false,
    "descargas": 5,
    "fecha_creacion": "2024-03-16 09:00:00"
  }
}

---

// PUT /api/documentos/1
// Headers: Authorization: Bearer <token>
// Actualizar información de un documento
{
  "titulo": "Reporte Anual 2024 - Revisado",
  "descripcion": "Reporte anual revisado con datos actualizados",
  "palabras_clave": "reporte, finanzas, anual, 2024, revisado"
}

// Respuesta esperada (200):
{
  "mensaje": "Documento actualizado correctamente",
  "documento": { ... datos actualizados ... }
}

---

// GET /api/documentos/1/descargar
// Headers: Authorization: Bearer <token>
// Descargar un documento
// Respuesta: El archivo se descarga
// Efecto: Se incrementa el contador de descargas

---

// DELETE /api/documentos/1
// Headers: Authorization: Bearer <token>
// Eliminar un documento (eliminación lógica)
// Respuesta esperada (200):
{
  "mensaje": "Documento eliminado correctamente"
}

/**
 * ============================================
 * 4. USAR CON CURL
 * ============================================
 */

// Registrar usuario
curl -X POST http://localhost:3000/api/autenticacion/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }'

---

// Iniciar sesión
curl -X POST http://localhost:3000/api/autenticacion/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }'

---

// Usar token en petición
curl -X GET http://localhost:3000/api/usuarios/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

---

// Cargar documento
curl -X POST http://localhost:3000/api/documentos \
  -H "Authorization: Bearer <token>" \
  -F "archivo=@documento.pdf" \
  -F "titulo=Mi Documento" \
  -F "tipo_documento=Reporte"

/**
 * ============================================
 * 5. USAR CON POSTMAN
 * ============================================
 */

// 1. Crear colección "SGDEA"
// 2. Añadir variable {{token}} en variables de colección
// 3. En cada petición autenticada:
//    - Headers > Authorization
//    - Type: Bearer Token
//    - Token: {{token}}
// 4. En el script de Test del login:
//    pm.environment.set("token", pm.response.json().token);
// 5. Así el token se guarda automáticamente entre peticiones

/**
 * ============================================
 * 6. ERRORES COMUNES Y RESPUESTAS
 * ============================================
 */

// Sin autenticación (401)
{
  "error": "Token no proporcionado"
}

---

// Token inválido (401)
{
  "error": "Token inválido o expirado"
}

---

// Sin permisos (403)
{
  "error": "Permiso insuficiente. Se requiere rol de administrador"
}

---

// Datos inválidos (400)
{
  "error": "Datos inválidos",
  "detalles": [
    {
      "value": "",
      "msg": "El nombre es obligatorio",
      "param": "nombre",
      "location": "body"
    }
  ]
}

---

// Recurso no encontrado (404)
{
  "error": "Usuario no encontrado"
}

---

// Error interno del servidor (500)
{
  "error": "Error al obtener usuarios"
}
