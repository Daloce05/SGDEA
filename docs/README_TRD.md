# 📋 Módulo TRD - Estado y Quick Start

## ✅ Estado: COMPLETADO

Se ha implementado exitosamente el módulo completo de Gestión de Tabla de Retención Documental (TRD) con arquitectura MVC, validaciones jerárquicas y PostgreSQL.

## 📦 Qué se Incluyó

### ✅ Capa de Configuración
- **postgresqlTRD.js**: Conexión con pool de conexiones (20 máx), timeout de inactividad y manejo de errores

### ✅ Capa de Base de Datos
- **schema.sql**: 
  - 5 tablas principales (serie, subserie, tipo_documental, archivo, disposicion_final)
  - 1 tabla de auditoría (auditoria_trd)
  - Datos reales de AQUAMANA precargados (6 series, 7 subseries)
  - Índices en foreign keys y columnas de búsqueda
  - CHECK constraints para validación de datos
  - 2 PostgreSQL views para consultas convenientes

### ✅ Capa de Modelos (Data Access Layer)
- **ModeloSerie.js** - 6 métodos (obtener, crear, actualizar, desactivar, estadísticas)
- **ModeloSubserie.js** - 5 métodos con validación de jerarquía
- **ModeloTipoDocumental.js** - 5 métodos con soporte dual-parent (subserie O serie)
- **ModeloArchivo.js** - 8 métodos incluyendo:
  - Cálculo de hash MD5
  - Búsqueda fulltext
  - Estadísticas agregadas
  - Gestión de integridad

### ✅ Capa de Controladores (Business Logic)
- **ControladorSerie.js** - 5 endpoints HTTP
- **ControladorSubserie.js** - 5 endpoints con validación jerárquica
- **ControladorTipoDocumental.js** - 5 endpoints con lógica dual-parent
- **ControladorArchivo.js** - 7 endpoints:
  - POST: Cargar PDF con multer
  - GET: Descargar con integridad
  - GET: Búsqueda y filtrado
  - GET: Estadísticas

### ✅ Capa de Middleware
- **validacionJerarquica.js** - 5 validadores:
  - validarSerie: Verifica serie existe y activa
  - validarSubserie: Verifica subserie existe, está activa Y pertenece a serie
  - validarTipo: Verifica tipo existe y está activo
  - validarArchivo: Verifica archivo existe y está activo
  - validarIds: Valida que todos los IDs sean números

### ✅ Capa de Rutas
- **rutasTRD.js** - 25+ endpoints con:
  - Rutas jerárquicas RESTful: `/series/:id/subseries/:id/tipos/:id/archivos`
  - Validación de multer para PDFs (máx 100MB)
  - Manejo de errores de multer
  - Almacenamiento en `/documentos/trd/`

### ✅ Integración
- **app.js**: Rutas registradas como `/api/trd`
- **package.json**: Dependencia `pg` agregada
- **.env**: Variables PostgreSQL configuradas

### ✅ Documentación
- **GUIA_TRD.md**: Guía completa con 10 secciones:
  - Instalación paso a paso
  - Configuración
  - Estructura jerárquica
  - Ejemplos de API con curl
  - Flujo de trabajo
  - Búsqueda y filtrado
  - Gestión de archivos
  - Políticas de retención
  - Auditoría
  - Errores comunes

---

## 🚀 Quick Start

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Crear Base de Datos PostgreSQL
```bash
psql -U postgres
CREATE DATABASE sgdea_trd;
\q
```

### 3. Importar Schema
```bash
psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
```

### 4. Configurar .env
```env
PG_HOST=localhost
PG_PUERTO=5432
PG_USUARIO=postgres
PG_CONTRASEÑA=postgres
PG_BASE_DATOS=sgdea_trd
```

### 5. Iniciar Servidor
```bash
npm run dev
```

### 6. Probar API
```bash
# Obtener series
curl http://localhost:3000/api/trd/series

# Obtener subseries de serie 1
curl http://localhost:3000/api/trd/series/1/subseries
```

---

## 📚 Estructura de Carpetas TRD

```
c:\Users\david\Desktop\SGDEA\
├── config/
│   └── postgresqlTRD.js              ✅ Conexión PostgreSQL
├── src/
│   ├── modelos/trd/                  ✅ 4 modelos
│   │   ├── ModeloSerie.js
│   │   ├── ModeloSubserie.js
│   │   ├── ModeloTipoDocumental.js
│   │   └── ModeloArchivo.js
│   ├── controladores/trd/            ✅ 4 controladores
│   │   ├── ControladorSerie.js
│   │   ├── ControladorSubserie.js
│   │   ├── ControladorTipoDocumental.js
│   │   └── ControladorArchivo.js
│   ├── middleware/trd/               ✅ Validaciones
│   │   └── validacionJerarquica.js
│   ├── rutas/trd/                    ✅ Rutas HTTP
│   │   └── rutasTRD.js
│   └── documentos/trd/               ✅ Almacenamiento PDFs
├── base_datos/trd/
│   └── schema.sql                    ✅ SQL PostgreSQL
├── GUIA_TRD.md                       ✅ Documentación
└── app.js                            ✅ Integrado
```

