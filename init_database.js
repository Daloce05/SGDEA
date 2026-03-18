/**
 * Script para inicializar la base de datos PostgreSQL
 * Crea la BD sgdea_trd y carga el schema
 */

require('dotenv').config();
const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  
  try {
    // 1. Conectar como admin a postgres
    console.log('Conectando a PostgreSQL...');
    const adminClient = new Client({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: 'postgres'
    });
    
    await adminClient.connect();
    console.log('✓ Conectado a PostgreSQL');

    // 2. Eliminar base de datos si existe (para reconstruir)
    try {
      // Terminar conexiones activas
      await adminClient.query(
        `SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity WHERE pg_stat_activity.datname = 'sgdea_trd'`
      );
      
      await adminClient.query(`DROP DATABASE IF EXISTS sgdea_trd`);
      console.log('✓ Base de datos anterior eliminada');
    } catch (err) {
      // Ignorar errores si la BD no existe
    }

    // 3. Crear base de datos nueva
    try {
      await adminClient.query(`CREATE DATABASE sgdea_trd ENCODING 'UTF8'`);
      console.log('✓ Base de datos sgdea_trd creada');
    } catch (err) {
      console.error('Error creando base de datos:', err.message);
      throw err;
    }

    // 4. Conectar a la base de datos nueva
    await adminClient.end();

    const dbClient = new Client({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: 'sgdea_trd'
    });

    await dbClient.connect();
    console.log('✓ Conectado a base de datos sgdea_trd');

    // 4. Ejecutar schema.sql
    const schemaPath = path.join(__dirname, 'base_datos', 'trd', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar todo de una vez (PostgreSQL maneja los comentarios)
    try {
      await dbClient.query(schemaSql);
      console.log('✓ Schema SQL ejecutado correctamente');
    } catch (err) {
      console.error('Error en schema.sql:', err.message);
    }

    // 5. Verificar tablas creadas
    const tablesResult = await dbClient.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`
    );

    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`\n✓ Tablas creadas (${tables.length}):`);
    tables.forEach(t => console.log(`  • ${t}`));

    // 6. Verificar datos de oficina
    const oficinasResult = await dbClient.query('SELECT COUNT(*) FROM oficina');
    const oficinas = parseInt(oficinasResult.rows[0].count);
    console.log(`\n✓ Oficinas insertadas: ${oficinas}`);

    const seriesResult = await dbClient.query('SELECT COUNT(*) FROM serie');
    const series = parseInt(seriesResult.rows[0].count);
    console.log(`✓ Series insertadas: ${series}`);

    await dbClient.end();

    console.log('\n════════════════════════════════════════════');
    console.log('✓✓✓ Base de datos inicializada con éxito ✓✓✓');
    console.log('════════════════════════════════════════════\n');
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
initDatabase();
