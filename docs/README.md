# Sistema de Gestión Documental Empresarial Avanzado (SGDEA) - Backend

Backend robusto para el SGDEA desarrollado con Node.js, Express y MySQL. Implementa arquitectura MVC con buenas prácticas de ingeniería de software.

## 📋 Características

- ✅ Autenticación y autorización con JWT
- ✅ Gestión de usuarios con roles (admin, gerente, usuario)
- ✅ Almacenamiento y gestión de documentos
- ✅ Búsqueda de documentos con índices de texto completo
- ✅ Carga y descarga de archivos
- ✅ Validación de datos robusta
- ✅ Logging detallado de eventos
- ✅ Middleware de seguridad (CORS, Helmet)
- ✅ Paginación de resultados
- ✅ Compartición de documentos entre usuarios
- ✅ Historial de acceso y auditoría

## 🏗️ Arquitectura

```
SGDEA/
├── app.js                      # Archivo principal
├── config/
│   ├── baseDatos.js           # Configuración de MySQL
│   └── logger.js              # Sistema de logging
├── src/
│   ├── controladores/         # Lógica de negocio (C en MVC)
│   │   ├── ControladorAutenticacion.js
│   │   ├── ControladorUsuarios.js
│   │   └── ControladorDocumentos.js
│   ├── modelos/               # Acceso a base de datos (M en MVC)
│   │   ├── ModeloUsuario.js
│   │   └── ModeloDocumento.js
│   ├── rutas/                 # Definición de endpoints (V en MVC)
│   │   ├── autenticacion.js
│   │   ├── usuarios.js
│   │   └── documentos.js
│   ├── middleware/            # Middleware personalizado
│   │   ├── autenticacion.js
│   │   └── validacion.js
│   ├── utilidades/            # Funciones auxiliares
│   │   └── utilidades.js
│   └── vistas/                # Respuestas JSON (V en MVC)
├── base_datos/
│   └── inicializar.js        # Script de creación de tablas
├── logs/                      # Archivos de log
├── documentos/                # Almacenamiento de archivos
├── package.json
└── .env                       # Variables de entorno
```

## 🚀 Instalación

### Requisitos previos

- Node.js 16+ instalado
- MySQL 8.0+ instalado y ejecutándose
- npm o yarn

### Pasos de instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copiar `.env.example` a `.env`
   - Actualizar valores según tu configuración

4. **Crear base de datos MySQL**
   ```sql
   CREATE DATABASE sgdea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Inicializar tablas**
   ```bash
   node base_datos/inicializar.js
   ```

6. **Iniciar servidor**
   ```bash
   # Modo desarrollo (con auto-reload)
   npm run dev

   # Modo producción
   npm start
   ```

El servidor estará disponible en `http://localhost:3000`

## 🔐 Autenticación

### Registro de usuario

```bash
POST /api/autenticacion/registro
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "contraseña": "MiContraseña123!"
}
```

### Iniciar sesión

```bash
POST /api/autenticacion/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "contraseña": "MiContraseña123!"
}

Respuesta:
{
  "mensaje": "Sesión iniciada correctamente",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@example.com",
    "rol": "usuario"
  }
}
```

### Usar token en peticiones

Incluir en el header `Authorization`:
```
Authorization: Bearer <token>
```

## 📚 Endpoints principales

### Autenticación
- `POST /api/autenticacion/registro` - Registrar usuario
- `POST /api/autenticacion/login` - Iniciar sesión
- `GET /api/autenticacion/validar` - Validar token

### Usuarios
- `GET /api/usuarios` - Obtener todos (admin)
- `GET /api/usuarios/perfil` - Obtener perfil propio
- `GET /api/usuarios/:id` - Obtener usuario específico (admin)
- `PUT /api/usuarios/:id` - Actualizar usuario (admin)
- `DELETE /api/usuarios/:id` - Desactivar usuario (admin)

### Documentos
- `GET /api/documentos` - Obtener todos
- `GET /api/documentos/buscar?termino=...` - Buscar documentos
- `GET /api/documentos/:id` - Obtener documento específico
- `POST /api/documentos` - Cargar documento nuevo
- `PUT /api/documentos/:id` - Actualizar documento
- `GET /api/documentos/:id/descargar` - Descargar documento
- `DELETE /api/documentos/:id` - Eliminar documento

