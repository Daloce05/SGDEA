# GUÍA DE IMPLEMENTACIÓN - RBAC (Control de Acceso Basado en Roles)

## ✅ Lo que se ha implementado

Este documento describe el sistema de control de acceso basado en roles (RBAC) implementado en SGDEA.

### **1. Backend**

#### Nuevos Middleware de Autorización
- Archivo: `src/middleware/autorizacion.js`
- Funciones:
  - `verificarAdministrador()` - Solo admin
  - `verificarCargador()` - Admin y cargador
  - `verificarConsultor()` - Todos (admin, cargador, consultor)
  - `permitirModificacion()` - Para crear/editar (admin y cargador)
  - `permitirAdministracion()` - Solo admin

#### Rutas Protegidas
- Archivo: `src/rutas/trd/rutasTRD.js` (ACTUALIZADO)
- Todas las rutas TRD ahora incluyen:
  - Token JWT obligatorio (`verificarToken`)
  - Validación de rol según la operación
  
**Permisos por Rol:**

| Acción | Admin | Cargador | Consultor |
|--------|-------|----------|-----------|
| Ver oficinas/series/subseries | ✅ | ✅ | ✅ |
| Crear oficinas/series/subseries | ✅ | ❌ | ❌ |
| Editar oficinas/series/subseries | ✅ | ❌ | ❌ |
| Eliminar oficinas/series/subseries | ✅ | ❌ | ❌ |
| Cargar archivos PDF | ✅ | ✅ | ❌ |
| Descargar archivos PDF | ✅ | ✅ | ✅ |
| Buscar documentos | ✅ | ✅ | ✅ |
| Ver estadísticas | ✅ | ✅ | ✅ |

#### Modelo de Usuario Extendido
- Archivo: `src/modelos/ModeloUsuario.js` (ACTUALIZADO)
- Nuevo método: `obtenerPorUsername(username)` - Login por usuario

#### Controlador de Autenticación Mejorado
- Archivo: `src/controladores/ControladorAutenticacion.js` (ACTUALIZADO)
- Permite login por usuario O email
- Token JWT contiene: id, email, username, nombre, rol

#### Validación de Entrada Actualizada
- Archivo: `src/middleware/validacion.js` (ACTUALIZADO)
- Campo `usuario` en lugar de solo `email`
- Acepta nombre de usuario o email

### **2. Frontend**

#### Nueva Página de Login
- Archivo: `public/login.html`
- Interfaz amigable con gradiente
- Muestra credenciales de prueba
- Valida credenciales en tiempo real
- Almacena token en localStorage
- Redirige al dashboard según rol

#### Sistema de Autenticación Frontend
- Archivo: `public/auth.js`
- Verifica sesión al cargar la página
- Redirige a login si no hay token
- Agrega token a TODAS las peticiones automáticamente
- Muestra nombre de usuario en header
- Controla visibilidad de elementos según rol
- Deshabilita botones de funciones no permitidas
- Función `cerrarSesion()`

#### Dashboard TRD Actualizado
- Archivo: `public/index.html` (ACTUALIZADO)
- Header mejorado con info del usuario
- Botón de cerrar sesión
- Control de acceso en UI

#### Estilos Adicionales
- Archivo: `public/styles.css` (ACTUALIZADO)
- Estilos para `.user-info`, `.user-name`, `.user-role`
- Estilos para `.btn-danger`, `.btn-warning`
- Estilos para elementos `.disabled`

### **3. Base de Datos**

#### Script de Migración
- Archivo: `migracion_roles_auth.js`
- Cambia roles ENUM a: `administrador`, `cargador`, `consultor`
- Agrega columna `username`
- Crea 3 usuarios de prueba

---

## 🚀 PASOS PARA ACTIVAR EL SISTEMA

### **Paso 1: Ejecutar la Migración de Base de Datos**

```bash
cd c:\Users\david\Desktop\SGDEA

# Ejecutar el script de migración
node migracion_roles_auth.js
```

