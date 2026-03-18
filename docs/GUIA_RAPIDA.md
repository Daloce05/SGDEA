# Guía Rápida de Inicio - SGDEA Backend

## ⚡ Inicio en 5 minutos

### 1️⃣ Instalar dependencias

```bash
npm install
```

### 2️⃣ Preparar base de datos

```bash
# Crear base de datos en MySQL
mysql -u root -p
> CREATE DATABASE sgdea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> EXIT;

# Crear tablas
node base_datos/inicializar.js
```

### 3️⃣ Configurar variables de entorno

El archivo `.env` ya está listo.  
Si necesitas cambiar algo:

```bash
# Base de datos (si es diferente)
DB_HOST=localhost
DB_USUARIO=root
DB_CONTRASEÑA=
DB_NOMBRE=sgdea

# Token JWT (cambiar en producción)
JWT_SECRETO=tu_clave_secreta_cambiar_en_produccion_sgdea_2024
```

### 4️⃣ Iniciar servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

Servidor disponible en: **http://localhost:3000**

### 5️⃣ Probar la API

```bash
# Prueba básica
curl http://localhost:3000/api/prueba

# Registrar usuario
curl -X POST http://localhost:3000/api/autenticacion/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }'
```

## 📁 Estructura de carpetas explicada

```
SGDEA/
├── app.js                    ← Archivo principal del servidor
├── package.json              ← Dependencias y scripts
├── .env                      ← Configuración (NO compartir)
│
├── config/                   ← Configuraciones globales
│   ├── baseDatos.js         ← Conexión MySQL
│   └── logger.js            ← Sistema de logs
│
├── src/                      ← Código fuente principal
│   ├── controladores/       ← Lógica de negocio (C en MVC)
│   │   ├── ControladorAutenticacion.js
│   │   ├── ControladorUsuarios.js
│   │   └── ControladorDocumentos.js
│   │
│   ├── modelos/             ← Acceso a base de datos (M en MVC)
│   │   ├── ModeloUsuario.js
│   │   └── ModeloDocumento.js
│   │
│   ├── rutas/               ← Definición de endpoints (V en MVC)
│   │   ├── autenticacion.js
│   │   ├── usuarios.js
│   │   └── documentos.js
│   │
│   ├── middleware/          ← Middleware personalizado
│   │   ├── autenticacion.js ← Validación de tokens
│   │   └── validacion.js    ← Validación de datos
│   │
│   ├── utilidades/          ← Funciones auxiliares
│   │   └── utilidades.js
│   │
│   └── vistas/              ← Respuestas JSON
│
├── base_datos/
│   └── inicializar.js       ← Crear tablas
│
├── documentos/              ← Almacenamiento de archivos
├── logs/                    ← Archivos de log
└── README.md                ← Documentación completa
```

## 🔑 Endpoints principales

### Autenticación (sin token requerido)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/autenticacion/registro` | Registrar usuario |
| POST | `/api/autenticacion/login` | Iniciar sesión |
| GET | `/api/autenticacion/validar` | Validar token |

**Resultado:** Obtiene un token JWT

### Usuarios (requiere token)

| Método | Endpoint | Rol requerido |
|--------|----------|---------------|
| GET | `/api/usuarios/perfil` | Cualquiera |
| GET | `/api/usuarios` | Admin |
| GET | `/api/usuarios/:id` | Admin |
| PUT | `/api/usuarios/:id` | Admin |
| DELETE | `/api/usuarios/:id` | Admin |

### Documentos (requiere token)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/documentos` | Listar documentos |
| GET | `/api/documentos/buscar?termino=...` | Buscar |
| GET | `/api/documentos/:id` | Obtener uno |
| POST | `/api/documentos` | Cargar documento |
| PUT | `/api/documentos/:id` | Actualizar |
| GET | `/api/documentos/:id/descargar` | Descargar |
| DELETE | `/api/documentos/:id` | Eliminar |

## 🔐 Cómo usar autenticación

### 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/api/autenticacion/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }'
```

Respuesta:
```json
{
  "mensaje": "Usuario registrado correctamente",
  "usuario_id": 1
}
```

### 2. Iniciar sesión (obtener token)

```bash
curl -X POST http://localhost:3000/api/autenticacion/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }'
```

Respuesta:
```json
{
  "mensaje": "Sesión iniciada correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { ... }
}
```

### 3. Usar token en peticiones

```bash
curl -X GET http://localhost:3000/api/usuarios/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

⚠️ **Importante:** El header es `Authorization: Bearer <token>`

## 📝 Ejemplo completo: Cargar documento

```bash
# 1. Obtener token
TOKEN=$(curl -X POST http://localhost:3000/api/autenticacion/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "contraseña": "MiContraseña123!"
  }' | jq -r '.token')

# 2. Cargar documento
curl -X POST http://localhost:3000/api/documentos \
  -H "Authorization: Bearer $TOKEN" \
  -F "archivo=@documento.pdf" \
  -F "titulo=Mi Documento" \
  -F "tipo_documento=PDF"

# 3. Obtener documento
curl -X GET http://localhost:3000/api/documentos/1 \
  -H "Authorization: Bearer $TOKEN"

# 4. Descargar documento
curl -X GET http://localhost:3000/api/documentos/1/descargar \
  -H "Authorization: Bearer $TOKEN" \
  -o documento_descargado.pdf
```

## 🐛 Solución de problemas

### Error: "ECONNREFUSED" en base de datos
→ MySQL no está ejecutándose. Inicia MySQL:
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo service mysql start
```

### Error: "Database doesn't exist"
→ Crear la base de datos:
```bash
mysql -u root -p < base_datos/crear_base_datos.sql
```

### Error: "Token inválido"
→ El token ha expirado o es incorrecto. Vuelve a iniciar sesión.

### Error: "Permiso insuficiente"
→ Tu rol no es suficiente. Contacta con un administrador.

### El puerto 3000 está en uso
→ Cambiar puerto en `.env`:
```
PUERTO=3001
```

## 📚 Documentación completa

- **README.md** - Guía completa y características
- **DOCUMENTACION_TECNICA.js** - Detalles técnicos para desarrolladores
- **EJEMPLOS_API.md** - Ejemplos de peticiones
- **Código comentado** - Cada archivo tiene comentarios en español

## 🚀 Próximos pasos

1. ✅ Backend funcionando
2. 📱 **Por implementar:** Frontend en React/Vue
3. 🔌 Webhooks y notificaciones
4. 📊 Reportes y estadísticas
5. 🔍 OCR para documentos

## 💡 Tips importantes

- **Cambiar JWT_SECRETO en producción** (archivo .env)
- **No compartir .env** (agregar a .gitignore)
- **Crear índices** en campos frecuentes de búsqueda
- **Backups regulares** de la base de datos
- **Monitorear logs** en `/logs/`
- **Usar HTTPS** en producción (reverse proxy)

## 📞 Comandos útiles

```bash
# Ver variables de entorno cargadas
npm run dev

# Ver logs en tiempo real
tail -f logs/general.log

# Limpiar logs
rm logs/*.log

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Crear tabla en MySQL
node base_datos/inicializar.js

# Buscar errores en código
npm test
```

## 🎯 Flujo de desarrollo recomendado

1. Usar Postman/Thunder Client para probar endpoints
2. Crear tests unitarios para funciones críticas
3. Mantener logs limpios en producción
4. Documentar cambios en el código
5. Usar ramas en Git para desarrollo

---

**¡El backend SGDEA está listo para desarrollo! 🎉**

Más información en README.md y DOCUMENTACION_TECNICA.js
