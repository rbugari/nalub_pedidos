const axios = require('axios');

async function testDashboard() {
    try {
        console.log('=== TEST DASHBOARD ===\n');

        // Paso 1: Login
        console.log('PASO 1: Login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            usuario: '20174737127',
            password: '754872'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login falló');
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Login exitoso\n');

        // Headers con autenticación
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        // Paso 2: Obtener datos del dashboard
        console.log('PASO 2: Obtener datos del dashboard...');
        const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard', config);
        
        if (dashboardResponse.data.success) {
            console.log('✅ Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
        } else {
            console.log('❌ Error en dashboard:', dashboardResponse.data);
        }

        // Paso 3: Obtener ofertas destacadas
        console.log('\nPASO 3: Obtener ofertas destacadas...');
        const ofertasResponse = await axios.get('http://localhost:3001/api/dashboard/ofertas-destacadas', config);
        
        if (ofertasResponse.data.success) {
            console.log('✅ Ofertas destacadas (', ofertasResponse.data.data.length, '):', JSON.stringify(ofertasResponse.data.data, null, 2));
        } else {
            console.log('❌ Error en ofertas:', ofertasResponse.data);
        }

        console.log('\n✅ TESTS COMPLETADOS');

    } catch (error) {
        console.error('❌ Error en test:', error.response?.data || error.message);
    }
}

testDashboard();
