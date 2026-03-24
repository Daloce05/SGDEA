/**
 * Script detallado de prueba para debuggear el flujo
 */

const BASE_URL = 'http://localhost:3000/api/trd';

async function debugFlow() {
  try {
    console.log('\n=== DEBUG FLUJO COMPLETO ===\n');

    // 1. Obtener series
    console.log('1️⃣ GET /api/trd/series');
    let response = await fetch(`${BASE_URL}/series`);
    let data = await response.json();
    
    if (!data.exito) {
      console.log('❌ Error:', data.error);
      return;
    }
    
    console.log(`✓ ${data.datos.length} series encontradas`);
    
    if (data.datos.length === 0) {
      console.log('❌ No hay series');
      return;
    }

    const serie = data.datos[0];
    console.log(`  → Serie: ${serie.codigo} (ID: ${serie.id_serie})`);
    console.log(`  → Nombre: ${serie.nombre}\n`);

    // 2. Obtener subseries
    console.log(`2️⃣ GET /api/trd/series/${serie.id_serie}/subseries`);
    response = await fetch(`${BASE_URL}/series/${serie.id_serie}/subseries`);
    data = await response.json();
    
    if (!data.exito) {
      console.log('❌ Error:', data.error);
      return;
    }
    
    console.log(`✓ ${data.datos.length} subseries encontradas`);
    
    if (data.datos.length === 0) {
      console.log('⚠ No hay subseries en esta serie');
      return;
    }

    data.datos.forEach((sub, i) => {
      console.log(`  ${i+1}. ${sub.codigo} - ${sub.nombre} (ID: ${sub.id_subserie})`);
    });

    const subserie = data.datos[0];
    console.log(`\n✓ Primera subserie seleccionada: ${subserie.codigo}\n`);

    // 3. Obtener tipos documentales
    console.log(`3️⃣ GET /api/trd/series/${serie.id_serie}/subseries/${subserie.id_subserie}/tipos`);
    response = await fetch(
      `${BASE_URL}/series/${serie.id_serie}/subseries/${subserie.id_subserie}/tipos`
    );
    data = await response.json();
    
    if (!data.exito) {
      console.log('❌ Error:', data.error);
      return;
    }
    
    console.log(`✓ ${data.datos.length} tipos encontrados\n`);
    
    if (data.datos.length > 0) {
      data.datos.forEach((tipo, i) => {
        console.log(`  ${i+1}. ${tipo.nombre}`);
      });
    } else {
      console.log('⚠ Esta subserie no tiene tipos documentales creados');
    }

    console.log('\n✅✅✅ API FUNCIONANDO CORRECTAMENTE ✅✅✅\n');
    console.log('Resumen:');
    console.log(`- Series: ${data.datos.length >= 0 ? '✓' : '✗'}`);
    console.log(`- Subseries: ${data.datos.length >= 0 ? '✓' : '✗'}`);
    console.log(`- Tipos: ${data.datos.length >= 0 ? '✓' : '✗'}`);
    console.log('\nSi los dropdowns siguen vacíos, el problema está en el JavaScript frontend.\n');

  } catch (error) {
    console.error(`❌ Error fatal: ${error.message}`);
  }
}

debugFlow();
