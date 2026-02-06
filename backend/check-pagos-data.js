const { executeQuery } = require('./config/database');

async function checkPagosData() {
  try {
    console.log('🔍 Verificando datos en tabla pagos...\n');

    // Ver datos de ejemplo
    const pagos = await executeQuery(`
      SELECT * FROM pagos LIMIT 10
    `);

    console.log(`📊 Total pagos encontrados (primeros 10):\n`);
    if (pagos.length > 0) {
      pagos.forEach((pago, idx) => {
        console.log(`${idx + 1}. ID: ${pago.id}`);
        console.log(`   Cliente ID: ${pago.clienteId}`);
        console.log(`   Tipo Medio Pago ID: ${pago.tipoMedioPagoId}`);
        console.log(`   Fecha: ${pago.fechaRecep}`);
        console.log(`   Importe: $${pago.importe}`);
        console.log(`   Receptor: ${pago.receptor}\n`);
      });

      // Ver qué IDs distintos de tipoMedioPagoId existen
      const tiposPago = await executeQuery(`
        SELECT DISTINCT tipoMedioPagoId FROM pagos ORDER BY tipoMedioPagoId
      `);
      
      console.log('IDs de tipo medio pago usados:');
      tiposPago.forEach(t => {
        console.log(`  - ID: ${t.tipoMedioPagoId}`);
      });
    } else {
      console.log('⚠️  No hay datos en la tabla pagos');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPagosData();