## 🔒 Seguridad

- Contraseñas encriptadas con bcryptjs
- Tokens JWT con expiración configurable
- Validación de entrada en todas las rutas
- CORS configurado
- Headers de seguridad con Helmet
- Middleware de autenticación y autorización
- Roles basados en control de acceso (RBAC)

## 📊 Base de datos

### Tablas principales

1. **usuarios** - Información de usuarios del sistema
2. **documentos** - Documentos almacenados
3. **tipos_documentos** - Categorías de tipos de documento
4. **categorias_documentos** - Categorías asignadas a documentos
5. **documento_categoria** - Relaciones documento-categoría
6. **documentos_compartidos** - Documentos compartidos entre usuarios
7. **historial_acceso** - Registro de accesos a documentos
8. **auditoria** - Auditoría de cambios en el sistema

## 🛠️ Variables de entorno

```env
# Servidor
PUERTO=3000
AMBIENTE=desarrollo
ORIGEN_PERMITIDO=http://localhost:3001

# Base de datos
DB_HOST=localhost
DB_USUARIO=root
DB_CONTRASEÑA=tu_contraseña
DB_NOMBRE=sgdea
DB_PUERTO=3306

# Autenticación
JWT_SECRETO=tu_secreto_muy_seguro_aqui
EXPIRACION_TOKEN=24h

# Archivos
TAMAÑO_MAXIMO_ARCHIVO=50
RUTA_DOCUMENTOS=./documentos

# Logs
NIVEL_LOG=info
```

## 📝 Logs

Los logs se guardan en:
- `logs/general.log` - Todos los eventos
- `logs/error.log` - Solo errores

Formato: `TIMESTAMP [NIVEL]: MENSAJE`

## 🧪 Testing

```bash
# Ejecutar pruebas
npm test

# Con cobertura
npm test -- --coverage
```

## 📦 Dependencias principales

- **express** - Framework web
- **mysql2** - Driver MySQL con promesas
- **jsonwebtoken** - Autenticación JWT
- **bcryptjs** - Encriptación de contraseñas
- **express-validator** - Validación de datos
- **multer** - Carga de archivos
- **winston** - Sistema de logging
- **cors** - Cross-origin resource sharing
- **helmet** - Headers de seguridad
- **dotenv** - Variables de entorno

## 🔄 Flujo de desarrollo

1. **Modelos** - Definen estructura y acceso a base de datos
2. **Controladores** - Implementan lógica de negocio
3. **Middleware** - Validan y procesan peticiones
4. **Rutas** - Definen endpoints de la API
5. **Utilidades** - Funciones auxiliares reutilizables

## 📖 Buenas prácticas implementadas

- ✅ Código bien documentado en español
- ✅ Estructura MVC clara y separada
- ✅ Validación robuusta de datos
- ✅ Manejo de errores centralizado
- ✅ Logging detallado
- ✅ DRY (Don't Repeat Yourself)
- ✅ SOLID principles
- ✅ Seguridad en todas las capas
- ✅ Paginación de resultados grandes
- ✅ Índices de base de datos optimizados
- ✅ Variables de entorno para configuración
- ✅ Comentarios y docstrings en JSDoc

## 🐛 Troubleshooting

### Error de conexión a base de datos
- Verificar que MySQL está ejecutándose
- Verificar credenciales en `.env`
- Verificar que la base de datos existe

### Error de token inválido
- Verificar que el token es válido y no ha expirado
- Verificar que se envía en el header `Authorization: Bearer <token>`
- Verificar que `JWT_SECRETO` es idéntico en servidor

### Archivos no se cargan
- Verificar que la carpeta `documentos/` existe y tiene permisos
- Verificar el tipo MIME del archivo es permitido
- Verificar que el tamaño no excede el límite

## 📞 Licencia

MIT License

## ✨ Próximas mejoras

- [ ] API REST completa para categorías y tipos de documentos
- [ ] Sistema de compartición avanzado
- [ ] Versioning de documentos
- [ ] OCR para extracción de texto
- [ ] Búsqueda avanzada con filtros
- [ ] Reportes y estadísticas
- [ ] Integración con SSO/LDAP
- [ ] API GraphQL alternativa
- [ ] Compresión de archivos
- [ ] Sistema de permisos más granular
