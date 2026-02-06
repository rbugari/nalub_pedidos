const { executeQuery } = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas relacionadas con pagos...\n');

    // Ver todas las tablas que contengan "pago" o "medio"
    const tables = await executeQuery(`
      SHOW TABLES LIKE '%pag%'
    `);

    console.log('Tablas encontradas con "pag":');
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });

    // También buscar tablas con "medio"
    const tablasMedio = await executeQuery(`
      SHOW TABLES LIKE '%medio%'
    `);

    console.log('\nTablas encontradas con "medio":');
    if (tablasMedio.length > 0) {
      tablasMedio.forEach(table => {
        console.log('  -', Object.values(table)[0]);
      });
    } else {
      console.log('  (ninguna)');
    }

    // Ver estructura de la tabla pagos
    if (tables.length > 0) {
      console.log('\n📋 Estructura de la tabla "pagos":');
      const estructura = await executeQuery(`DESCRIBE pagos`);
      console.table(estructura);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