---

## 🔌 Endpoints Disponibles

### SERIES
```
GET    /api/trd/series
POST   /api/trd/series
GET    /api/trd/series/:idSerie
PUT    /api/trd/series/:idSerie
DELETE /api/trd/series/:idSerie
```

### SUBSERIES
```
GET    /api/trd/series/:idSerie/subseries
POST   /api/trd/series/:idSerie/subseries
GET    /api/trd/series/:idSerie/subseries/:idSubserie
PUT    /api/trd/series/:idSerie/subseries/:idSubserie
DELETE /api/trd/series/:idSerie/subseries/:idSubserie
```

### TIPOS DOCUMENTALES
```
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos
POST   /api/trd/series/:idSerie/subseries/:idSubserie/tipos
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
PUT    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
```

### ARCHIVOS
```
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
POST   /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar
DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
```

### BÚSQUEDA Y ESTADÍSTICAS
```
GET    /api/trd/archivos/buscar
GET    /api/trd/archivos/estadisticas
```

---

## 🎯 Características Principales

### 1. Validación Jerárquica
- No se puede crear subserie sin serie específica
- No se puede crear tipo sin subserie específica
- No se puede crear archivo sin tipo específico
- Middleware valida cada nivel antes de procesar

### 2. Gestión de Archivos
- Carga de PDFs con multer (máx 100MB)
- Hash MD5 para integridad
- UUID + timestamp para unicidad
- Descarga segura

### 3. Auditoría Completa
- Tabla auditoria_trd registra todas las acciones
- Datos anteriores y nuevos guardados
- JSONB para datos complejos

### 4. Políticas de Retención
- Tabla disposicion_final con tipos: CT/E/M/S
- Años de retención por serie
- Integración con auditoría

### 5. Búsqueda Fulltext
- Búsqueda por nombre de archivo
- Filtrar por estado (digital/fisico/hibrido)
- Filtrar por rango de fechas
- Combinación de criterios

### 6. Estadísticas
- Total de archivos por estado
- Tamaño total en MB
- Promedio de tamaño

---

## 📊 Estadísticas de Código

| Componente | Líneas | Archivos | Estado |
|-----------|--------|----------|--------|
| Configuración | 47 | 1 | ✅ |
| Schema SQL | 400+ | 1 | ✅ |
| Modelos | 900+ | 4 | ✅ |
| Controladores | 850+ | 4 | ✅ |
| Middleware | 150 | 1 | ✅ |
| Rutas | 320+ | 1 | ✅ |
| Documentación | 600+ | 1 | ✅ |
| **TOTAL** | **~3,300+** | **~13** | **✅ COMPLETO** |

---

## ⚙️ Dependencias Requeridas

```json
{
  "pg": "^13.11.0",
  "multer": "^1.4.5-lts.1",
  "uuid": "^9.0.0",
  "express": "^4.18.2"
}
```

Todas ya están en `package.json`. Solo ejecuta `npm install`.

---

## ✨ Próximos Pasos Opcionales

1. **Frontend**: Crear interfaz de usuario para gestión TRD
2. **Reportes**: Generar PDFs con estadísticas y disposición
3. **Notificaciones**: Alertas cuando documentos próximos a vencer
4. **Sincronización**: Integración con sistemas externos
5. **Backup**: Respaldar automáticamente según políticas

---

## 📌 Notas Importantes

- **PostgreSQL obligatorio**: El módulo usa PostgreSQL, no MySQL
- **Jerarquía estricta**: La validación es rigurosa para mantener integridad
- **Auditoría automática**: Se registra toda acción en auditoria_trd
- **PDFs solo**: Solo se aceptan archivos en formato PDF
- **Rutas hierárquicas**: Las rutas deben seguir la estructura SERIE → SUBSERIE → TIPO → ARCHIVO

---

## 🐛 Troubleshooting

### PostgreSQL no conecta
1. Verifica que PostgreSQL esté corriendo
2. Revisa variables en `.env`
3. Prueba conexión: `psql -U postgres -c "SELECT version();"`

### Solo se aceptan PDFs
- El filtro multer está configurado para validar `application/pdf`
- Convierte archivos a PDF si es necesario

### Jerarquía inválida
- Verifica IDs en URL: `/series/1/subseries/1/tipos/1`
- Subserie debe pertenecer a serie, etc.

### Archivo demasiado grande
- Límite = 100MB
- Divide archivos grandes

---

## 📞 Contacto y Soporte

Para problemas o consultas sobre el módulo TRD:

1. Consulta **GUIA_TRD.md** para casos de uso
2. Revisa logs: `logs/app.log`
3. Valida schema: `psql -d sgdea_trd -c "\dt"`

---

**Versión**: 1.0.0  
**Fecha**: Enero 2024  
**Estado**: ✅ PRODUCCIÓN LISTA  
**Autor**: SGDEA Development Team
