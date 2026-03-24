/**
 * Script para insertar dados de prueba en TIPOS DOCUMENTALES
 * Agrega tipos documentales a las subseries existentes
 */

const { pool } = require('./config/postgresqlTRD');

async function insertarTiposDocumentales() {
    console.log('📊 Iniciando inserción de tipos documentales de prueba...\n');

    try {
        // 1. Obtener subseries existentes
        console.log('1️⃣ Obteniendo subseries existentes...\n');
        const subseriesResult = await pool.query(
            `SELECT id_subserie, codigo, nombre FROM subserie WHERE activa = true ORDER BY id_subserie`
        );

        const subseries = subseriesResult.rows;
        console.log(`Encontradas ${subseries.length} subseries:\n`);
        subseries.forEach((sub, idx) => {
            console.log(`  ${idx + 1}. [${sub.codigo}] ${sub.nombre} (ID: ${sub.id_subserie})`);
        });
        console.log('');

        if (subseries.length === 0) {
            console.error('❌ No hay subseries disponibles. Ejecuta primero la inicialización de BD');
            process.exit(1);
        }

        // 2. Insertar tipos documentales para cada subserie
        console.log('2️⃣ Creando tipos documentales...\n');

        const tiposTemplate = [
            { nombre: 'Documento Tipo A', descripcion: 'Documento tipo A de la subserie' },
            { nombre: 'Documento Tipo B', descripcion: 'Documento tipo B de la subserie' },
            { nombre: 'Documento Tipo C', descripcion: 'Documento tipo C de la subserie' }
        ];

        let totalInsertados = 0;

        for (const subserie of subseries) {
            console.log(`📂 Subserie: ${subserie.nombre}`);

            for (let i = 0; i < tiposTemplate.length; i++) {
                const codigo = `${subserie.codigo}.${i + 1}`;
                const { nombre, descripcion } = tiposTemplate[i];

                try {
                    const result = await pool.query(
                        `INSERT INTO tipo_documental (id_subserie, codigo, nombre, descripcion, activo)
                         VALUES ($1, $2, $3, $4, true)
                         ON CONFLICT (id_tipo_documental) DO NOTHING
                         RETURNING id_tipo`,
                        [subserie.id_subserie, codigo, nombre, descripcion]
                    );

                    if (result.rows.length > 0) {
                        console.log(`  ✓ ${nombre} (${codigo}) - ID: ${result.rows[0].id_tipo}`);
                        totalInsertados++;
                    } else {
                        console.log(`  ℹ️ ${nombre} - Ya existe`);
                    }
                } catch (error) {
                    console.error(`  ❌ Error inserting ${nombre}:`, error.message);
                }
            }
            console.log('');
        }

        // 3. Verificar totales
        console.log('3️⃣ Verificando datos...\n');

        const verificarTipos = await pool.query(
            `SELECT COUNT(*) as total FROM tipo_documental WHERE activo = true`
        );
        console.log(`📊 Tipos documentales activos en total: ${verificarTipos.rows[0].total}`);

        const verificarSubseries = await pool.query(
            `SELECT subserie.id_subserie, subserie.nombre, COUNT(tipo_documental.id_tipo) as total_tipos
             FROM subserie
             LEFT JOIN tipo_documental ON subserie.id_subserie = tipo_documental.id_subserie
             WHERE subserie.activa = true
             GROUP BY subserie.id_subserie, subserie.nombre
             ORDER BY subserie.id_subserie`
        );

        console.log('\n📋 Tipos por subserie:\n');
        verificarSubseries.rows.forEach(row => {
            console.log(`  [${row.id_subserie}] ${row.nombre}: ${row.total_tipos} tipos`);
        });

        console.log(`\n✅ ¡${totalInsertados} tipos documentales insertados exitosamente!`);
        console.log('📞 Recarga el navegador para ver los cambios.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar
insertarTiposDocumentales();

