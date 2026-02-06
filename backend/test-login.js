const { executeQuery } = require('./config/database');

async function testLogin() {
  try {
    console.log('🔍 Buscando usuario: 20174737127');
    
    const query = 'SELECT id, nombre, usuario, pwd, email, deuda FROM clientes WHERE usuario = ?';
    const users = await executeQuery(query, ['20174737127']);
    
    if (users.length === 0) {
      console.log('❌ Usuario NO encontrado');
      return;
    }
    
    const user = users[0];
    console.log('\n✅ Usuario encontrado:');
    console.log('ID:', user.id);
    console.log('Nombre:', user.nombre);
    console.log('Usuario:', user.usuario);
    console.log('Password en DB:', user.pwd);
    console.log('Email:', user.email);
    console.log('Deuda:', user.deuda);
    
    // Verificar password
    const passwordIngresada = '754872';
    if (passwordIngresada === user.pwd) {
      console.log('\n✅ Password CORRECTA');
      
      // Buscar ofertas vigentes
      const ofertasQuery = `
        SELECT o.id, o.titulo, o.tipo, COUNT(od.id) as productos
        FROM ofertas o
        LEFT JOIN ofertas_detalle od ON o.id = od.oferta_id
        WHERE o.activa = 1 
          AND o.fecha_inicio <= CURDATE() 
          AND o.fecha_fin >= CURDATE()
        GROUP BY o.id
        LIMIT 5
      `;
      
      const ofertas = await executeQuery(ofertasQuery);
      console.log('\n🎁 Ofertas vigentes:', ofertas.length);
      ofertas.forEach(o => {
        console.log(`  - ${o.titulo} (${o.tipo}) - ${o.productos} productos`);
      });
      
      // Buscar productos con stock
      const productosQuery = `
        SELECT COUNT(*) as total 
        FROM productos 
        WHERE stockActual > 0
      `;
      
      const [productos] = await executeQuery(productosQuery);
      console.log(`\n📦 Productos con stock: ${productos.total}`);
      
    } else {
      console.log('\n❌ Password INCORRECTA');
      console.log('Esperada:', passwordIngresada);
      console.log('En DB:', user.pwd);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
