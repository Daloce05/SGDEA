# 📋 Guía Completa - Módulo TRD (Tabla de Retención Documental)

## 📌 Tabla de Contenido

1. [Instalación](#instalación)
2. [Configuración](#configuración)
3. [Estructura Jerárquica](#estructura-jerárquica)
4. [Ejemplos de API](#ejemplos-de-api)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Búsqueda y Filtrado](#búsqueda-y-filtrado)
7. [Gestión de Archivos](#gestión-de-archivos)
8. [Políticas de Retención](#políticas-de-retención)
9. [Auditoría](#auditoría)
10. [Errores Comunes](#errores-comunes)

---

## 🔧 Instalación

### 1. Instalar Dependencias

```bash
npm install pg@^13.11.0
```

La dependencia ya está en `package.json`. Ejecuta:

```bash
npm install
```

### 2. Instalar PostgreSQL

**Windows:**
```bash
# Descargar desde https://www.postgresql.org/download/windows/
# O usar Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
```

### 3. Crear Base de Datos

```sql
CREATE DATABASE sgdea_trd;
```

### 4. Importar Schema

```bash
# Windows / macOS / Linux
psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
```

O conectar a PostgreSQL y ejecutar el contenido de `base_datos/trd/schema.sql` directamente:

```sql
-- Conectar a la base de datos
\c sgdea_trd

-- Ejecutar el contenido de schema.sql
```

### 5. Verificar Conexión

```bash
npm run dev
```

Debería ver en consola: `✓ Conexión a PostgreSQL exitosa`

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# PostgreSQL - Módulo TRD
PG_HOST=localhost
PG_PUERTO=5432
PG_USUARIO=postgres
PG_CONTRASEÑA=tu_contraseña
PG_BASE_DATOS=sgdea_trd
PG_POOL_MAXIMO=20
PG_TIMEOUT_INACTIVIDAD=30000
PG_TIMEOUT_CONEXION=2000
```

### Estructura de Carpetas

```
SGDEA/
├── config/
│   └── postgresqlTRD.js          # Configuración de conexión
├── src/
│   ├── modelos/trd/
│   │   ├── ModeloSerie.js
│   │   ├── ModeloSubserie.js
│   │   ├── ModeloTipoDocumental.js
│   │   └── ModeloArchivo.js
│   ├── controladores/trd/
│   │   ├── ControladorSerie.js
│   │   ├── ControladorSubserie.js
│   │   ├── ControladorTipoDocumental.js
│   │   └── ControladorArchivo.js
│   ├── middleware/trd/
│   │   └── validacionJerarquica.js
│   ├── rutas/trd/
│   │   └── rutasTRD.js
│   └── documentos/trd/            # Almacenamiento de PDFs
├── base_datos/trd/
│   └── schema.sql                 # Schema PostgreSQL
└── GUIA_TRD.md                    # Esta guía
```

---

## 📊 Estructura Jerárquica

La TRD sigue una estructura jerárquica de 4 niveles:

```
SERIE (Conjunto de documentos)
  └─ SUBSERIE (Subcategoría de documentos)
      └─ TIPO DOCUMENTAL (Clasificación específica)
          └─ ARCHIVO (Documento individual)
```

### Ejemplo de Jerarquía Real

```
1. SERIE: "Gestión Administrativa"
   ├─ 1.1 SUBSERIE: "Recursos Humanos"
   │   ├─ 1.1.1 TIPO: "Contratos"
   │   │   ├─ Archivo: "Contrato-JD-2024.pdf"
   │   │   ├─ Archivo: "Contrato-MH-2024.pdf"
   │   ├─ 1.1.2 TIPO: "Nóminas"
   │   │   ├─ Archivo: "Nomina-Enero-2024.pdf"
   │   ├─ 1.1.3 TIPO: "Evaluaciones"
   │   │   ├─ Archivo: "Evaluacion-JD-2024.pdf"
```

---

## 🔌 Ejemplos de API

### 1. SERIES (Nivel 1)

#### Obtener todas las series

```bash
curl -X GET http://localhost:3000/api/trd/series
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": [
    {
      "id_serie": 1,
      "codigo": "GA",
      "nombre": "Gestión Administrativa",
      "descripcion": "Documentos relacionados con la gestión administrativa",
      "años_retencion": 5,
      "activo": true,
      "creado_en": "2024-01-15T10:30:00Z",
      "actualizado_en": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Obtener una serie específica

```bash
curl -X GET http://localhost:3000/api/trd/series/1
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": {
    "id_serie": 1,
    "codigo": "GA",
    "nombre": "Gestión Administrativa",
    "descripcion": "Documentos relacionados con la gestión administrativa",
    "años_retencion": 5,
    "activo": true,
    "creado_en": "2024-01-15T10:30:00Z",
    "actualizado_en": "2024-01-15T10:30:00Z",
    "estadisticas": {
      "total_subseries": 3,
      "total_tipos": 8,
      "total_archivos": 45
    }
  }
}
```

#### Crear una nueva serie

```bash
curl -X POST http://localhost:3000/api/trd/series \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "FN",
    "nombre": "Finanzas",
    "descripcion": "Documentos financieros y contables",
    "años_retencion": 7
  }'
```

**Respuesta:**
```json
{
  "exito": true,
  "mensaje": "Serie creada exitosamente",
  "datos": {
    "id_serie": 5,
    "codigo": "FN",
    "nombre": "Finanzas",
    "descripcion": "Documentos financieros y contables",
    "años_retencion": 7
  }
}
```

#### Actualizar una serie

```bash
curl -X PUT http://localhost:3000/api/trd/series/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Gestión Administrativa y RH",
    "años_retencion": 6
  }'
```

#### Desactivar una serie

```bash
curl -X DELETE http://localhost:3000/api/trd/series/1
```

---

### 2. SUBSERIES (Nivel 2)

#### Obtener subseries de una serie

```bash
curl -X GET http://localhost:3000/api/trd/series/1/subseries
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": [
    {
      "id_subserie": 1,
      "id_serie": 1,
      "codigo": "GA-RH",
      "nombre": "Recursos Humanos",
      "descripcion": "Documentación de recursos humanos",
      "activa": true,
      "creada_en": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### Obtener una subserie específica

```bash
curl -X GET http://localhost:3000/api/trd/series/1/subseries/1
```

#### Crear subserie en una serie

```bash
curl -X POST http://localhost:3000/api/trd/series/1/subseries \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "GA-CT",
    "nombre": "Contabilidad",
    "descripcion": "Documentos contables y fiscales"
  }'
```

---

### 3. TIPOS DOCUMENTALES (Nivel 3)

#### Obtener tipos de una subserie

```bash
curl -X GET http://localhost:3000/api/trd/series/1/subseries/1/tipos
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": [
    {
      "id_tipo_documental": 1,
      "id_subserie": 1,
      "id_serie": null,
      "codigo": "CNTR",
      "nombre": "Contratos",
      "descripcion": "Contratos laborales de empleados",
      "activo": true,
      "creado_en": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### Crear tipo documental

```bash
curl -X POST http://localhost:3000/api/trd/series/1/subseries/1/tipos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "EV",
    "nombre": "Evaluaciones de Desempeño",
    "descripcion": "Evaluaciones anuales de personal",
    "idSubserie": 1
  }'
```

---

### 4. ARCHIVOS (Nivel 4)

#### Obtener archivos de un tipo

```bash
curl -X GET http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": [
    {
      "id_archivo": 1,
      "id_tipo_documental": 1,
      "nombre_archivo": "a1c3f5e7-1642254000000.pdf",
      "nombre_original": "Contrato-JD-2024.pdf",
      "ruta_almacenamiento": "/documentos/trd/a1c3f5e7-1642254000000.pdf",
      "tamano_bytes": 245600,
      "hash_md5": "5d41402abc4b2a76b9719d911017c592",
      "estado": "digital",
      "activo": true,
      "creado_en": "2024-01-15T14:00:00Z"
    }
  ]
}
```

#### Cargar un archivo PDF

```bash
curl -X POST http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos \
  -F "archivo=@Contrato-JD-2024.pdf"
```

**Respuesta:**
```json
{
  "exito": true,
  "mensaje": "Archivo cargado exitosamente",
  "datos": {
    "id_archivo": 1,
    "nombre_archivo": "a1c3f5e7-1642254000000.pdf",
    "nombre_original": "Contrato-JD-2024.pdf",
    "tamano_bytes": 245600,
    "hash_md5": "5d41402abc4b2a76b9719d911017c592"
  }
}
```

#### Descargar un archivo

```bash
curl http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1/descargar \
  -o Contrato-JD-2024.pdf
```

#### Obtener información de un archivo

```bash
curl -X GET http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1
```

#### Desactivar un archivo

```bash
curl -X DELETE http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1
```

---

## 🔄 Flujo de Trabajo

### Flujo Completo de Creación

```
1. Crear SERIE
   ↓
2. Crear SUBSERIE bajo esa SERIE
   ↓
3. Crear TIPO DOCUMENTAL bajo esa SUBSERIE
   ↓
4. Cargar ARCHIVOS bajo ese TIPO
```

### Ejemplo Paso a Paso

```bash
# Paso 1: Crear serie
SERIE=$(curl -s -X POST http://localhost:3000/api/trd/series \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "VT",
    "nombre": "Ventas",
    "descripcion": "Documentación de ventas",
    "años_retencion": 3
  }' | jq '.datos.id_serie')

echo "Serie creada: $SERIE"

# Paso 2: Crear subserie
SUBSERIE=$(curl -s -X POST http://localhost:3000/api/trd/series/$SERIE/subseries \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "VT-PD",
    "nombre": "Pedidos",
    "descripcion": "Documentos de pedidos de clientes"
  }' | jq '.datos.id_subserie')

echo "Subserie creada: $SUBSERIE"

# Paso 3: Crear tipo documental
TIPO=$(curl -s -X POST http://localhost:3000/api/trd/series/$SERIE/subseries/$SUBSERIE/tipos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "PEDIDO",
    "nombre": "Ordenes de Compra",
    "descripcion": "Ordenes de compra de clientes",
    "idSubserie": '$SUBSERIE'
  }' | jq '.datos.id_tipo_documental')

echo "Tipo creado: $TIPO"

# Paso 4: Cargar archivo
curl -X POST http://localhost:3000/api/trd/series/$SERIE/subseries/$SUBSERIE/tipos/$TIPO/archivos \
  -F "archivo=@OC-2024-001.pdf"
```

---

## 🔍 Búsqueda y Filtrado

### Buscar Archivos

```bash
# Buscar por nombre
curl -X GET "http://localhost:3000/api/trd/archivos/buscar?nombre=Contrato"

# Buscar por estado
curl -X GET "http://localhost:3000/api/trd/archivos/buscar?estado=digital"

# Buscar por rango de fechas
curl -X GET "http://localhost:3000/api/trd/archivos/buscar?fechaInicio=2024-01-01&fechaFin=2024-01-31"

# Combinar filtros
curl -X GET "http://localhost:3000/api/trd/archivos/buscar?nombre=Contrato&estado=digital&fechaInicio=2024-01-01"
```

### Obtener Estadísticas

```bash
# Estadísticas generales
curl -X GET http://localhost:3000/api/trd/archivos/estadisticas
```

**Respuesta:**
```json
{
  "exito": true,
  "datos": {
    "total_archivos": 125,
    "por_estado": {
      "digital": 100,
      "fisico": 15,
      "hibrido": 10
    },
    "tamano_total_mb": 1250.5,
    "tamano_promedio_mb": 10.0
  }
}
```

---

## 📁 Gestión de Archivos

### Tipos de Estado

```
- digital    : Almacenado solo en sistema digital
- fisico     : Almacenado solo en físico (oficina)
- hibrido    : Almacenado en ambos (digital + físico)
```

### Integridad de Archivos

Cada archivo se valida con:

- **MD5 Hash**: Para verificar integridad
- **UUID**: Para garantizar unicidad
- **Timestamp**: Para mantener historial
- **Validación PDF**: Solo se aceptan archivos PDF

### Recuperar Archivo Descargado y Verificar Integridad

```bash
# Descargar archivo
curl http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1/descargar \
  -o descargado.pdf

# Calcular hash del archivo descargado
md5sum descargado.pdf

# Comparar con hash en base de datos
curl -s http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1 \
  | jq '.datos.hash_md5'
```

---

## 📋 Políticas de Retención

### Tabla de Disposición Final

La retención de documentos se gestiona con una tabla de disposición final que especifica:

```sql
CREATE TABLE disposicion_final (
  id_disposicion INT PRIMARY KEY,
  tipo_disposicion ENUM('CT', 'E', 'M', 'S'),
  descripcion VARCHAR(255),
  ...
);
```

**Tipos de Disposición:**

```
CT - Conservación Total      : Mantener indefinidamente
E  - Eliminación             : Eliminar después del período de retención
M  - Microfilmación          : Convertir a microfilm y luego eliminar
S  - Selección               : Evaluar para posible conservación
```

### Ejemplo de Política

```json
{
  "id_serie": 1,
  "nombre": "Gestión Administrativa",
  "años_retencion": 5,
  "disposicion_final": "E",
  "descripcion": "Eliminar tras 5 años"
}
```

---

## 📊 Auditoría

### Tabla de Auditoría

Todas las acciones en el módulo TRD se registran en `auditoria_trd`:

```sql
SELECT * FROM auditoria_trd 
WHERE tabla_afectada = 'archivo' 
AND accion = 'INSERT'
ORDER BY fecha_accion DESC
LIMIT 10;
```

### Estructura de Auditoría

```json
{
  "id_auditoria": 1,
  "tabla_afectada": "archivo",
  "accion": "INSERT",
  "datos_anteriores": null,
  "datos_nuevos": {
    "id_archivo": 1,
    "nombre_original": "Contrato.pdf"
  },
  "usuario_id": 1,
  "fecha_accion": "2024-01-15T14:30:00Z"
}
```

---

## ⚠️ Errores Comunes

### 1. Error 404: Hierarquía Inválida

```json
{
  "error": "Subserie no encontrada o no pertenece a esta serie"
}
```

**Causa**: Intenta acceder a una subserie que no pertenece a la serie especificada

**Solución**: Verifica los IDs en la URL

```bash
# ❌ Incorrecto - subserie 2 no pertenece a serie 1
GET /api/trd/series/1/subseries/2

# ✅ Correcto
GET /api/trd/series/1/subseries/1
```

### 2. Error 400: Solo se aceptan PDFs

```json
{
  "error": "Solo se aceptan archivos PDF"
}
```

**Causa**: Intenta cargar un archivo que no es PDF

**Solución**: Convierte el archivo a PDF o usa un PDF válido

```bash
# ❌ Incorrecto
curl -F "archivo=@documento.docx" ...

# ✅ Correcto
curl -F "archivo=@documento.pdf" ...
```

### 3. Error 400: Archivo muy grande

```json
{
  "error": "Archivo muy grande"
}
```

**Causa**: El archivo excede el límite de 100MB

**Solución**: Divide el archivo en partes más pequeñas

### 4. Error 400: IDs inválidos

```json
{
  "error": "Los IDs deben ser números válidos"
}
```

**Causa**: Pasaste un ID no numérico

**Solución**: Asegúrate de pasar solo números en los IDs

```bash
# ❌ Incorrecto
GET /api/trd/series/uno/subseries

# ✅ Correcto
GET /api/trd/series/1/subseries
```

### 5. Error 409: Violación de Política de Retención

```json
{
  "error": "No se puede desactivar serie con subseries activas"
}
```

**Causa**: Intenta desactivar una serie que tiene subseries activas

**Solución**: Primero desactiva todas las subseries

```bash
# 1. Desactivar todas las subseries
curl -X DELETE /api/trd/series/1/subseries/1
curl -X DELETE /api/trd/series/1/subseries/2

# 2. Luego desactivar la serie
curl -X DELETE /api/trd/series/1
```

---

## 🚀 Próximos Pasos

1. **Integración Frontend**: Crear interfaz de usuario para gestión de TRD
2. **Reportes**: Generar reportes de retención y disposición
3. **Notificaciones**: Alertas cuando archivos están próximos a vencer
4. **APIs de terceros**: Integración con sistemas externos
5. **Backup Automático**: Respaldar archivos según política

---

## 📞 Soporte

Para problemas o preguntas:

1. Revisa los logs: `tail -f logs/app.log`
2. Verifica la conexión: Test PostgreSQL en `config/postgresqlTRD.js`
3. Ejecuta las migraciones: `base_datos/trd/schema.sql`

---

**Última actualización**: 2024-01-15  
**Version**: 1.0.0  
**Autor**: SGDEA Team
