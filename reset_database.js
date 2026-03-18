/**
 * Script para crear base de datos limpia desde cero
 * Elimina BD anterior (si existe) y crea nueva con esquema correcto
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const NEW_DATABASE = 'sgdea_production';

async function resetDatabase() {
  const adminClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: 'postgres'  // Conectar a BD admin
  });

  try {
    console.log('\n=== RESET DE BASE DE DATOS ===\n');
    
    await adminClient.connect();
    console.log('✓ Conectado a PostgreSQL (admin)');

    // 1. Eliminar BD anterior si existe
    try {
      await adminClient.query(`DROP DATABASE IF EXISTS "${NEW_DATABASE}" WITH (FORCE);`);
      console.log(`✓ BD anterior "${NEW_DATABASE}" eliminada`);
    } catch (err) {
      console.log(`✓ BD no existía, creando nueva...`);
    }

    // 2. Crear nueva BD
    await adminClient.query(`CREATE DATABASE "${NEW_DATABASE}";`);
    console.log(`✓ Nueva BD "${NEW_DATABASE}" creada`);

    await adminClient.end();

    // 3. Conectar a la nueva BD y ejecutar schema
    const dbClient = new Client({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: NEW_DATABASE
    });

    await dbClient.connect();
    console.log(`✓ Conectado a BD "${NEW_DATABASE}"`);

    // 4. Leer y ejecutar schema
    const schemaPath = path.join(__dirname, 'base_datos', 'trd', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Dividir por ; y ejecutar cada statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await dbClient.query(statements[i]);
      } catch (err) {
        // Ignorar errores de "ya existe"
        if (!err.message.includes('already exists')) {
          console.error(`Error en statement ${i + 1}: ${err.message}`);
        }
      }
    }
    console.log(`✓ Schema creado (${statements.length} statements)`);

    // 5. Verificar tablas
    const tables = await dbClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n✓ Tablas creadas (${tables.rows.length}):`);
    tables.rows.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.table_name}`);
    });

    // 6. Verificar estructura de serie
    console.log('\n✓ Estructura tabla SERIE:');
    const serieColumns = await dbClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'serie'
      ORDER BY ordinal_position
    `);
    serieColumns.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type}`);
    });

    // 7. Contar registros
    const counts = await dbClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM oficina) as oficinas,
        (SELECT COUNT(*) FROM serie) as series,
        (SELECT COUNT(*) FROM subserie) as subseries
    `);

    const { oficinas, series, subseries } = counts.rows[0];
    console.log(`\n✓ Registros insertados:`);
    console.log(`  • Oficinas: ${oficinas}`);
    console.log(`  • Series: ${series}`);
    console.log(`  • Subseries: ${subseries}`);

    await dbClient.end();

    console.log(`\n✓✓✓ BD "${NEW_DATABASE}" lista para usar ✓✓✓`);
    console.log(`\nActualiza .env con: PG_DATABASE=${NEW_DATABASE}`);
    console.log('Luego reinicia el servidor con: npm start\n');
    
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Error fatal:', err.message);
    process.exit(1);
  }
}

// Cargar variables de entorno
require('dotenv').config();

resetDatabase();
