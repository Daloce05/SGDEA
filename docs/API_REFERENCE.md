# 🔌 API Reference - TRD Module

Quick reference para todos los endpoints de la API TRD.

---

## SERIES

### GET /api/trd/series
Obtiene todas las series activas.

**Parámetros**: Ninguno  
**Respuesta**:
```json
{
  "exito": true,
  "datos": [
    {
      "id_serie": 1,
      "codigo": "GA",
      "nombre": "Gestión Administrativa",
      "años_retencion": 5,
      "activo": true
    }
  ]
}
```

---

### POST /api/trd/series
Crea una nueva serie.

**Parámetros (Body JSON)**:
```json
{
  "codigo": "FN",
  "nombre": "Finanzas",
  "descripcion": "Documentos financieros",
  "años_retencion": 7
}
```

**Respuesta**:
```json
{
  "exito": true,
  "mensaje": "Serie creada exitosamente",
  "datos": {
    "id_serie": 5,
    "codigo": "FN"
  }
}
```

---

### GET /api/trd/series/:idSerie
Obtiene una serie con sus estadísticas.

**Parámetros Path**:
- `idSerie` (number): ID de la serie

**Respuesta**:
```json
{
  "exito": true,
  "datos": {
    "id_serie": 1,
    "codigo": "GA",
    "nombre": "Gestión Administrativa",
    "años_retencion": 5,
    "estadisticas": {
      "total_subseries": 3,
      "total_tipos": 8,
      "total_archivos": 45
    }
  }
}
```

---

### PUT /api/trd/series/:idSerie
Actualiza una serie.

**Parámetros Path**:
- `idSerie` (number): ID de la serie

**Parámetros (Body JSON)**:
```json
{
  "nombre": "Gestión Administrativa Actualizada",
  "años_retencion": 6
}
```

---

### DELETE /api/trd/series/:idSerie
Desactiva una serie.

**Parámetros Path**:
- `idSerie` (number): ID de la serie

---

## SUBSERIES

### GET /api/trd/series/:idSerie/subseries
Obtiene subseries de una serie.

**Parámetros Path**:
- `idSerie` (number): ID de la serie

---

### POST /api/trd/series/:idSerie/subseries
Crea subserie bajo una serie.

**Parámetros Path**:
- `idSerie` (number): ID madre serie

**Parámetros (Body JSON)**:
```json
{
  "codigo": "GA-RH",
  "nombre": "Recursos Humanos",
  "descripcion": "Documentación de RRHH"
}
```

---

### GET /api/trd/series/:idSerie/subseries/:idSubserie
Obtiene una subserie específica.

**Parámetros Path**:
- `idSerie` (number): ID serie padre
- `idSubserie` (number): ID subserie

---

### PUT /api/trd/series/:idSerie/subseries/:idSubserie
Actualiza una subserie.

**Parámetros Path**:
- `idSerie` (number): ID serie padre
- `idSubserie` (number): ID subserie

**Parámetros (Body JSON)**:
```json
{
  "nombre": "Recursos Humanos Actualizado"
}
```

---

### DELETE /api/trd/series/:idSerie/subseries/:idSubserie
Desactiva una subserie.

**Parámetros Path**:
- `idSerie` (number): ID serie padre
- `idSubserie` (number): ID subserie

---

## TIPOS DOCUMENTALES

### GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos
Obtiene tipos de una subserie.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie

---

### POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos
Crea tipo documental.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie

**Parámetros (Body JSON)**:
```json
{
  "codigo": "CNTR",
  "nombre": "Contratos",
  "descripcion": "Contratos laborales",
  "idSubserie": 1
}
```

O crear bajo serie directamente:
```json
{
  "codigo": "PROY",
  "nombre": "Proyectos",
  "descripcion": "Documentos de proyectos",
  "idSerie": 1
}
```

---

### GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
Obtiene un tipo específico.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo

---

### PUT /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
Actualiza un tipo.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo

---

### DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
Desactiva un tipo.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo

---

## ARCHIVOS

### GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
Lista archivos de un tipo.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo

**Respuesta**:
```json
{
  "exito": true,
  "datos": [
    {
      "id_archivo": 1,
      "nombre_original": "Contrato.pdf",
      "tamano_bytes": 245600,
      "estado": "digital",
      "creado_en": "2024-01-15T14:00:00Z"
    }
  ]
}
```

---

### POST /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos
Carga archivo PDF.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo

**Parámetros (Form Data)**:
- `archivo` (file): Archivo PDF (máx 100MB)

**Ejemplo curl**:
```bash
curl -X POST http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos \
  -F "archivo=@documento.pdf"
```

