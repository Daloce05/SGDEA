/**
 * Script para verificar conexión de API a BD SGDEA
 */

const { pool } = require('./config/postgresqlTRD');

async function verificarConexionAPI() {
  console.log('→ Verificando configuración de BD...');
  console.log(`  • Host: ${process.env.PG_HOST || 'localhost'}`);
  console.log(`  • Puerto: ${process.env.PG_PORT || 5432}`);
  console.log(`  • BD: ${process.env.PG_DATABASE || 'sgdea_trd'}`);
  console.log(`  • Usuario: ${process.env.PG_USER || 'postgres'}\n`);
  
  try {
    
    // Probar conexión
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Conexión a PostgreSQL exitosa');
    console.log(`  • Hora del servidor: ${result.rows[0].now}\n`);
    
    // Verificar tablas
    const tablas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    
    console.log(`✓ ${tablas.rows.length} tablas encontradas en BD:`);
    tablas.rows.forEach(t => {
      console.log(`  • ${t.table_name}`);
    });
    
    // Probar lectura de cada tabla
    console.log('\n→ Verificando datos de tablas principales...');
    
    try {
      const oficinas = await pool.query('SELECT COUNT(*) as total FROM oficina');
      console.log(`  ✓ OFICINA: ${oficinas.rows[0].total} registros`);
    } catch (err) {
      console.log(`  ✗ OFICINA: No accesible`);
    }
    
    try {
      const series = await pool.query('SELECT COUNT(*) as total FROM serie');
      console.log(`  ✓ SERIE: ${series.rows[0].total} registros`);
    } catch (err) {
      console.log(`  ✗ SERIE: No accesible`);
    }
    
    try {
      const subseries = await pool.query('SELECT COUNT(*) as total FROM subserie');
      console.log(`  ✓ SUBSERIE: ${subseries.rows[0].total} registros`);
    } catch (err) {
      console.log(`  ✗ SUBSERIE: No accesible`);
    }
    
    console.log('\n✓✓✓ Conexión de API a BD SGDEA verificada ✓✓✓\n');
    process.exit(0);
    
  } catch (err) {
    console.error('✗ Error de conexión:', err.message);
    console.error('\n⚠️  Verifique:');
    console.error('  • PostgreSQL está ejecutándose');
    console.error('  • .env tiene credenciales correctas');
    console.error('  • BD SGDEA existe y está inicializada');
    process.exit(1);
  }
}

verificarConexionAPI();
