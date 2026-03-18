# Guía de Integración - Modelo ER Actualizado

## 📋 Resumen de Cambios Implementados

Se han realizado **todas las correcciones** necesarias en el modelo relacional TRD:

### ✅ Cambios Completados

| Componente | Cambio | Estado |
|-----------|--------|--------|
| **Schema SQL** | Tabla OFICINA creada, FK id_oficina en SERIE | ✅ |
| **Schema SQL** | TIPO_DOCUMENTAL solo bajo SUBSERIE | ✅ |
| **Schema SQL** | Vistas actualizadas con joins correctos | ✅ |
| **ModeloOficina.js** | Nuevo modelo para gestión de oficinas | ✅ |
| **ModeloSerie.js** | Requiere id_oficina (FK obligatorio) | ✅ |
| **ModeloTipoDocumental.js** | Solo acepta id_subserie (NOT NULL) | ✅ |
| **ControladorOficina.js** | Nuevo controlador con 7 métodos | ✅ |
| **ControladorSerie.js** | Ahora acepta id_oficina en crear() | ✅ |
| **ControladorTipoDocumental.js** | Solo crea bajo SUBSERIE (no alternativa) | ✅ |
| **rutasOficina.js** | Nuevas rutas para gestión de oficinas | ✅ |
| **rutasTRD.js** | Integración de jerarquía OFICINA → SERIE | ✅ |

---

## 🏗️ Jerarquía Actualizada

```
OFICINA (Nuevo nivel 0)
├── id_oficina [PK]
├── codigo_oficina [UNIQUE]
└── nombre_oficina
    │
    ├─→ SERIE (Nivel 1) [FK: id_oficina]
    │   ├── id_serie [PK]
    │   ├── codigo [UNIQUE]
    │   └── nombre
    │       │
    │       ├─→ SUBSERIE (Nivel 2) [FK: id_serie]
    │       │   ├── id_subserie [PK]
    │       │   ├── codigo [UNIQUE]
    │       │   └── nombre
    │       │       │
    │       │       ├─→ TIPO_DOCUMENTAL (Nivel 3) [FK: id_subserie] ⚠️ SOLO AQUÍ
    │       │       │   ├── id_tipo [PK]
    │       │       │   └── nombre
    │       │       │       │
    │       │       │       ├─→ ARCHIVO (Nivel 4) [FK: id_tipo]
    │       │       │           ├── id_archivo [PK]
    │       │       │           ├── nombre_archivo
    │       │       │           └── estado (físico|digital|ambos)
    │       │       │
    │       │       └─→ DISPOSICION_FINAL [FK: id_serie] ⚠️ ÚNICO por SERIE
    │       │
    │       └─→ AUDITORIA_TRD
    │           ├── id_auditoria [PK]
    │           ├── usuario
    │           ├── accion (INSERT|UPDATE|DELETE)
    │           └── fecha_accion
```

---

## 🔌 Endpoints API Nuevos/Actualizados

### Gestión de Oficinas (NUEVO)

```
GET    /api/trd/oficinas                    # Listar todas
POST   /api/trd/oficinas                    # Crear
GET    /api/trd/oficinas/:idOficina         # Obtener
GET    /api/trd/oficinas/:idOficina/jerarquia  # Árbol completo
PUT    /api/trd/oficinas/:idOficina         # Actualizar
DELETE /api/trd/oficinas/:idOficina         # Desactivar
```

### Gestión de Series (ACTUALIZADO)

```
GET    /api/trd/series                      # Listar todas (heredado)
GET    /api/trd/oficinas/:idOficina/series  # Nuevas series por oficina
POST   /api/trd/oficinas/:idOficina/series  # Crear serie (REQUIERE id_oficina)
GET    /api/trd/series/:idSerie             # Obtener (heredado)
PUT    /api/trd/series/:idSerie             # Actualizar
DELETE /api/trd/series/:idSerie             # Desactivar
```

### Gestión de Tipos Documentales (ACTUALIZADO)

```
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos
POST   /api/trd/series/:idSerie/subseries/:idSubserie/tipos  # SOLO SUBSERIE
GET    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
PUT    /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
DELETE /api/trd/series/:idSerie/subseries/:idSubserie/tipos/:idTipo
```

---

## 📝 Ejemplos de Uso

### 1. Crear una Oficina

```bash
POST /api/trd/oficinas
Content-Type: application/json

{
  "codigo_oficina": "144",
  "nombre_oficina": "Dirección de Archivo",
  "dependencia": "Entidad Principal"
}

# Respuesta:
{
  "exito": true,
  "datos": {
    "id_oficina": 1,
    "codigo_oficina": "144",
    "nombre_oficina": "Dirección de Archivo"
  }
}
```

### 2. Crear una Serie bajo Oficina ⚠️ CAMBIO IMPORTANTE

```bash
POST /api/trd/oficinas/1/series
Content-Type: application/json

{
  "codigo": "144.01",
  "nombre": "ACTAS",
  "tiempo_gestion": 5,
  "tiempo_central": 0,
  "descripcion": "Documentos de actas y supervisión"
}

# Respuesta:
{
  "exito": true,
  "datos": {
    "id_serie": 1,
    "codigo": "144.01",
    "nombre": "ACTAS"
  }
}
```