---

### GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
Obtiene información de archivo.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo
- `idArchivo` (number): ID archivo

**Respuesta**:
```json
{
  "exito": true,
  "datos": {
    "id_archivo": 1,
    "nombre_archivo": "uuid-timestamp.pdf",
    "nombre_original": "Contrato.pdf",
    "tamano_bytes": 245600,
    "hash_md5": "5d41402abc4b2a76b9719d911017c592",
    "estado": "digital",
    "creado_en": "2024-01-15T14:00:00Z"
  }
}
```

---

### GET /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo/descargar
Descarga archivo PDF.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo
- `idArchivo` (number): ID archivo

**Respuesta**: Stream del archivo PDF

**Ejemplo curl**:
```bash
curl http://localhost:3000/api/trd/series/1/subseries/1/tipos/1/archivos/1/descargar \
  -o documento-descargado.pdf
```

---

### DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo/archivos/:idArchivo
Desactiva archivo.

**Parámetros Path**:
- `idSerie` (number): ID serie
- `idSubserie` (number): ID subserie
- `idTipo` (number): ID tipo
- `idArchivo` (number): ID archivo

---

## BÚSQUEDA

### GET /api/trd/archivos/buscar
Busca archivos con criterios.

**Parámetros Query (todos opcionales)**:
- `nombre` (string): Busca en nombre de archivo
- `estado` (string): Filtra por estado (digital|fisico|hibrido)
- `fechaInicio` (string): Formato YYYY-MM-DD
- `fechaFin` (string): Formato YYYY-MM-DD

**Ejemplos**:
```bash
# Buscar por nombre
curl "http://localhost:3000/api/trd/archivos/buscar?nombre=Contrato"

# Filtrar por estado
curl "http://localhost:3000/api/trd/archivos/buscar?estado=digital"

# Rango de fechas
curl "http://localhost:3000/api/trd/archivos/buscar?fechaInicio=2024-01-01&fechaFin=2024-01-31"

# Combinar
curl "http://localhost:3000/api/trd/archivos/buscar?nombre=Contrato&estado=digital"
```

---

## ESTADÍSTICAS

### GET /api/trd/archivos/estadisticas
Obtiene estadísticas del módulo.

**Parámetros**: Ninguno

**Respuesta**:
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

## Respuestas de Error

### 400 - Solicitud inválida
```json
{
  "error": "Campos requeridos: codigo, nombre"
}
```

### 404 - No encontrado
```json
{
  "error": "Serie no encontrada"
}
```

### 409 - Conflicto
```json
{
  "error": "No se puede desactivar serie con subseries activas"
}
```

### 500 - Error servidor
```json
{
  "error": "Error al procesar solicitud"
}
```

---

## Códigos de Estado HTTP

| Status | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK | GET exitoso |
| 201 | Created | POST exitoso |
| 204 | No Content | DELETE exitoso |
| 400 | Bad Request | Datos inválidos |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Violación lógica |
| 500 | Server Error | Error servidor |

---

## Headers Comunes

### Request
```
Content-Type: application/json
Accept: application/json
```

### Response
```
Content-Type: application/json
Date: Mon, 15 Jan 2024 14:30:00 GMT
```

---

## Límites

| Límite | Valor |
|--------|-------|
| Tamaño máximo archivo | 100 MB |
| Resultados paginados | 50 máx |
| Timeout conexión | 2 segundos |
| Pool conexiones | 20 máx |

---

## Validaciones de Entrada

### Códigos
- Mínimo: 2 caracteres
- Máximo: 50 caracteres
- Patrón: Alfanuméricos + guiones

### Nombres
- Mínimo: 3 caracteres
- Máximo: 255 caracteres

### Años de Retención
- Mínimo: 1
- Máximo: 100

### Estados de Archivo
- `digital`: Almacenado en sistema
- `fisico`: Almacenado en oficina
- `hibrido`: En ambos

---

## Patrón de Respuesta

Todas las respuestas siguen este patrón (excepto descargas):

```json
{
  "exito": true/false,
  "mensaje": "Descripción opcional",
  "datos": {} | [],
  "error": "En caso de error"
}
```

---

## Flujo Jerárquico

Para acceder a archivos, debe seguir esta ruta:
```
Serie → Subserie → Tipo Documental → Archivo
  1    →    1     →       1         →   N
```

Todos los IDs deben ser válidos en su nivel correspondiente.

---

**Última actualización**: Enero 2024  
**Versión API**: 1.0.0  
**Base URL**: `http://localhost:3000/api/trd`
