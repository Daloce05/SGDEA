# 📋 Correcciones al Modelo Relacional de la BD - TRD

## Resumen Ejecutivo
Se corrigieron **5 problemas críticos** en el esquema de la base de datos para alinearlo con el diagrama relacional propuesto y garantizar la integridad referencial.

---

## 🔧 Correcciones Realizadas

### 1. **Tabla OFICINA Creada** ✅
**Problema**: La tabla OFICINA no existía en el schema.sql pero está en el diagrama ER como nivel raíz.

**Solución**:
```sql
CREATE TABLE IF NOT EXISTS oficina (
    id_oficina          SERIAL PRIMARY KEY,
    codigo_oficina      VARCHAR(10) NOT NULL UNIQUE,
    nombre_oficina      VARCHAR(150) NOT NULL,
    dependencia         VARCHAR(150),
    activa              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- Establece la raíz de la jerarquía documental
- Reemplaza el hardcoded `codigo_oficina = '144'` con una FK

---

### 2. **Tabla SERIE Corregida** ✅
**Problema**: Usaba `codigo_oficina VARCHAR(10)` con valor por defecto en lugar de relación referencial.

**Cambios**:
- ❌ ANTES: `codigo_oficina VARCHAR(10) NOT NULL DEFAULT '144'`
- ✅ AHORA: `id_oficina INTEGER NOT NULL` con FK a `oficina(id_oficina)`

**Impacto**: 
- Integridad referencial garantizada
- No hay oficinas huérfanas
- Restricción ON DELETE RESTRICT previene eliminación de oficinas con series

---

### 3. **Tabla TIPO_DOCUMENTAL Simplificada** ✅
**Problema**: Tenía un constraint CHECK ambiguo que permitía `id_serie` O `id_subserie`, violando la jerarquía.

**Cambios**:
- ❌ ANTES: Campos `id_subserie` (nullable) + `id_serie` (nullable) + constraint CHECK
- ✅ AHORA: Solo `id_subserie INTEGER NOT NULL`

**Lógica**:
- TIPO_DOCUMENTAL debe estar SIEMPRE bajo una SUBSERIE
- No puede existir "tipo documental huérfano"
- La jerarquía es: SERIE → SUBSERIE → TIPO_DOCUMENTAL

```
Antes (INCORRECTO):
├─ SERIE (sin subserie) → TIPO_DOCUMENTAL ❌
├─ SUBSERIE → TIPO_DOCUMENTAL ✓

Después (CORRECTO):
└─ SERIE → SUBSERIE → TIPO_DOCUMENTAL ✓ (siempre)
```

---

### 4. **Vistas SQL Corregidas** ✅
**Problema 1 - vista_jerarquia**: Faltaba enlace con tabla OFICINA.

**Problema 2 - vista_archivos_disposicion**: 
- ❌ `LEFT JOIN archivo a ON s.id_serie = a.id_tipo` ← **WRONG** (comparar id_serie con id_tipo)
- ✅ Corregido con joins completos a través de la jerarquía

**Nueva vista_jerarquia**:
```sql
FROM oficina o
LEFT JOIN serie s ON o.id_oficina = s.id_oficina
LEFT JOIN subserie ss ON s.id_serie = ss.id_serie
LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie
LEFT JOIN archivo a ON td.id_tipo = a.id_tipo
```

**Mejoras**:
- Incluye información de OFICINA
- JOINs siguen la jerarquía correcta
- Agrupa por todos los niveles

---

### 5. **Datos de Inserción Actualizados** ✅
**Cambio en INSERT serie**:
- ❌ ANTES: `INSERT INTO serie (codigo, nombre, ...) VALUES (...)`
- ✅ AHORA: `INSERT INTO serie (id_oficina, codigo, nombre, ...) VALUES (1, ...)`

**Nueva tabla oficina seed data**:
```sql
INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
VALUES ('144', 'Dirección de Archivo', 'Entidad Principal', TRUE)
```

---

## 📊 Diagrama de la Jerarquía Corregida

```
OFICINA (Nivel 0)
    ├─ codigo_oficina [PK]
    ├─ nombre_oficina
    └─ dependencia
        │
        └──→ SERIE (Nivel ♦)
             ├─ id_serie [PK]
             ├─ id_oficina [FK] ← Relación Parents
             ├─ codigo
             ├─ nombre
             ├─ tiempo_gestion / tiempo_central
             └─ disposicion_final [1:1]
                 │
                 └──→ SUBSERIE (Nivel ►)
                      ├─ id_subserie [PK]
                      ├─ id_serie [FK]
                      ├─ codigo
                      └─ nombre
                          │
                          └──→ TIPO_DOCUMENTAL (Nivel •)
                               ├─ id_tipo [PK]
                               ├─ id_subserie [FK] ← AHORA REQUIRED (NOT NULL)
                               ├─ nombre
                               └─ descripcion
                                   │
                                   └──→ ARCHIVO (Nivel física)
                                        ├─ id_archivo [PK]
                                        ├─ id_tipo [FK]
                                        ├─ nombre_archivo
                                        ├─ estado (físico|digital|ambos)
                                        ├─ ruta_pdf
                                        └─ observaciones
```

---

## ✅ Validaciones Garantizadas

| Validación | Antes | Después |
|-----------|-------|---------|
| FK OFICINA-SERIE | ❌ No | ✅ Sí |
| Jerarquía TIPO_DOCUMENTAL | ⚠️ Ambigua | ✅ Clara (solo SUBSERIE) |
| Integridad referencial | ⚠️ Parcial | ✅ Completa |
| ON DELETE RESTRICT | ⚠️ Parcial | ✅ Todos los niveles |
| Vista jerarquía | ❌ Sin OFICINA | ✅ Completa |
| Vista disposición | ❌ JOIN incorrecto | ✅ Corregido |

---

## 🚀 Próximos Pasos

1. **Ejecutar script actualizado**:
   ```bash
   psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
   ```

2. **Actualizar modelos Node.js** en `src/modelos/trd/`:
   - Adicionar `ModeloOficina.js`
   - Actualizar `ModeloSerie.js` para usar `id_oficina` en lugar de `codigo_oficina`
   - Validar `ModeloTipoDocumental.js` no permita `id_serie` como alternativa

3. **Actualizar controladores**:
   - [ControladorSerie.js](src/controladores/trd/ControladorSerie.js) - Manejar id_oficina
   - [ControladorTipoDocumental.js](src/controladores/trd/ControladorTipoDocumental.js) - Remover validación id_serie

4. **Rutas API** - Posiblemente agregar:
   - `GET /api/trd/oficinas` - Listar oficinas
   - `POST /api/trd/oficinas` - Crear oficina

5. **Tests**:
   - Validar cascadas de datos
   - Probar restricciones FK (DELETE RESTRICT)
   - Verificar vistas actualizadas

---

## 📝 Notas Técnicas

- **Base de datos**: PostgreSQL 12+
- **Cambios reversibles**: Ejecutar schema.sql anterior para revertir (destructivo)
- **Migraciones**: Considerar crear migration file para producción
- **Performance**: Índices añadidos en todas las FK para queries eficientes

