// Prisma Client Singleton
// Usar este archivo para importar prisma en tus controladores

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma
