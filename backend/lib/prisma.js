// Prisma Client Singleton
// Usar este archivo para importar prisma en tus controladores

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

// Construir DATABASE_URL dinámicamente si no existe (para Railway)
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root'
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ''
  const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost'
  const port = process.env.DB_PORT || process.env.MYSQLPORT || '3306'
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'nalub_pedidos'
  
  process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`
  console.log('✅ DATABASE_URL construido dinámicamente para Prisma')
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma
