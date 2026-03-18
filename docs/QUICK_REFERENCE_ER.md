# ⚡ QUICK REFERENCE - Cambios Implementados

## 📦 Nuevos Archivos (3)

```
✨ src/modelos/trd/ModeloOficina.js          (280 líneas)
✨ src/controladores/trd/ControladorOficina.js (240 líneas)
✨ src/rutas/trd/rutasOficina.js             (90 líneas)
```

## 🔄 Archivos Modificados (5)

```
📝 base_datos/trd/schema.sql                 (tabla OFICINA + correcciones)
📝 src/modelos/trd/ModeloSerie.js            (requiere id_oficina)
📝 src/modelos/trd/ModeloTipoDocumental.js   (solo id_subserie)
📝 src/controladores/trd/ControladorSerie.js (idOficina en params)
📝 src/controladores/trd/ControladorTipoDocumental.js (simplificado)
📝 src/rutas/trd/rutasTRD.js                 (nivel OFICINA agregado)
```

## 📄 Documentación (4)

```
📚 CORRECCIONES_MODELO_ER.md        (resumen técnico)
📚 DIAGRAMA_ER_ACTUALIZADO.md       (visualización)
📚 GUIA_INTEGRACION_ER.md           (guía completa + ejemplos)
📚 RESUMEN_CAMBIOS_ER.md            (este documento)
```

---

## 🚀 Cambios Críticos

### 1️⃣ Crear Serie (CAMBIO IMPORTANTE)

**Antes:**
```javascript
POST /api/trd/series
Body: { codigo, nombre, ... }
```

**Ahora:**
```javascript
POST /api/trd/oficinas/:idOficina/series
Body: { codigo, nombre, ... }
// REQUIERE id_oficina en URL
```

### 2️⃣ Crear Tipo Documental (SIMPLIFICADO)

**Antes:**
```javascript
// Ambiguo - podía ser bajo SERIE o SUBSERIE
ModeloTipoDocumental.crear(idSubserie, idSerie, datos)
```

**Ahora:**
```javascript
// Claro - siempre bajo SUBSERIE
ModeloTipoDocumental.crear(idSubserie, datos)
```

### 3️⃣ BD - Nuevas Constraints

```sql
-- SERIE ahora REQUIERE OFICINA
ALTER TABLE serie ADD CONSTRAINT fk_officiante
  FOREIGN KEY (id_oficina) REFERENCES oficina(id_oficina);

-- TIPO_DOCUMENTAL solo bajo SUBSERIE (NOT NULL)
ALTER TABLE tipo_documental 
  MODIFY id_subserie INTEGER NOT NULL;
  
-- Removido id_serie de tipo_documental
ALTER TABLE tipo_documental DROP COLUMN id_serie;
```

---

## 🔍 Validación Rápida

### Checklista de Integración

```
☐ Ejecutar: psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
☐ Verificar tabla OFICINA existe: SELECT * FROM oficina;
☐ Verificar SERIE.id_oficina existe: \d serie
☐ Verificar vistas actualizadas: SELECT * FROM vista_jerarquia;
☐ node app.js (iniciar servidor)
☐ GET http://localhost:3000/api/trd/oficinas (debe retornar datos)
☐ Revisar logs: tail -f logs/error.log
```

---

## 📊 Endpoints Rápidos

### Oficinas
```
GET    /api/trd/oficinas
POST   /api/trd/oficinas
GET    /api/trd/oficinas/:id
PUT    /api/trd/oficinas/:id
DELETE /api/trd/oficinas/:id
GET    /api/trd/oficinas/:id/jerarquia
```

### Series (NUEVA RUTA)
```
GET    /api/trd/oficinas/:idOficina/series
POST   /api/trd/oficinas/:idOficina/series  ⚠️ CAMBIO
```

### Tipos (SOLO SUBSERIE)
```
POST   /api/trd/series/:id/subseries/:id/tipos  ⚠️ SOLO CAMINO
```

---

## 🧪 Test Rápido

```bash
# 1. Crear Oficina
curl -X POST http://localhost:3000/api/trd/oficinas \
  -H "Content-Type: application/json" \
  -d '{"codigo_oficina":"144","nombre_oficina":"Archivo"}'

# 2. Crear Serie (NOTA: idOficina en URL)
curl -X POST http://localhost:3000/api/trd/oficinas/1/series \
  -H "Content-Type: application/json" \
  -d '{"codigo":"144.01","nombre":"ACTAS"}'

# 3. Ver Jerarquía
curl http://localhost:3000/api/trd/oficinas/1/jerarquia
```

---

## ⚠️ Errores Comunes

| Error | Solución |
|-------|----------|
| `Oficina ... no existe` | Crear oficina primero: POST /api/trd/oficinas |
| `Subserie y nombre son obligatorios` | Usar POST /api/trd/.../tipos (con idSubserie) |
| `No se puede desactivar serie con subseries` | Desactivar subseries primero |
| `FK violation: id_oficina` | id_oficina debe existir en tabla oficina |

---

## 📋 Check de Producción

```sql
-- Verificar integridad FK
SELECT COUNT(*) FROM serie WHERE id_oficina IS NULL;  -- debe ser 0

-- Verificar tipo_documental
SELECT COUNT(*) FROM tipo_documental WHERE id_subserie IS NULL;  -- debe ser 0

-- Verificar vistas
EXPLAIN ANALYZE SELECT * FROM vista_jerarquia;

-- Verificar índices
SELECT * FROM pg_indexes WHERE tablename IN ('oficina', 'serie', 'subserie', 'tipo_documental');
```

---

## 🔐 Seguridad

- ✅ ON DELETE RESTRICT implementado (sin cascadas peligrosas)
- ✅ Validación de existencia de padres (softfk)
- ✅ Logging de cambios en AUDITORIA_TRD
- ✅ Autenticación requerida en todos endpoints
- ⚠️ TODO: Autorización por oficina (próxima fase)

---

## 📱 Para Mobile

Si tienes app móvil, endpoints a considerar:

```
GET /api/trd/oficinas              # Caché on-device
GET /api/trd/oficinas/1/jerarquia  # Pre-load tree
POST /api/trd/oficinas/1/series    # Crear localmente + sync
```

---

## 🎓 Referencias

- [Modelo ER detallado](DIAGRAMA_ER_ACTUALIZADO.md)
- [Ejemplos API completos](GUIA_INTEGRACION_ER.md)
- [Cambios técnicos](CORRECCIONES_MODELO_ER.md)
- [SQL Schema completo](base_datos/trd/schema.sql)

---

**Última actualización:** 18 de Marzo 2026 ✅