**Salida esperada:**
```
===== INICIANDO MIGRACIÓN DE ROLES Y AUTENTICACIÓN =====
1. Actualizando tipos de roles...
✓ Roles actualizados correctamente
2. Verificando campo username...
   - Agregando columna username...
✓ Columna username agregada
3. Limpiando datos de prueba antiguos...
✓ Datos antiguos eliminados
4. Creando usuarios de prueba...
✓ Usuario admin (administrador) creado
✓ Usuario carga (cargador) creado
✓ Usuario consu (consultor) creado
===== MIGRACIÓN COMPLETADA EXITOSAMENTE =====
Usuarios de prueba disponibles:
  • Admin:     admin / admin123
  • Cargador:  carga / carga123
  • Consultor: consu / consu123
```

### **Paso 2: Iniciar el Servidor Backend**

```bash
npm run dev
```

**Salida esperada:**
```
✓ Backend SGDEA funcionando correctamente
Escuchando en puerto 3000
```

### **Paso 3: Acceder a la Aplicación**

1. Abrir navegador: `http://localhost:3000`
2. Se redirige automáticamente a: `http://localhost:3000/login.html`
3. Ingresar credenciales de uno de los tres usuarios

---

## 👥 USUARIOS DE PRUEBA

### **1. Administrador (Acceso Completo)**
```
Usuario: admin
Contraseña: admin123
Email: admin@sgdea.local
```
**Permisos:**
- ✅ Crear, editar y eliminar oficinas
- ✅ Crear, editar y eliminar series
- ✅ Crear, editar y eliminar subseries
- ✅ Crear, editar y eliminar tipos documentales
- ✅ Cargar, descargar y eliminar archivos
- ✅ Buscar y ver estadísticas

### **2. Cargador (Carga y Consulta)**
```
Usuario: carga
Contraseña: carga123
Email: carga@sgdea.local
```
**Permisos:**
- ❌ NO puede crear/editar/eliminar estructura
- ✅ Cargar archivos PDF
- ✅ Buscar documentos
- ✅ Descargar archivos
- ✅ Ver estadísticas

### **3. Consultor (Solo Lectura)**
```
Usuario: consu
Contraseña: consu123
Email: consu@sgdea.local
```
**Permisos:**
- ❌ NO puede crear/editar/eliminar nada
- ❌ NO puede cargar archivos
- ✅ Ver estructura documental
- ✅ Buscar documentos
- ✅ Descargar archivos
- ✅ Ver estadísticas

---

## 🔧 FLUJO TÉCNICO

### **Autenticación**

1. Usuario ingresa `usuario` (email o username) y `contraseña` en `/login.html`
2. POST a `/api/autenticacion/login`
3. Backend:
   - Busca por email y username
   - Valida contraseña con bcrypt
   - Genera JWT con: id, email, username, nombre, rol
   - Retorna token
4. Frontend:
   - Almacena token en `localStorage`
   - Almacena datos del usuario en `localStorage`
   - Redirige a `/index.html`

### **Control de Acceso en Backend**

```javascript
// Ejemplo: Crear una serie (solo admin)
POST /api/trd/oficinas/:idOficina/series
  ├─ verificarToken       // Verifica JWT
  ├─ permitirAdministracion  // Solo admin
  └─ ControladorSerie.crear
```

### **Control de Acceso en Frontend**

1. `auth.js` se carga primero
2. Verifica token en `localStorage`
3. Si no existe, redirige a `/login.html`
4. Muestra nombre y rol en header
5. Oculta botones según role:
   - Consultor: oculta todos los botones de crear/editar
   - Cargador: oculta botones de crear estructura, permite archivos
   - Admin: muestra todo

### **Peticiones a la API**

```javascript
// auth.js intercepta todas las peticiones
const originalFetch = window.fetch;
window.fetch = function(...args) {
  // Agrega header: Authorization: Bearer <token>
  // Automáticamente a todas las peticiones a /api/*
}
```

