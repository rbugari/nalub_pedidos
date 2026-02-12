const prisma = require('./lib/prisma');

(async () => {
  try {
    const ofertas = await prisma.ofertas.findMany({
      where: { activa: true },
      include: {
        ofertas_detalle: {
          include: {
            productos: {
              select: {
                nombre: true,
                precioVenta: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('=== OFERTAS ACTIVAS ===\n');
    
    ofertas.forEach(oferta => {
      console.log(`\nOFERTA #${oferta.id}: ${oferta.titulo}`);
      console.log(`Tipo: ${oferta.tipo}`);
      console.log(`Modo precio: ${oferta.modo_precio}`);
      console.log(`Valor precio: $${oferta.valor_precio}`);
      console.log(`Min unidades: ${oferta.min_unidades_total || 'N/A'}`);
      console.log(`Vigencia: ${oferta.fecha_inicio} al ${oferta.fecha_fin}`);
      console.log(`Productos:`);
      
      oferta.ofertas_detalle.forEach(detalle => {
        const producto = detalle.productos;
        console.log(`  - ${producto.nombre}`);
        console.log(`    Precio normal: $${producto.precioVenta}`);
        console.log(`    Unidades fijas: ${detalle.unidades_fijas || 'N/A'}`);
      });
      
      console.log('---');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
