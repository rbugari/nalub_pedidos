const { executeQuery } = require('./config/database');

async function findTipoTables() {
  try {
    console.log('🔍 Buscando tablas "tipo...":\n');

    const tables = await executeQuery(`SHOW TABLES LIKE 'tipo%'`);
    
    console.log(`Tablas encontradas: ${tables.length}\n`);
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });

    // Si no hay, ver todas las tablas
    if (tables.length === 0) {
      console.log('\n⚠️  No hay tablas "tipo...". Veamos todas las tablas:\n');
      const allTables = await executeQuery(`SHOW TABLES`);
      allTables.forEach(table => {
        console.log('  -', Object.values(table)[0]);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findTipoTables();