---

## 🛡️ Seguridad Implementada

### **Backend**
- ✅ JWT con expiración de 24h
- ✅ Contraseñas encriptadas con bcryptjs (salt=10)
- ✅ Validación de roles en middleware
- ✅ Validación de entrada con express-validator
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Logging de accesos denegados

### **Frontend**
- ✅ Token almacenado en localStorage
- ✅ Token validado al cargar la página
- ✅ Redireccionamiento a login si no hay sesión
- ✅ UI deshabilita acciones no permitidas
- ✅ Cierre de sesión con limpieza de localStorage
- ✅ Validación de acceso antes de hacer peticiones

---

## 📝 ARCHIVOS MODIFICADOS

### Backend
- ✨ `src/middleware/autorizacion.js` (NUEVO)
- 🔄 `src/middleware/autenticacion.js` (sin cambios, compatible)
- 🔄 `src/middleware/validacion.js` (campo usuario)
- 🔄 `src/modelos/ModeloUsuario.js` (método obtenerPorUsername)
- 🔄 `src/controladores/ControladorAutenticacion.js` (login por usuario)
- 🔄 `src/rutas/trd/rutasTRD.js` (middleware de autorización)
- 🔄 `src/rutas/autenticacion.js` (ya existía, sin cambios)
- 🔄 `app.js` (importación rutasAutenticacion habilitada)
- ✨ `migracion_roles_auth.js` (NUEVO - ejecutar una sola vez)

### Frontend
- ✨ `public/login.html` (NUEVO)
- ✨ `public/auth.js` (NUEVO)
- 🔄 `public/index.html` (header mejorado, vinculación auth.js)
- 🔄 `public/styles.css` (nuevos estilos)
- 🔄 `public/app.js` (sin cambios necesarios, puede usar auth.js)

---

## 🐞 Troubleshooting

### Problema: "Token no proporcionado" en login
**Solución:** Verificar que el servidor está ejecutando y responde a `/api/autenticacion/login`

### Problema: Redirige a login infinitamente
**Solución:** 
- Ejecutar `migracion_roles_auth.js`
- Verificar que localStorage tiene `token` y `usuario`

### Problema: Botones deshabilitados para admin
**Solución:** Verificar que `auth.js` se cargó antes de `app.js`

### Problema: Peticiones a API retornan 401
**Solución:** 
- Verificar que token es válido (`/api/autenticacion/validar`)
- Puede estar expirado (24h), hacer logout y login de nuevo

### Problema: Usuario no aparece en header
**Solución:** Verificar `usuarioActual` en consola: `console.log(usuarioActual)`

---

## 📚 Referencias

### Funciones Útiles en Frontend

```javascript
// Verificar sesión actual
usuarioActual          // { id, nombre, email, username, rol }
tokenActual            // JWT token

// Verificar permisos
esAdmin()              // boolean
esCargador()           // boolean
esConsultor()          // boolean
puedeEjecutarAccion('crear-serie')  // boolean

// Manejo de sesión
cerrarSesion()         // Logout
validarAcceso('crear-archivo')  // Valida y muestra error

// Notificaciones
mostrarNotificacion('Error', 'error')
```

### Endpoints de Autenticación

```
POST   /api/autenticacion/login      - Inicia sesión
POST   /api/autenticacion/registro   - Registra usuario
GET    /api/autenticacion/validar    - Valida token JWT
```

---

## ✨ Mejoras Futuras

- [ ] 2FA (Two-Factor Authentication)
- [ ] LDAP/SSO Integration
- [ ] Refresh tokens
- [ ] Auditoría detallada
- [ ] Permisos granulares por oficina
- [ ] Restricción de horario
- [ ] Bloqueo de cuenta tras N intentos fallidos
- [ ] Hash adicional para tokens

---

**Implementado:** 6 de Abril, 2026  
**Version:** 1.0.0  
**Status:** ✅ Listo en Producción
