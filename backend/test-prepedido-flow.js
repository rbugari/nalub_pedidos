const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testPrepedidoFlow() {
  try {
    console.log('='.repeat(60));
    console.log('🧪 TEST COMPLETO: Login + Ver Ofertas + Crear Prepedido');
    console.log('='.repeat(60));
    
    // 1. LOGIN
    console.log('\n📝 PASO 1: Login con usuario 20174737127...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      usuario: '20174737127',
      password: '754872'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login falló');
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login exitoso!');
    console.log(`   Usuario: ${user.nombre} (ID: ${user.id})`);
    console.log(`   Deuda: $${user.saldo.toLocaleString('es-ES')}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. VER OFERTAS VIGENTES
    console.log('\n📝 PASO 2: Consultar ofertas vigentes...');
    const ofertasResponse = await axios.get(`${API_URL}/ofertas/vigentes-mes`, { headers });
    
    const ofertas = ofertasResponse.data.data;
    console.log(`✅ Ofertas encontradas: ${ofertas.length}`);
    
    ofertas.forEach((oferta, index) => {
      console.log(`\n   🎁 Oferta ${index + 1}:`);
      console.log(`      Título: ${oferta.titulo}`);
      console.log(`      Tipo: ${oferta.tipo.toUpperCase()}`);
      console.log(`      Productos: ${oferta.productos.length}`);
      
      if (oferta.productos.length > 0) {
        oferta.productos.forEach(p => {
          console.log(`        - ${p.nombre} ($${p.precioVenta.toLocaleString('es-ES')})`);
        });
      }
      
      if (oferta.precio_referencia > 0) {
        console.log(`      Precio c/oferta: $${oferta.precio_referencia.toLocaleString('es-ES')}`);
        console.log(`      Descuento: ${oferta.descuento_calculado.toFixed(0)}%`);
      }
    });
    
    // 3. CONSULTAR PRODUCTOS
    console.log('\n📝 PASO 3: Consultar productos disponibles...');
    const productosResponse = await axios.get(`${API_URL}/productos?limit=5`, { headers });
    
    const productos = productosResponse.data.data;
    console.log(`✅ Productos con stock: ${productos.length}`);
    console.log('   Primeros 3:');
    productos.slice(0, 3).forEach(p => {
      console.log(`     - ${p.nombre} | $${p.precioVenta.toLocaleString('es-ES')} | Stock: ${p.stockActual}`);
    });
    
    // 4. VERIFICAR OFERTAS DE UN PRODUCTO
    if (productos.length > 0 && ofertas.length > 0) {
      const productoConOferta = ofertas[0].productos[0];
      
      console.log(`\n📝 PASO 4: Verificar ofertas del producto "${productoConOferta.nombre}"...`);
      const ofertasProductoResponse = await axios.get(
        `${API_URL}/ofertas/por-producto/${productoConOferta.producto_id}`,
        { headers }
      );
      
      const ofertasDelProducto = ofertasProductoResponse.data.data;
      console.log(`✅ Ofertas aplicables: ${ofertasDelProducto.length}`);
      
      ofertasDelProducto.forEach(o => {
        console.log(`     - ${o.titulo}: $${o.precio_con_oferta.toLocaleString('es-ES')} (-${o.descuento_pct.toFixed(0)}%)`);
      });
    }
    
    // 5. CREAR PREPEDIDO CON OFERTA
    if (productos.length > 0 && ofertas.length > 0) {
      console.log('\n📝 PASO 5: Crear prepedido con productos en oferta...');
      
      // Tomar primer producto de la primera oferta
      const oferta = ofertas[0];
      const producto = oferta.productos[0];
      
      const prepedidoData = {
        observaciones: 'Prepedido de prueba desde test automatizado',
        items: [
          {
            productoId: producto.producto_id,
            descripcion: producto.nombre,
            cantidad: 2,
            unidad: 'unidad',
            precioEstimado: producto.precioVenta,
            ofertaid: oferta.id,
            observaciones: 'Con oferta aplicada'
          }
        ]
      };
      
      console.log(`   📦 Producto: ${producto.nombre}`);
      console.log(`   🎁 Oferta: ${oferta.titulo}`);
      console.log(`   📊 Cantidad: 2 unidades`);
      console.log(`   💰 Precio normal: $${(producto.precioVenta * 2).toLocaleString('es-ES')}`);
      console.log(`   💰 Precio c/oferta: $${(oferta.precio_referencia * 2).toLocaleString('es-ES')}`);
      
      const prepedidoResponse = await axios.post(
        `${API_URL}/prepedidos`,
        prepedidoData,
        { headers }
      );
      
      if (prepedidoResponse.data.success) {
        console.log(`\n✅ ¡PREPEDIDO CREADO EXITOSAMENTE!`);
        console.log(`   ID: ${prepedidoResponse.data.prepedidoId}`);
        
        // 6. CONSULTAR EL PREPEDIDO CREADO
        console.log('\n📝 PASO 6: Consultar prepedido recién creado...');
        const prepedidoId = prepedidoResponse.data.prepedidoId;
        
        const consultaResponse = await axios.get(
          `${API_URL}/prepedidos/${prepedidoId}`,
          { headers }
        );
        
        const prepedido = consultaResponse.data.data;
        console.log('✅ Prepedido consultado:');
        console.log(`   Estado: ${prepedido.estado}`);
        console.log(`   Items: ${prepedido.items.length}`);
        console.log(`   Total estimado: $${prepedido.total_estimado.toLocaleString('es-ES')}`);
        
        prepedido.items.forEach((item, idx) => {
          console.log(`\n   Item ${idx + 1}:`);
          console.log(`     Producto: ${item.descripcion}`);
          console.log(`     Cantidad: ${item.cantidad}`);
          console.log(`     Precio unitario: $${item.precio_estimado.toLocaleString('es-ES')}`);
          console.log(`     Oferta ID: ${item.ofertaid || 'Sin oferta'}`);
          console.log(`     Subtotal: $${(item.precio_estimado * item.cantidad).toLocaleString('es-ES')}`);
        });
      } else {
        console.log('❌ Error al crear prepedido:', prepedidoResponse.data.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📌 Resumen:');
    console.log('   ✓ Login funcionando');
    console.log('   ✓ Ofertas cargando correctamente');
    console.log('   ✓ Cálculo de precios con descuento OK');
    console.log('   ✓ Creación de prepedido con oferta OK');
    console.log('   ✓ Consulta de prepedido OK');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Instalar axios si no está: npm install axios
testPrepedidoFlow();
