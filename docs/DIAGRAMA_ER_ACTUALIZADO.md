# Diagrama ER - Modelo Relacional TRD (CORREGIDO)

## Tabla: OFICINA (Nueva)
```
┌─────────────────────────────────────┐
│          OFICINA                    │
├─────────────────────────────────────┤
│ 🔑 id_oficina (SERIAL PRIMARY KEY) │
│ 🔐 codigo_oficina (VARCHAR UNIQUE)  │
│    nombre_oficina (VARCHAR)         │
│    dependencia (VARCHAR)            │
│    activa (BOOLEAN)                 │
│    fecha_creacion (TIMESTAMP)       │
│    fecha_actualizacion (TIMESTAMP)  │
└─────────────────────────────────────┘
          ↓ 1:N
```

## Tabla: SERIE
```
┌──────────────────────────────────────┐
│           SERIE                      │
├──────────────────────────────────────┤
│ 🔑 id_serie (SERIAL PRIMARY KEY)    │
│ 🔗 id_oficina (FK → OFICINA)        │ NEW FK
│    codigo (VARCHAR UNIQUE)          │
│    nombre (VARCHAR)                 │
│    tiempo_gestion (INTEGER)         │
│    tiempo_central (INTEGER)         │
│    descripcion (TEXT)               │
│    activo (BOOLEAN)                 │
│    fecha_creacion (TIMESTAMP)       │
│    fecha_actualizacion (TIMESTAMP)  │
└──────────────────────────────────────┘
          ↓ 1:N  ↓ 1:1
       (ss)    (disp)
```

## Tabla: SUBSERIE
```
┌──────────────────────────────────────┐  
│         SUBSERIE                     │
├──────────────────────────────────────┤
│ 🔑 id_subserie (SERIAL PRIMARY KEY) │
│ 🔗 id_serie (FK → SERIE)            │
│    codigo (VARCHAR UNIQUE)          │
│    nombre (VARCHAR)                 │
│    descripcion (TEXT)               │
│    activa (BOOLEAN)                 │
│    fecha_creacion (TIMESTAMP)       │
└──────────────────────────────────────┘
          ↓ 1:N
```

## Tabla: TIPO_DOCUMENTAL (CORREGIDA)
```
┌──────────────────────────────────────────────┐
│      TIPO_DOCUMENTAL                         │
├──────────────────────────────────────────────┤
│ 🔑 id_tipo (SERIAL PRIMARY KEY)             │
│ 🔗 id_subserie (FK → SUBSERIE) NOT NULL ✓  │
│    nombre (VARCHAR)                         │
│    descripcion (TEXT)            (REMOVED)  │
│    activo (BOOLEAN)            id_serie ❌  │
│    fecha_creacion (TIMESTAMP)              │
│                                            │
│ ⚠️ CAMBIO: id_serie removido. Siempre bajo│
│    SUBSERIE (no directamente bajo SERIE)  │
└──────────────────────────────────────────────┘
          ↓ 1:N
```

## Tabla: ARCHIVO  
```
┌──────────────────────────────────────┐
│         ARCHIVO                      │
├──────────────────────────────────────┤
│ 🔑 id_archivo (SERIAL PRIMARY KEY)  │
│ 🔗 id_tipo (FK → TIPO_DOCUMENTAL)   │
│    nombre_archivo (VARCHAR)         │
│    estado (VARCHAR: físico/digital) │
│    ruta_pdf (VARCHAR)               │
│    fecha_documento (DATE)           │
│    fecha_carga (TIMESTAMP)          │
│    tamaño_kb (INTEGER)              │
│    hash_md5 (CHAR)                  │
│    subido_por (VARCHAR)             │
│    observaciones (TEXT)             │
│    activo (BOOLEAN)                 │
│    fecha_actualizacion (TIMESTAMP)  │
└──────────────────────────────────────┘
```

## Tabla: DISPOSICION_FINAL
```
┌────────────────────────────────────────┐
│     DISPOSICION_FINAL                  │
├────────────────────────────────────────┤
│ 🔑 id_disposicion (SERIAL PRIMARY KEY)│
│ 🔗 id_serie (FK → SERIE) UNIQUE       │
│    conservacion_total (BOOLEAN)       │
│    eliminacion (BOOLEAN)              │
│    microfilmacion (BOOLEAN)           │
│    seleccion (BOOLEAN)                │
│    observaciones (TEXT)               │
│    fecha_creacion (TIMESTAMP)         │
└────────────────────────────────────────┘
```

## Tabla: AUDITORIA_TRD
```
┌────────────────────────────────────────┐
│      AUDITORIA_TRD                     │
├────────────────────────────────────────┤
│ 🔑 id_auditoria (SERIAL PRIMARY KEY)  │
│    usuario (VARCHAR)                  │
│    accion (VARCHAR)                   │
│    tabla (VARCHAR)                    │
│    registro_id (INTEGER)              │
│    datos_anteriores (JSONB)           │
│    datos_nuevos (JSONB)               │
│    fecha_accion (TIMESTAMP)           │
└────────────────────────────────────────┘
```

---

## Relaciones (Constraints FK)

| Tabla Origen      | FK             | Tabla Destino     | ON DELETE   |
|------------------|----------------|------------------|------------|
| SERIE            | id_oficina     | OFICINA           | RESTRICT   |
| SUBSERIE         | id_serie       | SERIE             | RESTRICT   |
| TIPO_DOCUMENTAL  | id_subserie    | SUBSERIE          | RESTRICT   |
| ARCHIVO          | id_tipo        | TIPO_DOCUMENTAL   | RESTRICT   |
| DISPOSICION_FINAL| id_serie       | SERIE             | No definido|

---

## Cambios Principales Respecto al Diagrama Original

### ✅ IMPLEMENTADO COMPLETAMENTE
- [x] Tabla OFICINA como nivel raíz
- [x] Jerarquía completa: OFICINA → SERIE → SUBSERIE → TIPO_DOCUMENTAL → ARCHIVO
- [x] FK en lugar de VARCHAR para relaciones
- [x] Tipo_DOCUMENTAL solo bajo SUBSERIE (no alternativa con SERIE)
- [x] Todas las constraints ON DELETE RESTRICT

### ⚠️ DIFERENCIAS INTENCIONALES
- View `vista_jerarquia` requiere join con OFICINA (agrega contexto)
- Índices en todas las FK para optimizar queries
- Todos los campos de timestamp con DEFAULT CURRENT_TIMESTAMP

