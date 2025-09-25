const { executeQuery } = require('../config/database');

async function fixPreciosCero() {
  try {
    console.log('🔍 Verificando items con precio_estimado = 0...');
    
    // Consultar items con precio en 0
    const itemsConPrecioCero = await executeQuery(`
      SELECT 
        pi.id,
        pi.descripcion,
        pi.precio_estimado,
        pi.producto_id,
        p.precioVenta,
        p.nombre as producto_nombre
      FROM prepedidos_items pi 
      JOIN productos p ON pi.producto_id = p.id 
      WHERE pi.precio_estimado = 0
      LIMIT 20
    `);
    
    console.log(`📊 Encontrados ${itemsConPrecioCero.length} items con precio_estimado = 0`);
    
    if (itemsConPrecioCero.length > 0) {
      console.log('\n📋 Items encontrados:');
      itemsConPrecioCero.forEach(item => {
        console.log(`- ID: ${item.id}, Producto: ${item.producto_nombre}, Precio actual: ${item.precio_estimado}, Precio producto: ${item.precio_venta}`);
      });
      
      // Actualizar precios usando el precio_venta del producto
      console.log('\n🔧 Actualizando precios...');
      
      for (const item of itemsConPrecioCero) {
        if (item.precioVenta && item.precioVenta > 0) {
          await executeQuery(
            'UPDATE prepedidos_items SET precio_estimado = ? WHERE id = ?',
            [item.precioVenta, item.id]
          );
          console.log(`✅ Actualizado item ${item.id}: ${item.precio_estimado} → ${item.precioVenta}`);
        } else {
          console.log(`⚠️  Item ${item.id} no tiene precioVenta válido`);
        }
      }
      
      console.log('\n✅ Actualización completada');
    } else {
      console.log('✅ No se encontraron items con precio_estimado = 0');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixPreciosCero();