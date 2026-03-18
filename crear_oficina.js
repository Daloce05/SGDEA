/**
 * Script para crear la tabla OFICINA que falta
 */

require('dotenv').config();
const { Client } = require('pg');

async function crearTablaOficina() {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: 'sgdea_trd'
  });

  try {
    await client.connect();
    console.log('✓ Conectado a base de datos sgdea_trd');
    
    // Crear tabla OFICINA
    const createTable = `
      CREATE TABLE IF NOT EXISTS oficina (
        id_oficina          SERIAL PRIMARY KEY,
        codigo_oficina      VARCHAR(10) NOT NULL UNIQUE,
        nombre_oficina      VARCHAR(150) NOT NULL,
        dependencia         VARCHAR(150),
        activa              BOOLEAN DEFAULT TRUE,
        fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createTable);
    console.log('✓ Tabla OFICINA creada');
    
    // Crear índice
    try {
      await client.query('CREATE INDEX idx_oficina_codigo ON oficina(codigo_oficina)');
      console.log('✓ Índice idx_oficina_codigo creado');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✓ Índice idx_oficina_codigo ya existe');
      }
    }
    
    // Insertar datos iniciales
    const insert = `
      INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
      VALUES ('144', 'Dirección de Archivo', 'Entidad Principal', TRUE)
      ON CONFLICT (codigo_oficina) DO NOTHING
    `;
    
    const result = await client.query(insert);
    console.log('✓ Datos iniciales insertados');
    
    // Verificar
    const verify = await client.query('SELECT * FROM oficina');
    console.log(`✓ Total de oficinas: ${verify.rows.length}`);
    console.log('\nOficinas en base de datos:');
    verify.rows.forEach(o => {
      console.log(`  • ID: ${o.id_oficina} | Código: ${o.codigo_oficina} | ${o.nombre_oficina}`);
    });
    
    await client.end();
    console.log('\n✓✓✓ Tabla OFICINA creada y poblada exitosamente ✓✓✓\n');
    process.exit(0);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

crearTablaOficina();
