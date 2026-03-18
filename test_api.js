/**
 * Script de prueba: Verificar que subseries y tipos cargan correctamente
 */

const BASE_URL = 'http://localhost:3000/api/trd';

async function testAPI() {
  try {
    console.log('\n=== PRUEBA DE API TRD ===\n');

    // 1. Obtener series
    console.log('1. Obteniendo series...');
    let response = await fetch(`${BASE_URL}/series`);
    let data = await response.json();
    console.log(`✓ Series obtenidas: ${data.datos.length}`);
    
    if (data.datos.length === 0) {
      console.log('✗ No hay series en la BD');
      return;
    }

    const primeaSerie = data.datos[0];
    console.log(`  • Serie: ${primeaSerie.codigo} - ${primeaSerie.nombre}`);
    console.log(`  • ID: ${primeaSerie.id_serie}\n`);

    // 2. Obtener subseries de la primera serie
    console.log(`2. Obteniendo subseries de serie ${primeaSerie.id_serie}...`);
    response = await fetch(`${BASE_URL}/series/${primeaSerie.id_serie}/subseries`);
    data = await response.json();
    
    if (!data.exito) {
      console.log(`✗ Error: ${data.error}`);
      return;
    }

    console.log(`✓ Subseries obtenidas: ${data.datos.length}`);
    
    if (data.datos.length === 0) {
      console.log('✗ No hay subseries en esta serie');
      return;
    }

    data.datos.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.codigo} - ${sub.nombre} (ID: ${sub.id_subserie})`);
    });

    const primerSubserie = data.datos[0];
    console.log(`\n3. Obteniendo tipos de subserie ${primerSubserie.id_subserie}...`);

    // 3. Obtener tipos de la primera subserie
    response = await fetch(
      `${BASE_URL}/series/${primeaSerie.id_serie}/subseries/${primerSubserie.id_subserie}/tipos`
    );
    data = await response.json();
    
    if (!data.exito) {
      console.log(`✗ Error: ${data.error}`);
      return;
    }

    console.log(`✓ Tipos obtenidos: ${data.datos.length}`);
    
    if (data.datos.length === 0) {
      console.log('⚠ No hay tipos en esta subserie (esperado si aún no hay datos)');
    } else {
      data.datos.forEach((tipo, i) => {
        console.log(`  ${i + 1}. ${tipo.nombre}`);
      });
    }

    console.log('\n✓✓✓ API funcionando correctamente ✓✓✓\n');

  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
}

testAPI();
