/**
 * Script de migración: Tabla AREA y FK en SERIE
 * 
 * Crea la tabla 'area' y añade la columna 'id_area' nullable a 'serie'.
 * Seguro de ejecutar múltiples veces (idempotente).
 * 
 * Ejecutar: node base_datos/trd/migracion_areas.js
 */

require('dotenv').config();
const { pool } = require('../../config/postgresqlTRD');

async function ejecutarMigracion() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Iniciando migración de áreas...\n');

    // 1. Crear tabla area
    console.log('1. Creando tabla AREA...');
    await client.query(`
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
      )
    `);
    console.log('   ✅ Tabla AREA creada/verificada');

    // 1b. Agregar columnas si la tabla ya existía sin ellas
    console.log('1b. Verificando columnas nuevas...');
    await client.query("ALTER TABLE area ADD COLUMN IF NOT EXISTS dependencia_productora VARCHAR(200)");
    await client.query("ALTER TABLE area ADD COLUMN IF NOT EXISTS oficina_productora VARCHAR(200)");
    await client.query("ALTER TABLE area ADD COLUMN IF NOT EXISTS codigo_oficina VARCHAR(20)");
    console.log('   ✅ Columnas dependencia_productora, oficina_productora, codigo_oficina verificadas');

    // 2. Crear índices
    console.log('2. Creando índices...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_area_codigo ON area(codigo_area)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_area_activa ON area(activa)');
    console.log('   ✅ Índices creados');

    // 3. Agregar columna id_area a serie
    console.log('3. Agregando columna id_area a tabla SERIE...');
    await client.query('ALTER TABLE serie ADD COLUMN IF NOT EXISTS id_area INTEGER');
    console.log('   ✅ Columna id_area agregada/verificada');

    // 4. Crear FK
    console.log('4. Creando FK serie → area...');
    const fkExiste = await client.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_serie_area'
    `);
    if (fkExiste.rows.length === 0) {
      await client.query(`
        ALTER TABLE serie ADD CONSTRAINT fk_serie_area
          FOREIGN KEY (id_area) REFERENCES area(id_area) ON DELETE SET NULL
      `);
      console.log('   ✅ FK fk_serie_area creada');
    } else {
      console.log('   ✅ FK fk_serie_area ya existe');
    }

    // 5. Índice en serie.id_area
    console.log('5. Creando índice en serie.id_area...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_serie_area ON serie(id_area)');
    console.log('   ✅ Índice idx_serie_area creado');

    // 6. Crear vista de jerarquía por áreas
    console.log('6. Creando vista vista_jerarquia_areas...');
    await client.query(`
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
      ORDER BY a.codigo_area, s.codigo, ss.codigo, td.nombre
    `);
    console.log('   ✅ Vista vista_jerarquia_areas creada');

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('✅ Migración completada exitosamente');
    console.log('========================================');
    console.log('\nResumen:');
    console.log('  - Tabla AREA creada');
    console.log('  - Columna id_area (nullable) agregada a SERIE');
    console.log('  - FK fk_serie_area creada (ON DELETE SET NULL)');
    console.log('  - Vista vista_jerarquia_areas creada');
    console.log('  - Las series existentes no fueron modificadas (id_area = NULL)');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ejecutarMigracion();
