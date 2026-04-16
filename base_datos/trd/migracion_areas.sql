/**
 * Migración: Crear tabla AREA y agregar FK en SERIE
 * 
 * Crea la tabla 'area' y añade la columna nullable 'id_area' a la tabla 'serie'.
 * Las series existentes quedan sin área (NULL), compatible con la vista general.
 * 
 * Ejecutar: node base_datos/trd/migracion_areas.js
 */

-- ============================================
-- TABLA: AREA (Agrupación lógica de series)
-- ============================================

CREATE TABLE IF NOT EXISTS area (
    id_area             SERIAL PRIMARY KEY,
    codigo_area         VARCHAR(20) NOT NULL UNIQUE,
    nombre_area         VARCHAR(150) NOT NULL,
    dependencia_productora VARCHAR(200),
    oficina_productora  VARCHAR(200),
    codigo_oficina      VARCHAR(20),
    descripcion         TEXT,
    activa              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_area_codigo ON area(codigo_area);
CREATE INDEX IF NOT EXISTS idx_area_activa ON area(activa);

-- ============================================
-- MODIFICAR SERIE: Agregar columna id_area (nullable)
-- ============================================

ALTER TABLE serie ADD COLUMN IF NOT EXISTS id_area INTEGER;

-- FK opcional: serie → area
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_serie_area'
    ) THEN
        ALTER TABLE serie ADD CONSTRAINT fk_serie_area
            FOREIGN KEY (id_area) REFERENCES area(id_area) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_serie_area ON serie(id_area);

-- ============================================
-- VISTA: Jerarquía por áreas
-- ============================================

CREATE OR REPLACE VIEW vista_jerarquia_areas AS
SELECT 
    a.id_area,
    a.codigo_area,
    a.nombre_area AS area_nombre,
    s.id_serie,
    s.codigo AS serie_codigo,
    s.nombre AS serie_nombre,
    ss.id_subserie,
    ss.codigo AS subserie_codigo,
    ss.nombre AS subserie_nombre,
    td.id_tipo,
    td.nombre AS tipo_nombre,
    COUNT(ar.id_archivo) FILTER (WHERE ar.activo = true) AS total_archivos
FROM area a
LEFT JOIN serie s ON a.id_area = s.id_area AND s.activo = true
LEFT JOIN subserie ss ON s.id_serie = ss.id_serie AND ss.activa = true
LEFT JOIN tipo_documental td ON ss.id_subserie = td.id_subserie AND td.activo = true
LEFT JOIN archivo ar ON td.id_tipo = ar.id_tipo
WHERE a.activa = true
GROUP BY a.id_area, a.codigo_area, a.nombre_area,
         s.id_serie, s.codigo, s.nombre,
         ss.id_subserie, ss.codigo, ss.nombre,
         td.id_tipo, td.nombre
ORDER BY a.codigo_area, s.codigo, ss.codigo, td.nombre;
