# 🔄 Patrón de Migración: SQL → Prisma + Zod

Este documento describe el patrón para migrar los controladores existentes de SQL raw queries a Prisma ORM con validación Zod.

## 📋 Ejemplo: authController.js

### ❌ ANTES (SQL raw queries)

```javascript
const { executeQuery } = require('../config/database');

const login = async (req, res) => {
  const { usuario, password } = req.body;
  
  // Query SQL raw
  const query = 'SELECT * FROM clientes WHERE usuario = ?';
  const users = await executeQuery(query, [usuario]);
  
  if (users.length === 0) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }
  
  const user = users[0];
  // ... resto del código
};
```

### ✅ DESPUÉS (Prisma ORM)

```javascript
const prisma = require('../lib/prisma');

const login = async (req, res) => {
  const { usuario, password } = req.body;
  
  // Prisma query con type-safety
  const user = await prisma.clientes.findFirst({
    where: { usuario },
    select: {
      id: true,
      nombre: true,
      usuario: true,
      email: true,
      pwd: true,
      deuda: true,
      fechaUltimoPago: true
    }
  });
  
  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }
  
  // ... resto del código
};
```

## 🔐 Validación con Zod

### 1. Crear schema en `schemas/validation.js`

```javascript
const { z } = require('zod');

const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuario es requerido'),
  password: z.string().min(1, 'Contraseña es requerida')
});

module.exports = { loginSchema };
```

### 2. Aplicar en routes

```javascript
const { validateRequest } = require('../middleware/validateRequest');
const { loginSchema } = require('../schemas/validation');

// Antes
router.post('/login', login);

// Después
router.post('/login', validateRequest(loginSchema), login);
```

## 📚 Operaciones Prisma Comunes

### SELECT (findFirst, findUnique, findMany)

```javascript
// Buscar un registro por condición
const user = await prisma.clientes.findFirst({
  where: { usuario: 'juan123' }
});

// Buscar por ID (unique)
const user = await prisma.clientes.findUnique({
  where: { id: 1 }
});

// Buscar múltiples registros
const productos = await prisma.productos.findMany({
  where: { activo: true },
  orderBy: { nombre: 'asc' },
  take: 10,
  skip: 0
});

// Con relaciones
const pedido = await prisma.pedidos.findUnique({
  where: { id: 1 },
  include: {
    clientes: true,
    detalles_pedido: {
      include: {
        productos: true
      }
    }
  }
});
```

### INSERT (create)

```javascript
// Crear un registro
const nuevoPrepedido = await prisma.prepedidos.create({
  data: {
    clienteId: 1,
    total: 1500.00,
    observaciones: 'Pedido urgente',
    fechaCreacion: new Date()
  }
});

// Crear con relaciones (muchos detalles)
const pedido = await prisma.pedidos.create({
  data: {
    clienteId: 1,
    total: 2500.00,
    detalles_pedido: {
      create: [
        { productoId: 1, cantidad: 5, precioUnitario: 100 },
        { productoId: 2, cantidad: 10, precioUnitario: 200 }
      ]
    }
  }
});
```

### UPDATE (update, updateMany)

```javascript
// Actualizar un registro
const updated = await prisma.clientes.update({
  where: { id: 1 },
  data: { pwd: 'newpassword123' }
});

// Actualizar múltiples registros
const updatedMany = await prisma.productos.updateMany({
  where: { categoria: 'Aceites' },
  data: { descuento: 10 }
});
```

### DELETE (delete, deleteMany)

```javascript
// Eliminar un registro
await prisma.prepedidos.delete({
  where: { id: 1 }
});

// Eliminar múltiples registros
await prisma.detalles_prepedido.deleteMany({
  where: { prepedidoId: 1 }
});
```

## 🎯 Ventajas de Prisma

1. **Type Safety**: Autocomplete y validación en tiempo de desarrollo
2. **Relaciones Simples**: `include` y `select` en lugar de JOINs complejos
3. **Menos Código**: Queries más concisas y legibles
4. **Protección contra SQL Injection**: Prisma sanitiza automáticamente
5. **Migraciones Automáticas**: `prisma migrate` para cambios de esquema (si fuera necesario)

## 🛡️ Rate Limiting por Endpoint

### Configurar en app.js

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting general
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100
});
app.use('/api/', limiter);

// Rate limiting estricto para auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5 // solo 5 intentos de login por 15 min
});
app.use('/api/auth/login', authLimiter);
```

## 📝 Checklist de Migración

Cuando migres un controller:

- [ ] Importar `const prisma = require('../lib/prisma')`
- [ ] Reemplazar `executeQuery()` por métodos Prisma
- [ ] Crear schema Zod en `schemas/validation.js`
- [ ] Agregar `validateRequest()` en routes
- [ ] Usar `select` para elegir solo campos necesarios
- [ ] Probar endpoint con Postman/Thunder Client
- [ ] Verificar logs de Prisma (muestra queries SQL generadas)
- [ ] Actualizar documentación si es necesario

## 🚀 Próximos Controladores a Migrar

**✅ TODOS COMPLETADOS:**
1. ✅ `authController.js` - **COMPLETADO**
2. ✅ `prepedidosController.js` - **COMPLETADO** (Crítico - creación de prepedidos)
3. ✅ `productosController.js` - **COMPLETADO** (Búsqueda frecuente)
4. ✅ `pedidosController.js` - **COMPLETADO** (Operación principal)
5. ✅ `ofertasController.js` - **COMPLETADO** (Lógica de precios compleja)
6. ✅ `pagosController.js` - **COMPLETADO** (Últimos pagos)
7. ✅ `dashboardController.js` - **COMPLETADO** (Dashboard)
8. ✅ `userController.js` - **COMPLETADO** (Perfil de usuario)

**Estado: 8/8 controladores migrados (100%)** 🎉

**Prioridad Media:**
5. ⏳ `ofertasController.js`
6. ⏳ `pagosController.js`
7. ⏳ `dashboardController.js`

**Prioridad Baja:**
8. ⏳ `userController.js`

## 📖 Referencias

- Prisma Docs: https://www.prisma.io/docs
- Zod Docs: https://zod.dev
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference

---

**Nota**: Este patrón fue implementado en Phase 2 del plan de mejoras tecnológicas. Ver `nextjob.md` para más contexto.
