// TEST: Verificar cálculo de precio para oferta #6

const calcularPrecioConOferta = (oferta, precioOriginal, cantidad = 1) => {
  let precioUnitario = precioOriginal;
  let precioTotal = precioOriginal * cantidad;
  let descuentoPct = 0;
  let ofertaAplicada = false;

  // ✅ VALIDAR CANTIDAD MÍNIMA para ofertas tipo "minima" o "mix"
  if ((oferta.tipo === 'minima' || oferta.tipo === 'mix') && oferta.min_unidades_total) {
    if (cantidad < oferta.min_unidades_total) {
      // No se cumple el mínimo, usar precio normal
      return {
        precioUnitario: Math.round(precioOriginal * 100) / 100,
        precioTotal: Math.round((precioOriginal * cantidad) * 100) / 100,
        descuentoPct: 0,
        ofertaAplicada: false
      };
    }
  }

  // Según el modo de precio
  switch (oferta.modo_precio) {
    case 'precio_unitario':
      // El valor_precio es el precio unitario final
      precioUnitario = oferta.valor_precio || precioOriginal;
      precioTotal = precioUnitario * cantidad;
      descuentoPct = precioOriginal > 0 
        ? ((precioOriginal - precioUnitario) / precioOriginal) * 100 
        : 0;
      ofertaAplicada = true;
      break;

    case 'precio_pack':
      // El valor_precio es el precio total del pack/bundle
      if (oferta.tipo === 'bundle' || oferta.tipo === 'minima') {
        const unidadesBase = oferta.unidades_totales || oferta.min_unidades_total || cantidad;
        precioUnitario = unidadesBase > 0 ? oferta.valor_precio / unidadesBase : precioOriginal;
        precioTotal = precioUnitario * cantidad;
        descuentoPct = precioOriginal > 0 
          ? ((precioOriginal - precioUnitario) / precioOriginal) * 100 
          : 0;
      } else {
        precioTotal = oferta.valor_precio || precioTotal;
        precioUnitario = cantidad > 0 ? precioTotal / cantidad : precioOriginal;
        descuentoPct = (precioOriginal * cantidad) > 0
          ? (((precioOriginal * cantidad) - precioTotal) / (precioOriginal * cantidad)) * 100
          : 0;
      }
      ofertaAplicada = true;
      break;

    case 'descuento_pct':
      // El valor_precio es el porcentaje de descuento
      descuentoPct = oferta.valor_precio || 0;
      precioUnitario = precioOriginal * (1 - descuentoPct / 100);
      precioTotal = precioUnitario * cantidad;
      ofertaAplicada = true;
      break;

    default:
      // Sin cambios
      break;
  }

  return {
    precioUnitario: Math.round(precioUnitario * 100) / 100,
    precioTotal: Math.round(precioTotal * 100) / 100,
    descuentoPct: Math.round(descuentoPct * 100) / 100,
    ofertaAplicada
  };
};

// OFERTA #6: Llevá 3 o más - PREMIUM PROTECTION 5W-40
const oferta6 = {
  tipo: 'minima',
  modo_precio: 'precio_unitario',
  valor_precio: 1362800,
  min_unidades_total: 3
};

const precioNormal = 1703500;

console.log('\n=== OFERTA #6: Llevá 3 o más ===');
console.log('Precio Normal: $' + precioNormal.toLocaleString());
console.log('Precio Oferta: $' + oferta6.valor_precio.toLocaleString());
console.log('Mínimo Unidades: ' + oferta6.min_unidades_total);
console.log('\n--- Cálculos según cantidad ---\n');

// Probar con diferentes cantidades
[1, 2, 3, 4, 5].forEach(cant => {
  const resultado = calcularPrecioConOferta(oferta6, precioNormal, cant);
  console.log(`Cantidad: ${cant} unidad(es)`);
  console.log(`  Precio Unitario: $${resultado.precioUnitario.toLocaleString()}`);
  console.log(`  Precio Total: $${resultado.precioTotal.toLocaleString()}`);
  console.log(`  Descuento: ${resultado.descuentoPct}%`);
  console.log(`  Oferta Aplicada: ${resultado.ofertaAplicada ? '✅ SÍ' : '❌ NO'}`);
  
  // Verificar si cumple la condición mínima
  if (cant < oferta6.min_unidades_total) {
    console.log(`  ⚠️  NO cumple mínimo (necesita ${oferta6.min_unidades_total}) - Precio normal`);
  } else {
    console.log(`  ✅ Cumple mínimo requerido - Precio de oferta`);
  }
  console.log('');
});

console.log('\n=== ✅ SOLUCIÓN IMPLEMENTADA ===');
console.log('La función ahora verifica la cantidad mínima antes de aplicar la oferta.');
console.log('\nPara ofertas tipo "minima":');
console.log('- Si cantidad < min_unidades_total → usa precio NORMAL');
console.log('- Si cantidad >= min_unidades_total → aplica precio de OFERTA');
console.log('\n🎯 Ahora el comportamiento es CORRECTO:');
console.log('   1-2 unidades: $1.703.500 c/u (precio normal)');
console.log('   3+ unidades:  $1.362.800 c/u (precio oferta - 20% desc)');
