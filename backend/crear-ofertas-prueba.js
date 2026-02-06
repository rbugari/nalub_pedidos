const { executeQuery } = require('./config/database');

async function crearOfertasPrueba() {
  try {
    console.log('🎁 Creando ofertas de prueba...\n');
    
    // 1. Buscar productos con stock
    const productosQuery = `
      SELECT p.id, p.nombre, p.precioVenta, p.stockActual 
      FROM productos p
      WHERE p.stockActual > 0 
      ORDER BY p.precioVenta DESC
      LIMIT 10
    `;
    
    const productos = await executeQuery(productosQuery);
    console.log(`📦 Productos disponibles: ${productos.length}`);
    
    if (productos.length < 2) {
      console.log('❌ No hay suficientes productos con stock');
      process.exit(1);
    }
    
    // Mostrar productos
    productos.forEach(p => {
      console.log(`  - ${p.nombre} | $${p.precioVenta} | Stock: ${p.stockActual}`);
    });
    
    // 2. Crear Oferta Unitaria (producto más caro con descuento)
    console.log('\n📝 Creando Oferta Unitaria...');
    const producto1 = productos[0];
    const precioOferta = Math.round(producto1.precioVenta * 0.85); // 15% descuento
    
    const oferta1Query = `
      INSERT INTO ofertas 
      (titulo, descripcion, fecha_inicio, fecha_fin, tipo, modo_precio, valor_precio, activa) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    const result1 = await executeQuery(oferta1Query, [
      '🔥 Oferta Flash - ' + producto1.nombre,
      'Precio especial por tiempo limitado',
      '2026-02-01',
      '2026-02-28',
      'unitaria',
      'precio_unitario',
      precioOferta
    ]);
    
    const oferta1Id = result1.insertId;
    
    // Agregar producto a la oferta
    await executeQuery(
      'INSERT INTO ofertas_detalle (oferta_id, producto_id) VALUES (?, ?)',
      [oferta1Id, producto1.id]
    );
    
    console.log(`✅ Oferta Unitaria creada (ID: ${oferta1Id})`);
    console.log(`   ${producto1.nombre}: $${producto1.precioVenta} → $${precioOferta}`);
    
    // 3. Crear Oferta por Cantidad Mínima
    if (productos.length > 1) {
      console.log('\n📝 Creando Oferta por Cantidad Mínima...');
      const producto2 = productos[1];
      const precioMinima = Math.round(producto2.precioVenta * 0.80); // 20% descuento
      
      const oferta2Query = `
        INSERT INTO ofertas 
        (titulo, descripcion, fecha_inicio, fecha_fin, tipo, modo_precio, valor_precio, min_unidades_total, activa) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;
      
      const result2 = await executeQuery(oferta2Query, [
        '💪 Llevá 3 o más - ' + producto2.nombre,
        'Comprando 3 o más unidades, precio especial',
        '2026-02-01',
        '2026-02-28',
        'minima',
        'precio_unitario',
        precioMinima,
        3
      ]);
      
      const oferta2Id = result2.insertId;
      
      await executeQuery(
        'INSERT INTO ofertas_detalle (oferta_id, producto_id) VALUES (?, ?)',
        [oferta2Id, producto2.id]
      );
      
      console.log(`✅ Oferta Mínima creada (ID: ${oferta2Id})`);
      console.log(`   ${producto2.nombre}: $${producto2.precioVenta} → $${precioMinima} (x3+)`);
    }
    
    // 4. Crear Oferta Bundle (Combo)
    if (productos.length > 3) {
      console.log('\n📝 Creando Oferta Bundle (Combo)...');
      const prod3 = productos[2];
      const prod4 = productos[3];
      const precioTotal = Math.round((prod3.precioVenta * 2 + prod4.precioVenta * 1) * 0.85); // 15% descuento
      
      const oferta3Query = `
        INSERT INTO ofertas 
        (titulo, descripcion, fecha_inicio, fecha_fin, tipo, modo_precio, valor_precio, activa) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `;
      
      const result3 = await executeQuery(oferta3Query, [
        '🎁 Combo Premium',
        '2 unidades de ' + prod3.nombre + ' + 1 de ' + prod4.nombre,
        '2026-02-01',
        '2026-02-28',
        'bundle',
        'precio_pack',
        precioTotal
      ]);
      
      const oferta3Id = result3.insertId;
      
      await executeQuery(
        'INSERT INTO ofertas_detalle (oferta_id, producto_id, unidades_fijas) VALUES (?, ?, ?)',
        [oferta3Id, prod3.id, 2]
      );
      
      await executeQuery(
        'INSERT INTO ofertas_detalle (oferta_id, producto_id, unidades_fijas) VALUES (?, ?, ?)',
        [oferta3Id, prod4.id, 1]
      );
      
      console.log(`✅ Oferta Bundle creada (ID: ${oferta3Id})`);
      console.log(`   Combo: 2x ${prod3.nombre} + 1x ${prod4.nombre} = $${precioTotal}`);
    }
    
    console.log('\n✅ ¡Ofertas de prueba creadas exitosamente!');
    console.log('\n🌐 Ahora abre: http://localhost:5173');
    console.log('📧 Login: 20174737127');
    console.log('🔑 Password: 754872');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

crearOfertasPrueba();
