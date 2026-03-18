/**
 * Script para crear tabla OFICINA en BD SGDEA
 */

const { Client } = require('pg');

async function crearOficinaEnSGDEA() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'daloce05',
    database: 'SGDEA'  // BD correcta
  });

  try {
    await client.connect();
    console.log('✓ Conectado a BD: SGDEA');
    
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
    console.log('✓ Tabla OFICINA creada en SGDEA');
    
    // Crear índice
    try {
      await client.query('CREATE INDEX idx_oficina_codigo ON oficina(codigo_oficina)');
      console.log('✓ Índice creado');
    } catch (err) {
      console.log('✓ Índice ya existe');
    }
    
    // Insertar datos iniciales
    const insert = `
      INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
      VALUES ('144', 'Dirección de Archivo', 'Entidad Principal', TRUE)
      ON CONFLICT (codigo_oficina) DO NOTHING
    `;
    
    await client.query(insert);
    console.log('✓ Datos iniciales insertados');
    
    // Verificar
    const verify = await client.query('SELECT * FROM oficina');
    console.log(`\n✓ Total de oficinas: ${verify.rows.length}`);
    verify.rows.forEach(o => {
      console.log(`  • ID: ${o.id_oficina} | Código: ${o.codigo_oficina} | ${o.nombre_oficina}`);
    });
    
    await client.end();
    console.log('\n✓✓✓ Tabla OFICINA lista en BD SGDEA ✓✓✓\n');
    process.exit(0);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

crearOficinaEnSGDEA();
