const axios = require('axios');

async function testPagosEndpoint() {
  try {
    console.log('🔍 Probando endpoint de pagos...\n');

    // Primero hacer login
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      usuario: '20174737127',
      password: '754872'
    });

    console.log('📋 Respuesta de login:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('🔑 Token extraído:', token);
    console.log('✅ Login exitoso, token obtenido\n');

    // Ahora llamar al endpoint de pagos
    console.log('2️⃣ Llamando al endpoint de pagos...');
    const pagosResponse = await axios.get('http://localhost:3001/api/pagos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Respuesta recibida:');
    console.log('Status:', pagosResponse.status);
    console.log('Success:', pagosResponse.data.success);
    console.log('Total pagos:', pagosResponse.data.data?.length || 0);
    
    if (pagosResponse.data.data && pagosResponse.data.data.length > 0) {
      console.log('\n📋 Pagos recibidos:');
      pagosResponse.data.data.forEach((pago, idx) => {
        console.log(`\n${idx + 1}. Pago:`);
        console.log(`   Fecha: ${pago.fecha}`);
        console.log(`   Medio: ${pago.medio_pago}`);
        console.log(`   Importe: $${pago.importe}`);
        console.log(`   Receptor: ${pago.receptor}`);
      });
    }

    console.log('\n✅ Test completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en el test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('¿Está el backend corriendo en http://localhost:3001?');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testPagosEndpoint();
