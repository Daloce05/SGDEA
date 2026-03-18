/**
 * Script para inicializar BD SGDEA con esquema completo TRD
 */

const { Client } = require('pg');

async function inicializarSGDEA() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'daloce05',
    database: 'SGDEA'
  });

  try {
    await client.connect();
    console.log('✓ Conectado a BD: SGDEA');
    
    // Limpiar tablas existentes
    console.log('\n→ Verificando tablas existentes...');
    
    // DROP con CASCADE para eliminar dependencias
    const dropTablas = `
      DROP TABLE IF EXISTS auditoria_trd CASCADE;
      DROP TABLE IF EXISTS disposicion_final CASCADE;
      DROP TABLE IF EXISTS archivo CASCADE;
      DROP TABLE IF EXISTS tipo_documental CASCADE;
      DROP TABLE IF EXISTS subserie CASCADE;
      DROP TABLE IF EXISTS serie CASCADE;
      DROP TABLE IF EXISTS oficina CASCADE;
      DROP VIEW IF EXISTS vista_jerarquia CASCADE;
      DROP VIEW IF EXISTS vista_archivos_disposicion CASCADE;
    `;
    
    const sentencias = dropTablas.split(';').filter(s => s.trim());
    for (const sentencia of sentencias) {
      try {
        await client.query(sentencia);
      } catch (err) {
        // Ignorar si no existen
      }
    }
    console.log('✓ Tablas/vistas antiguas eliminadas');

    // Crear tabla OFICINA
    const createOficina = `
      CREATE TABLE oficina (
        id_oficina          SERIAL PRIMARY KEY,
        codigo_oficina      VARCHAR(10) NOT NULL UNIQUE,
        nombre_oficina      VARCHAR(150) NOT NULL,
        dependencia         VARCHAR(150),
        activa              BOOLEAN DEFAULT TRUE,
        fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_oficina_codigo ON oficina(codigo_oficina);
    `;
    await client.query(createOficina);
    console.log('✓ Tabla OFICINA creada');

    // Crear tabla SERIE (nivel 1)
    const createSerie = `
      CREATE TABLE serie (
        id_serie           SERIAL PRIMARY KEY,
        id_oficina         INTEGER NOT NULL,
        codigo_serie       VARCHAR(20) NOT NULL,
        nombre_serie       VARCHAR(150) NOT NULL,
        descripcion        TEXT,
        activa             BOOLEAN DEFAULT TRUE,
        fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_oficina) REFERENCES oficina(id_oficina) ON DELETE CASCADE,
        UNIQUE(id_oficina, codigo_serie)
      );
      CREATE INDEX idx_serie_oficina ON serie(id_oficina);
      CREATE INDEX idx_serie_codigo ON serie(codigo_serie);
    `;
    await client.query(createSerie);
    console.log('✓ Tabla SERIE creada');

    // Crear tabla SUBSERIE (nivel 2)
    const createSubserie = `
      CREATE TABLE subserie (
        id_subserie        SERIAL PRIMARY KEY,
        id_serie           INTEGER NOT NULL,
        codigo_subserie    VARCHAR(20) NOT NULL,
        nombre_subserie    VARCHAR(150) NOT NULL,
        descripcion        TEXT,
        activa             BOOLEAN DEFAULT TRUE,
        fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_serie) REFERENCES serie(id_serie) ON DELETE CASCADE,
        UNIQUE(id_serie, codigo_subserie)
      );
      CREATE INDEX idx_subserie_serie ON subserie(id_serie);
      CREATE INDEX idx_subserie_codigo ON subserie(codigo_subserie);
    `;
    await client.query(createSubserie);
    console.log('✓ Tabla SUBSERIE creada');

    // Crear tabla TIPO_DOCUMENTAL (nivel 3)
    const createTipoDocumental = `
      CREATE TABLE tipo_documental (
        id_tipo_documental  SERIAL PRIMARY KEY,
        id_subserie         INTEGER NOT NULL,
        codigo_tipo         VARCHAR(20) NOT NULL,
        nombre_tipo         VARCHAR(150) NOT NULL,
        descripcion         TEXT,
        archivo_retention   INTEGER DEFAULT 5,
        activa              BOOLEAN DEFAULT TRUE,
        fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_subserie) REFERENCES subserie(id_subserie) ON DELETE CASCADE,
        UNIQUE(id_subserie, codigo_tipo)
      );
      CREATE INDEX idx_tipo_documental_subserie ON tipo_documental(id_subserie);
      CREATE INDEX idx_tipo_documental_codigo ON tipo_documental(codigo_tipo);
    `;
    await client.query(createTipoDocumental);
    console.log('✓ Tabla TIPO_DOCUMENTAL creada');

    // Crear tabla DISPOSICION_FINAL
    const createDisposicion = `
      CREATE TABLE disposicion_final (
        id_disposicion      SERIAL PRIMARY KEY,
        nombre_disposicion  VARCHAR(100) NOT NULL,
        descripcion         TEXT,
        anos_retension      INTEGER NOT NULL,
        fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activa              BOOLEAN DEFAULT TRUE
      );
    `;
    await client.query(createDisposicion);
    console.log('✓ Tabla DISPOSICION_FINAL creada');

    // Crear tabla ARCHIVO (nivel 4 - documentos)
    const createArchivo = `
      CREATE TABLE archivo (
        id_archivo          SERIAL PRIMARY KEY,
        id_tipo_documental  INTEGER NOT NULL,
        id_disposicion      INTEGER,
        codigo_archivo      VARCHAR(30) NOT NULL UNIQUE,
        titulo_archivo      VARCHAR(255) NOT NULL,
        descripcion         TEXT,
        contenido           TEXT,
        ruta_archivo        VARCHAR(500),
        tamanio_archivo     BIGINT,
        tipo_mime           VARCHAR(100),
        fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_disposicion   TIMESTAMP,
        estado              VARCHAR(20) DEFAULT 'vigente',
        confidencial        BOOLEAN DEFAULT FALSE,
        activo              BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (id_tipo_documental) REFERENCES tipo_documental(id_tipo_documental) ON DELETE CASCADE,
        FOREIGN KEY (id_disposicion) REFERENCES disposicion_final(id_disposicion) ON DELETE SET NULL
      );
      CREATE INDEX idx_archivo_tipo ON archivo(id_tipo_documental);
      CREATE INDEX idx_archivo_codigo ON archivo(codigo_archivo);
      CREATE INDEX idx_archivo_estado ON archivo(estado);
    `;
    await client.query(createArchivo);
    console.log('✓ Tabla ARCHIVO creada');

    // Crear tabla AUDITORIA_TRD
    const createAuditoria = `
      CREATE TABLE auditoria_trd (
        id_auditoria        SERIAL PRIMARY KEY,
        tabla_afectada      VARCHAR(50) NOT NULL,
        id_registro         INTEGER,
        tipo_operacion      VARCHAR(20) NOT NULL,
        usuario             VARCHAR(100),
        valor_anterior      TEXT,
        valor_nuevo         TEXT,
        fecha_operacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        direccion_ip        VARCHAR(50),
        navegador           VARCHAR(200)
      );
      CREATE INDEX idx_auditoria_tabla ON auditoria_trd(tabla_afectada);
      CREATE INDEX idx_auditoria_fecha ON auditoria_trd(fecha_operacion);
    `;
    await client.query(createAuditoria);
    console.log('✓ Tabla AUDITORIA_TRD creada');

    // Crear vistas
    const createVistas = `
      -- Vista de jerarquía completa
      CREATE VIEW vista_jerarquia AS
      SELECT
        o.id_oficina,
        o.codigo_oficina,
        o.nombre_oficina,
        s.id_serie,
        s.codigo_serie,
        s.nombre_serie,
        sb.id_subserie,
        sb.codigo_subserie,
        sb.nombre_subserie,
        td.id_tipo_documental,
        td.codigo_tipo,
        td.nombre_tipo
      FROM oficina o
      LEFT JOIN serie s ON o.id_oficina = s.id_oficina
      LEFT JOIN subserie sb ON s.id_serie = sb.id_serie
      LEFT JOIN tipo_documental td ON sb.id_subserie = td.id_subserie
      WHERE o.activa = TRUE AND (s.activa IS NULL OR s.activa = TRUE)
        AND (sb.activa IS NULL OR sb.activa = TRUE)
        AND (td.activa IS NULL OR td.activa = TRUE);

      -- Vista de archivos con disposición
      CREATE VIEW vista_archivos_disposicion AS
      SELECT
        a.id_archivo,
        a.codigo_archivo,
        a.titulo_archivo,
        td.nombre_tipo,
        sb.nombre_subserie,
        s.nombre_serie,
        df.nombre_disposicion,
        a.fecha_creacion,
        a.fecha_disposicion,
        a.estado,
        CASE 
          WHEN df.anos_retension IS NOT NULL 
          THEN a.fecha_creacion + (df.anos_retension || ' years')::INTERVAL
          ELSE NULL
        END as fecha_expiracion
      FROM archivo a
      JOIN tipo_documental td ON a.id_tipo_documental = td.id_tipo_documental
      JOIN subserie sb ON td.id_subserie = sb.id_subserie
      JOIN serie s ON sb.id_serie = s.id_serie
      LEFT JOIN disposicion_final df ON a.id_disposicion = df.id_disposicion
      WHERE a.activo = TRUE;
    `;
    await client.query(createVistas);
    console.log('✓ Vistas creadas');

    // Insertar datos iniciales
    console.log('\n→ Insertando datos iniciales...');
    
    // Disposiciones
    await client.query(`
      INSERT INTO disposicion_final (nombre_disposicion, descripcion, anos_retension, activa)
      VALUES
        ('Destrucción', 'Destrucción después de retención', 5, TRUE),
        ('Archivo Permanente', 'Conservación permanente', 999, TRUE),
        ('Devolución', 'Devolución al remitente', 3, TRUE),
        ('Transferencia', 'Transferencia a archivo intermedio', 2, TRUE)
    `);
    console.log('✓ Disposiciones iniciales');

    // Oficina
    await client.query(`
      INSERT INTO oficina (codigo_oficina, nombre_oficina, dependencia, activa)
      VALUES ('144', 'Dirección de Archivo', 'Entidad Principal', TRUE)
    `);
    console.log('✓ Oficina inicial');

    // Series
    const seriesResult = await client.query(`
      INSERT INTO serie (id_oficina, codigo_serie, nombre_serie, descripcion, activa)
      VALUES
        (1, 'SER-001', 'Correspondencia General', 'Correspondencia entrada y salida', TRUE),
        (1, 'SER-002', 'Contratos', 'Contratos y acuerdos', TRUE),
        (1, 'SER-003', 'Recursos Humanos', 'Documentos de personal', TRUE),
        (1, 'SER-004', 'Finanzas', 'Documentos contables y financieros', TRUE),
        (1, 'SER-005', 'Administrativa', 'Documentos administrativos varios', TRUE),
        (1, 'SER-006', 'Auditoría', 'Reportes y auditorías', TRUE)
      RETURNING id_serie
    `);
    console.log('✓ 6 Series iniciales');

    // Subseries - ejemplo para primera serie
    await client.query(`
      INSERT INTO subserie (id_serie, codigo_subserie, nombre_subserie, descripcion, activa)
      VALUES
        (1, 'SUB-001-001', 'Correspondencia Entrada', 'Cartas recibidas', TRUE),
        (1, 'SUB-001-002', 'Correspondencia Salida', 'Cartas enviadas', TRUE),
        (2, 'SUB-002-001', 'Contratos Vigentes', 'Contratos activos', TRUE),
        (3, 'SUB-003-001', 'Nómina', 'Documentos de nómina', TRUE),
        (4, 'SUB-004-001', 'Facturas', 'Facturas emitidas y recibidas', TRUE),
        (5, 'SUB-005-001', 'Resoluciones', 'Resoluciones de directorio', TRUE),
        (6, 'SUB-006-001', 'Auditoría Interna', 'Reportes de auditoría', TRUE)
    `);
    console.log('✓ 7 Subseries iniciales');

    // Tipos Documentales
    await client.query(`
      INSERT INTO tipo_documental (id_subserie, codigo_tipo, nombre_tipo, descripcion, archivo_retention)
      VALUES
        (1, 'TIPO-001-001-001', 'Cartas Comerciales', 'Cartas de negocios', 5),
        (1, 'TIPO-001-001-002', 'Cartas Oficiales', 'Correspondencia oficial', 10),
        (2, 'TIPO-001-002-001', 'Cartas de Respuesta', 'Respuestas a consultas', 5),
        (3, 'TIPO-002-001-001', 'Contratos Principales', 'Contratos mayores a 100M', 20),
        (3, 'TIPO-002-001-002', 'Contratos Menores', 'Contratos menores a 100M', 10),
        (4, 'TIPO-003-001-001', 'Planillas de Nómina', 'Registros de sueldos', 7),
        (5, 'TIPO-004-001-001', 'Facturas Emitidas', 'Facturas de venta', 6),
        (5, 'TIPO-004-001-002', 'Facturas Recibidas', 'Facturas de compra', 6),
        (6, 'TIPO-005-001-001', 'Resoluciones de Directorio', 'Decisiones directivas', 15),
        (7, 'TIPO-006-001-001', 'Reportes de Auditoría', 'Informes de auditoría', 10)
    `);
    console.log('✓ Tipos Documentales iniciales');

    // Verificar
    const count1 = await client.query('SELECT COUNT(*) FROM oficina');
    const count2 = await client.query('SELECT COUNT(*) FROM serie');
    const count3 = await client.query('SELECT COUNT(*) FROM subserie');
    const count4 = await client.query('SELECT COUNT(*) FROM tipo_documental');
    const count5 = await client.query('SELECT COUNT(*) FROM disposicion_final');

    console.log(`\n✓ Total Oficinas: ${count1.rows[0].count}`);
    console.log(`✓ Total Series: ${count2.rows[0].count}`);
    console.log(`✓ Total Subseries: ${count3.rows[0].count}`);
    console.log(`✓ Total Tipos Documentales: ${count4.rows[0].count}`);
    console.log(`✓ Total Disposiciones: ${count5.rows[0].count}`);

    await client.end();
    console.log('\n✓✓✓ BD SGDEA inicializada correctamente ✓✓✓\n');
    process.exit(0);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

inicializarSGDEA();