### 3. Crear Tipo Documental (SOLO bajo SUBSERIE)

```bash
POST /api/trd/series/1/subseries/1/tipos
Content-Type: application/json

{
  "nombre": "Actas de Supervisión",
  "descripcion": "Actas generadas en supervisión"
}

# Respuesta:
{
  "exito": true,
  "datos": {
    "id_tipo": 1,
    "nombre": "Actas de Supervisión"
  }
}
```

### 4. Obtener Jerarquía Completa

```bash
GET /api/trd/oficinas/1/jerarquia

# Respuesta (JSON anidado):
{
  "exito": true,
  "datos": {
    "id_oficina": 1,
    "codigo_oficina": "144",
    "nombre_oficina": "Dirección de Archivo",
    "series": [
      {
        "id_serie": 1,
        "codigo": "144.01",
        "nombre": "ACTAS",
        "subseries": [
          {
            "id_subserie": 1,
            "codigo": "144.01,16",
            "nombre": "Actas de Supervisión"
          }
        ]
      }
    ]
  }
}
```

---

## ⚠️ Cambios Críticos para Desarrolladores

### 1. **Crear Series REQUIERE id_oficina**

**ANTES (❌ Ya no funciona)**:
```javascript
await ModeloSerie.crear({
  codigo: '144.01',
  nombre: 'ACTAS'
  // ... sin id_oficina
});
```

**AHORA (✅ REQUERIDO)**:
```javascript
await ModeloSerie.crear(1, {  // id_oficina = 1
  codigo: '144.01',
  nombre: 'ACTAS'
});
```

### 2. **Crear Tipos Documentales SOLO bajo SUBSERIE**

**ANTES (❌ Ambiguo)**:
```javascript
await ModeloTipoDocumental.crear(
  null,      // id_subserie
  1,         // id_serie (alternativa)
  { nombre: 'Tipo' }
);
```

**AHORA (✅ Único camino)**:
```javascript
await ModeloTipoDocumental.crear(
  1,         // id_subserie (OBLIGATORIO)
  { nombre: 'Tipo' }
);
```

### 3. **Validación Implementada**

- ✅ FK OFICINA-SERIE: No se puede crear serie sin oficina existente
- ✅ FK SERIE-SUBSERIE: No se puede crear subserie sin serie existente
- ✅ FK SUBSERIE-TIPO: No se puede crear tipo sin subserie existente
- ✅ FK TIPO-ARCHIVO: No se puede crear archivo sin tipo existente
- ✅ ON DELETE RESTRICT: Previene eliminación de padres con hijos activos

---

## 🔄 Migración desde Versión Anterior

Si tienes código antiguo usando:

```javascript
// ANTIGUO
router.post('/series', crear);  // Sin id_oficina
```

**Actualizar a:**

```javascript
// NUEVO
router.post('/oficinas/:idOficina/series', crear);  // CON id_oficina
```

---

## 📊 Cambios en BD

Si usas BD existente, ejecutar:

```sql
-- Backup primero
CREATE TABLE oficina_backup AS SELECT * FROM serie;

-- Luego ejecutar schema.sql completo
psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
```

---

## ✨ Beneficios del Nuevo Modelo

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| Integridad referencial | ⚠️ Incompleta | ✅ Garantizada |
| Multi-oficina | ❌ No explícito | ✅ Nativo |
| Jerarquía clara | ⚠️ Ambigua | ✅ Unívoca |
| Validación FK | ⚠️ Parcial | ✅ Completa |
| ON DELETE | ⚠️ Parcial | ✅ Todos niveles |
| Queries eficientes | ⚠️ JOINs incorrectos | ✅ Optimizadas |

---

## 🐛 Validación de Errores Comunes

### Error: "Oficina ... no existe"
```javascript
// Solución: Crear oficina primero
const idOficina = await ModeloOficina.crear({
  codigo_oficina: '144',
  nombre_oficina: 'Dirección de Archivo'
});
```

### Error: "Subserie y nombre son obligatorios"
```javascript
// Verificar que idSubserie está en params, no null
router.post(
  '/series/:idSerie/subseries/:idSubserie/tipos',
  ControladorTipoDocumental.crear  // ✅ Correcto
);
```

### Error: "No se puede desactivar una oficina con series activas"
```javascript
// Desactivar series primero
await ModeloSerie.desactivar(idSerie);
// Luego desactivar oficina
await ModeloOficina.desactivar(idOficina);
```

---

## 📞 Soporte

Revisar:
- [CORRECCIONES_MODELO_ER.md](CORRECCIONES_MODELO_ER.md) - Detalles técnicos
- [DIAGRAMA_ER_ACTUALIZADO.md](DIAGRAMA_ER_ACTUALIZADO.md) - Visualización
- [base_datos/trd/schema.sql](base_datos/trd/schema.sql) - SQL completo
