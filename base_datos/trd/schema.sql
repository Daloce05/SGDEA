/**
 * Script SQL para PostgreSQL - Tablas TRD
 * 
 * Sistema de Gestión de Archivos Documentales basado en TRD
 * Crea la jerarquía: OFICINA → SERIE → SUBSERIE → TIPO DOCUMENTAL → ARCHIVO
 * 
 * Ejecutar:
 * psql -U postgres -d sgdea_trd -f base_datos/trd/schema.sql
 */

-- ============================================
-- T0: OFICINAS (Nivel raíz de la jerarquía)
-- ============================================

CREATE TABLE IF NOT EXISTS oficina (
    id_oficina          SERIAL PRIMARY KEY,
    codigo_oficina      VARCHAR(10) NOT NULL UNIQUE,
    nombre_oficina      VARCHAR(150) NOT NULL,
    dependencia         VARCHAR(150),
    activa              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oficina_codigo ON oficina(codigo_oficina);

-- Insertar data inicial
INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
VALUES 
    ('144', 'Dirección de Archivo', 'Entidad Principal', TRUE)
ON CONFLICT (codigo_oficina) DO NOTHING;

-- ============================================
-- T1: SERIES DOCUMENTALES (Nivel ♦)
-- ============================================

CREATE TABLE IF NOT EXISTS serie (
    id_serie            SERIAL PRIMARY KEY,
    id_oficina          INTEGER NOT NULL,
    codigo              VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(150) NOT NULL,
    tiempo_gestion      INTEGER DEFAULT 0,
    tiempo_central      INTEGER DEFAULT 0,
    descripcion         TEXT,
    activo              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_serie_oficina FOREIGN KEY (id_oficina)
        REFERENCES oficina(id_oficina) ON DELETE RESTRICT
);

CREATE INDEX idx_serie_codigo ON serie(codigo);
CREATE INDEX idx_serie_oficina ON serie(id_oficina);

-- Datos reales del PDF
INSERT INTO serie (id_oficina, codigo, nombre, tiempo_gestion, tiempo_central, descripcion)
VALUES
  (1, '144.01', 'ACTAS', 5, 0, 'Documentos de actas y registros de supervisión'),
  (1, '144.04', 'ATENCIÓN QUEJAS PETICIONES Y SUGERENCIAS', 5, 0, 'Atención a derechos de petición'),
  (1, '144.21', 'FACTURACIÓN', 2, 5, 'Documentos de facturación y cobros'),
  (1, '144.24', 'INVENTARIOS', 2, 0, 'Registros de inventario de bienes'),
  (1, '144.27', 'MANUALES', 2, 8, 'Manuales y procedimientos organizacionales'),
  (1, '144.30', 'PLANES Y PROGRAMAS', 2, 0, 'Planes operativos y programas')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- T2: SUBSERIES (Nivel ►)
-- ============================================

CREATE TABLE IF NOT EXISTS subserie (
    id_subserie         SERIAL PRIMARY KEY,
    id_serie            INTEGER NOT NULL,
    codigo              VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    activa              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subserie_serie FOREIGN KEY (id_serie)
        REFERENCES serie(id_serie) ON DELETE RESTRICT
);

CREATE INDEX idx_subserie_serie ON subserie(id_serie);
CREATE INDEX idx_subserie_codigo ON subserie(codigo);

-- Datos reales del PDF
INSERT INTO subserie (id_serie, codigo, nombre, descripcion)
VALUES
  (1, '144.01,16', 'Actas de Supervisión', 'Actas generadas en procesos de supervisión'),
  (1, '144.01,22', 'Actas de Anomalías', 'Actas que registran anomalías encontradas'),
  (2, '144.04,02', 'Atención Derechos de Petición', 'Respuesta a derechos de petición'),
  (4, '144.24,04', 'Inventario de Muebles y Enseres', 'Inventarios de muebles de la oficina'),
  (4, '144.24,10', 'Inventario Documental', 'Inventario de documentos'),
  (5, '144.27,04', 'Manual de Procesos y Procedimientos', 'Manuales de operación'),
  (6, '144.30,01', 'Plan de Acción', 'Planes de acción operativos')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- T3: TIPOS DOCUMENTALES (Nivel •)
-- ============================================

CREATE TABLE IF NOT EXISTS tipo_documental (
    id_tipo             SERIAL PRIMARY KEY,
    id_subserie         INTEGER NOT NULL,
    codigo              VARCHAR(50),
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    activo              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tipo_subserie FOREIGN KEY (id_subserie)
        REFERENCES subserie(id_subserie) ON DELETE RESTRICT
);

CREATE INDEX idx_tipo_subserie ON tipo_documental(id_subserie);
CREATE INDEX idx_tipo_codigo ON tipo_documental(codigo);

-- Agregar columna codigo si no existe (para tablas existentes)
ALTER TABLE tipo_documental ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- ============================================
-- T4: ARCHIVOS (Documentos físicos o digitales)
-- ============================================

CREATE TABLE IF NOT EXISTS archivo (
    id_archivo          SERIAL PRIMARY KEY,
    id_tipo             INTEGER NOT NULL,
    nombre_archivo      VARCHAR(200) NOT NULL,
    estado              VARCHAR(20) DEFAULT 'fisico' CHECK (estado IN ('fisico', 'digital', 'ambos')),
    ruta_pdf            VARCHAR(500),
    fecha_documento     DATE,
    fecha_carga         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tamaño_kb           INTEGER,
    hash_md5            CHAR(32),
    subido_por          VARCHAR(100),
    observaciones       TEXT,
    activo              BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_archivo_tipo FOREIGN KEY (id_tipo)
        REFERENCES tipo_documental(id_tipo) ON DELETE RESTRICT
);

CREATE INDEX idx_archivo_tipo ON archivo(id_tipo);
CREATE INDEX idx_archivo_estado ON archivo(estado);
CREATE INDEX idx_archivo_fecha ON archivo(fecha_documento);

-- ============================================
-- T5: DISPOSICIÓN FINAL (Políticas de retención)
-- ============================================

CREATE TABLE IF NOT EXISTS disposicion_final (
    id_disposicion      SERIAL PRIMARY KEY,
    id_serie            INTEGER NOT NULL UNIQUE,
    conservacion_total  BOOLEAN DEFAULT FALSE,
    eliminacion         BOOLEAN DEFAULT FALSE,
    microfilmacion      BOOLEAN DEFAULT FALSE,
    seleccion           BOOLEAN DEFAULT FALSE,
    observaciones       TEXT,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disp_serie FOREIGN KEY (id_serie)
        REFERENCES serie(id_serie)
);

-- Datos reales del PDF
INSERT INTO disposicion_final 
  (id_serie, conservacion_total, eliminacion, seleccion, observaciones)
VALUES
  (1, FALSE, TRUE, FALSE, 'Eliminación después de verificación en expediente'),
  (2, FALSE, FALSE, TRUE, 'Se seleccionan documentos representativos'),
  (3, FALSE, TRUE, FALSE, 'Eliminación: se conserva histórico en archivos magnéticos'),
  (4, FALSE, TRUE, FALSE, 'Eliminación: documentos de control'),
  (5, TRUE, FALSE, FALSE, 'Conservación total: eliminar copias'),
  (6, FALSE, TRUE, FALSE, 'Eliminación: se condensa en plan de acción')
ON CONFLICT (id_serie) DO NOTHING;

-- ============================================
-- T6: AUDITORIA (Tracking de cambios)
-- ============================================

CREATE TABLE IF NOT EXISTS auditoria_trd (
    id_auditoria        SERIAL PRIMARY KEY,
    usuario             VARCHAR(100),
    accion              VARCHAR(50) NOT NULL,
    tabla               VARCHAR(50) NOT NULL,
    registro_id         INTEGER,
    datos_anteriores    JSONB,
    datos_nuevos        JSONB,
    fecha_accion        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_tabla ON auditoria_trd(tabla);
CREATE INDEX idx_auditoria_fecha ON auditoria_trd(fecha_accion);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Jerarquía completa de documentos
CREATE OR REPLACE VIEW vista_jerarquia AS
SELECT 
    o.id_oficina,
    o.codigo_oficina,
    o.nombre_oficina,
    s.id_serie,
    s.codigo AS serie_codigo,
    s.nombre AS serie_nombre,
    ss.id_subserie,
    ss.codigo AS subserie_codigo,
    ss.nombre AS subserie_nombre,
    td.id_tipo,
    td.nombre AS tipo_nombre,
    COUNT(a.id_archivo) AS total_archivos
FROM oficina o
LEFT JOIN serie s ON o.id_oficina = s.id_oficina
LEFT JOIN subserie ss ON s.id_serie = ss.id_serie
LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie
LEFT JOIN archivo a ON td.id_tipo = a.id_tipo
GROUP BY o.id_oficina, o.codigo_oficina, o.nombre_oficina, s.id_serie, s.codigo, s.nombre, 
         ss.id_subserie, ss.codigo, ss.nombre, td.id_tipo, td.nombre
ORDER BY o.codigo_oficina, s.codigo, ss.codigo, td.nombre;

-- Vista: Archivos por serie con información de disposición
CREATE OR REPLACE VIEW vista_archivos_disposicion AS
SELECT 
    s.id_serie,
    s.codigo,
    s.nombre AS serie_nombre,
    s.tiempo_gestion,
    s.tiempo_central,
    d.conservacion_total,
    d.eliminacion,
    d.seleccion,
    d.microfilmacion,
    COUNT(a.id_archivo) AS total_archivos
FROM serie s
LEFT JOIN subserie ss ON s.id_serie = ss.id_serie
LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie
LEFT JOIN archivo a ON td.id_tipo = a.id_tipo
LEFT JOIN disposicion_final d ON s.id_serie = d.id_serie
GROUP BY s.id_serie, s.codigo, s.nombre, s.tiempo_gestion, s.tiempo_central,
         d.conservacion_total, d.eliminacion, d.seleccion, d.microfilmacion;

-- ============================================
-- PERMISOS (Si usas usuarios de BD separados)
-- ============================================

-- GRANT ALL PRIVILEGES ON DATABASE sgdea_trd TO sgdea_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sgdea_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sgdea_user;
