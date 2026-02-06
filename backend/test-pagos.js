const { executeQuery } = require('./config/database');

async function testPagos() {
  try {
    console.log('🔍 Probando endpoint de pagos...\n');

    // Usuario de prueba: 20174737127
    const clienteId = 14; // ID del usuario FURBATTO DARIO
    
    console.log(`📋 Buscando pagos para clienteId: ${clienteId}\n`);

    const query = `
      SELECT 
        p.fechaRecep AS fecha, 
        CASE p.tipoMedioPagoId
          WHEN 1 THEN 'Efectivo'
          WHEN 2 THEN 'Transferencia'
          WHEN 3 THEN 'Cheque'
          WHEN 4 THEN 'Tarjeta'
          ELSE CONCAT('Medio Pago #', p.tipoMedioPagoId)
        END AS medio_pago,
        p.importe, 
        p.receptor 
      FROM pagos p 
      WHERE p.clienteId = ? 
      ORDER BY p.fechaRecep DESC, p.id DESC 
      LIMIT 5
    `;

    const rows = await executeQuery(query, [clienteId]);

    console.log('✅ Query ejecutada exitosamente');
    console.log(`📊 Pagos encontrados: ${rows.length}\n`);

    if (rows.length > 0) {
      console.log('Pagos:');
      rows.forEach((pago, idx) => {
        console.log(`\n${idx + 1}. Pago:`);
        console.log(`   Fecha: ${pago.fecha}`);
        console.log(`   Medio de pago: ${pago.medio_pago}`);
        console.log(`   Importe: $${pago.importe}`);
        console.log(`   Receptor: ${pago.receptor}`);
      });
    } else {
      console.log('⚠️  No se encontraron pagos para este cliente');
      
      // Verificar si existen pagos en general
      const totalPagos = await executeQuery('SELECT COUNT(*) as total FROM pagos');
      console.log(`\n📊 Total de pagos en la base de datos: ${totalPagos[0].total}`);
      
      // Verificar si existe el cliente
      const cliente = await executeQuery('SELECT id, cliRazonSocial FROM clientes WHERE id = ?', [clienteId]);
      if (cliente.length > 0) {
        console.log(`✅ Cliente existe: ${cliente[0].cliRazonSocial}`);
      } else {
        console.log('❌ Cliente no encontrado');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testPagos();
