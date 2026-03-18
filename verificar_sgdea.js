/**
 * Script para verificar estado de BD SGDEA
 */

const { Client } = require('pg');

async function verificarSGDEA() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'daloce05',
    database: 'SGDEA'
  });

  try {
    await client.connect();
    console.log('✓ Conectado a BD: SGDEA\n');
    
    // Verificar tablas
    const tablas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 TABLAS CREADAS:');
    tablas.rows.forEach(t => {
      console.log(`  • ${t.table_name}`);
    });
    
    // Verificar vistas
    const vistas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'VIEW'
      ORDER BY table_name
    `);
    
    console.log('\n📋 VISTAS CREADAS:');
    vistas.rows.forEach(v => {
      console.log(`  • ${v.table_name}`);
    });
    
    // Datos en cada tabla
    console.log('\n📈 DATOS INICIALES:');
    
    const oficinas = await client.query('SELECT COUNT(*) as total FROM oficina');
    console.log(`  • OFICINA: ${oficinas.rows[0].total} registros`);
    
    const series = await client.query('SELECT COUNT(*) as total FROM serie');
    console.log(`  • SERIE: ${series.rows[0].total} registros`);
    
    const subseries = await client.query('SELECT COUNT(*) as total FROM subserie');
    console.log(`  • SUBSERIE: ${subseries.rows[0].total} registros`);
    
    const tipos = await client.query('SELECT COUNT(*) as total FROM tipo_documental');
    console.log(`  • TIPO_DOCUMENTAL: ${tipos.rows[0].total} registros`);
    
    const disposiciones = await client.query('SELECT COUNT(*) as total FROM disposicion_final');
    console.log(`  • DISPOSICION_FINAL: ${disposiciones.rows[0].total} registros`);
    
    // Mostrar oficina
    console.log('\n🏢 OFICINA:');
    const oficina = await client.query('SELECT * FROM oficina');
    oficina.rows.forEach(o => {
      console.log(`  • Código: ${o.codigo_oficina} | ${o.nombre_oficina}`);
    });
    
    // Mostrar series
    console.log('\n📚 SERIES:');
    const seriesData = await client.query('SELECT codigo_serie, nombre_serie FROM serie ORDER BY id_serie');
    seriesData.rows.forEach(s => {
      console.log(`  • ${s.codigo_serie}: ${s.nombre_serie}`);
    });
    
    console.log('\n✓✓✓ BD SGDEA verificada correctamente ✓✓✓\n');
    
    await client.end();
    process.exit(0);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

verificarSGDEA();
