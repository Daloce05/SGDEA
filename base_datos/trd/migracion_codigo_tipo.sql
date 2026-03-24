/**
 * Migración: Agregar campo CODIGO a tabla tipo_documental
 * 
 * Ejecutar si ya tienes BD existente:
 * psql -U postgres -d sgdea_trd -f base_datos/trd/migracion_codigo_tipo.sql
 */

-- Agregar columna codigo si no existe
ALTER TABLE tipo_documental ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- Crear índice para codigo
CREATE INDEX IF NOT EXISTS idx_tipo_codigo ON tipo_documental(codigo);

-- Mostrar resultado
\echo '✓ Columna CODIGO agregada a tabla tipo_documental'
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='tipo_documental' ORDER BY ordinal_position;
