# 🚀 Plan de Mejoras - Nalub Pedidos

## 📊 Contexto

**Stack Actual:**
- Frontend: Vue 3 + Vite + Vuetify
- Backend: Node.js + Express + MariaDB
- Deploy: Vercel (frontend) + Railway (backend)

**Usuarios:**
- Clientes PYME (lubricentros, distribuidores)
- Acceso desde celulares, tablets y PC
- Uso mayormente móvil

**Restricciones:**
- ✅ Base de datos MariaDB intocable (ScriptCase ERP compartido)
- ✅ Deploy en Vercel + Railway (bajo costo)
- ✅ Presupuesto limitado

---

## 💡 Decisión: MANTENER Vue 3 + Mejorar Incrementalmente

### ¿Por qué NO cambiar el stack?

1. **La app ya funciona** - No hay problemas graves de arquitectura
2. **Vue es ideal** - Simple, rápido, mobile-friendly
3. **Presupuesto limitado** - Reescribir cuesta tiempo/dinero
4. **Vercel + Railway son óptimos** - Hosting gratuito/económico
5. **PWA resuelve experiencia móvil** - Sin necesidad de app nativa

---

## 📅 Plan de Implementación

### **FASE 1: Mejoras Frontend (1 semana)** 🎨

#### 1.1 Convertir a PWA (Progressive Web App)

**Beneficio:** App instalable en celular como si fuera nativa

```bash
# Instalar plugin
cd frontend
npm install vite-plugin-pwa -D
```

**Configuración en `vite.config.js`:**
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nalub Pedidos',
        short_name: 'Nalub',
        description: 'Sistema de pedidos para clientes Nalub',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Cachear assets estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Cachear API calls importantes
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.railway\.app\/api\/(productos|ofertas)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    })
  ]
})
```

**Tareas:**
- [ ] Instalar vite-plugin-pwa
- [ ] Configurar manifest.json
- [ ] Crear iconos 192x192 y 512x512
- [ ] Configurar service worker
- [ ] Probar instalación en Android/iOS

**Tiempo estimado:** 2 días

---

#### 1.2 Lazy Loading de Rutas

**Beneficio:** Carga inicial más rápida

```javascript
// frontend/src/router/index.js
const routes = [
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    children: [
      {
        path: '/dashboard',
        component: () => import('../views/dashboard/Dashboard.vue')
      },
      {
        path: '/pedidos',
        component: () => import('../views/pedidos/PedidosList.vue')
      },
      {
        path: '/prepedidos',
        component: () => import('../views/prepedidos/Prepedidos.vue')
      },
      {
        path: '/productos',
        component: () => import('../views/productos/Productos.vue')
      },
      {
        path: '/ofertas',
        component: () => import('../views/ofertas/Ofertas.vue')
      }
    ]
  }
]
```

**Tareas:**
- [ ] Convertir todas las rutas a lazy loading
- [ ] Agregar loading spinner durante carga
- [ ] Medir mejora en Lighthouse

**Tiempo estimado:** 1 día

---

#### 1.3 Optimización de Bundle

**Beneficio:** Menos datos descargados, carga más rápida

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify': ['vuetify'],
          'utils': ['axios']
        }
      }
    },
    // Comprimir assets
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true
      }
    }
  }
})
```

**Tareas:**
- [ ] Configurar code splitting
- [ ] Comprimir imágenes
- [ ] Remover console.log en producción
- [ ] Medir bundle size antes/después

**Tiempo estimado:** 1 día

---

#### 1.4 Mejorar UX Móvil

**Beneficio:** Mejor experiencia en celulares

**Tareas:**
- [ ] Touch-friendly: Botones/links mínimo 44x44px
- [ ] Bottom navigation para móvil
- [ ] Swipe gestures en tablas
- [ ] Pull-to-refresh en listas
- [ ] Skeleton loaders durante carga
- [ ] Feedback táctil (vibración en acciones)

**Componente ejemplo:**
```vue
<template>
  <v-bottom-navigation v-if="isMobile" app>
    <v-btn value="dashboard">
      <v-icon>mdi-view-dashboard</v-icon>
      Dashboard
    </v-btn>
    <v-btn value="pedidos">
      <v-icon>mdi-cart</v-icon>
      Pedidos
    </v-btn>
    <v-btn value="productos">
      <v-icon>mdi-package</v-icon>
      Productos
    </v-btn>
  </v-bottom-navigation>
</template>
```

**Tiempo estimado:** 2 días

---

### **FASE 2: Mejoras Backend (2 semanas)** 🔧

#### 2.1 Migrar a TypeScript (gradual)

**Beneficio:** Menos bugs, mejor autocomplete, código más mantenible

```bash
cd backend
npm install typescript @types/node @types/express -D
npm install ts-node nodemon -D
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Estrategia de migración:**
1. Renombrar `app.js` → `app.ts`
2. Agregar tipos gradualmente
3. Migrar controladores uno por uno
4. Migrar rutas
5. Migrar middleware

**Tareas:**
- [ ] Configurar TypeScript
- [ ] Migrar app.js
- [ ] Migrar controllers/
- [ ] Migrar routes/
- [ ] Migrar middleware/
- [ ] Agregar types/ para interfaces

**Tiempo estimado:** 5 días

---

#### 2.2 Implementar Prisma ORM

**Beneficio:** Queries type-safe, mejor performance, auto-completion

```bash
npm install @prisma/client
npm install prisma -D
npx prisma init
```

**Configuración:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model clientes {
  id              Int      @id @default(autoincrement())
  usuario         String   @unique
  pwd             String
  nombre          String?
  email           String?
  deuda           Decimal? @db.Decimal(16, 2)
  fechaUltimoPago DateTime?
  idsecundario    Int?
  
  prepedidos      prepedidos[]
  pedidos         pedidos[]
  
  @@map("clientes")
}

model productos {
  id           Int      @id @default(autoincrement())
  codigo       String   @unique
  nombre       String
  precioVenta  Decimal  @db.Decimal(16, 2)
  stockActual  Int
  marca        Int?
  envase       Int?
  
  @@map("productos")
}

// ... más modelos
```

**Uso en controllers:**
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Antes (raw SQL)
const users = await executeQuery('SELECT * FROM clientes WHERE usuario = ?', [usuario])

// Después (Prisma)
const user = await prisma.clientes.findUnique({
  where: { usuario },
  include: { prepedidos: true }
})
```

**Tareas:**
- [ ] Instalar Prisma
- [ ] Generar schema desde BD existente: `npx prisma db pull`
- [ ] Migrar authController
- [ ] Migrar prepedidoController
- [ ] Migrar pedidosController
- [ ] Migrar productosController
- [ ] Migrar ofertasController
- [ ] Agregar índices para performance

**Tiempo estimado:** 6 días

---

#### 2.3 Validación con Zod

**Beneficio:** Validar inputs antes de guardar, mejor seguridad

```bash
npm install zod
```

**Ejemplo de uso:**
```typescript
import { z } from 'zod'

// Schema de validación
const prepedidoSchema = z.object({
  clienteId: z.number().int().positive(),
  fechaEntrega: z.string().datetime(),
  observaciones: z.string().optional(),
  items: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    descripcion: z.string().min(1),
    precioEstimado: z.number().positive()
  })).min(1)
})

// Usar en controller
export async function createPrepedido(req, res) {
  try {
    // Validar
    const validated = prepedidoSchema.parse(req.body)
    
    // Guardar
    const prepedido = await prisma.prepedidos.create({
      data: validated
    })
    
    res.json({ success: true, data: prepedido })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors
      })
    }
    throw error
  }
}
```

**Tareas:**
- [ ] Crear schemas para todos los endpoints
- [ ] Validar prepedidos
- [ ] Validar productos
- [ ] Validar ofertas
- [ ] Middleware de validación genérico

**Tiempo estimado:** 2 días

---

#### 2.4 Rate Limiting & Seguridad

**Beneficio:** Protección contra abuse, mejor seguridad

```bash
npm install express-rate-limit helmet cors
```

```typescript
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes, intenta más tarde'
})

app.use('/api/', limiter)

// Rate limiting más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos de login
  message: 'Demasiados intentos de login'
})

app.use('/api/auth/login', loginLimiter)

// Seguridad headers
app.use(helmet())
```

**Tareas:**
- [ ] Configurar rate limiting
- [ ] Agregar helmet
- [ ] Configurar CORS correctamente
- [ ] Sanitizar inputs
- [ ] Logging de errores (Winston)

**Tiempo estimado:** 1 día

---

### **FASE 3: Performance & Caching (1 semana)** ⚡

#### 3.1 Redis Cache (Opcional)

**Beneficio:** Consultas frecuentes más rápidas

```bash
npm install redis ioredis
```

**Railway:**
- Agregar servicio Redis ($5/mes)
- Configurar en variables de entorno

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cachear productos
export async function getProductos(req, res) {
  const cacheKey = 'productos:all'
  
  // Intentar obtener del cache
  const cached = await redis.get(cacheKey)
  if (cached) {
    return res.json(JSON.parse(cached))
  }
  
  // Si no está en cache, consultar BD
  const productos = await prisma.productos.findMany()
  
  // Guardar en cache (expira en 1 hora)
  await redis.setex(cacheKey, 3600, JSON.stringify(productos))
  
  res.json(productos)
}
```

**Tareas:**
- [ ] Configurar Redis en Railway
- [ ] Cachear productos (actualización poco frecuente)
- [ ] Cachear ofertas vigentes
- [ ] Invalidar cache cuando se actualice
- [ ] Monitorear hit rate

**Tiempo estimado:** 3 días

---

#### 3.2 Compresión & Headers

**Beneficio:** Transferencia de datos más rápida

```bash
npm install compression
```

```typescript
import compression from 'compression'

// Comprimir respuestas
app.use(compression())

// Headers de cache
app.use('/api/productos', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600') // 1 hora
  next()
})

app.use('/api/ofertas', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=1800') // 30 minutos
  next()
})
```

**Tareas:**
- [ ] Agregar compresión gzip
- [ ] Configurar headers de cache
- [ ] ETags para recursos estáticos
- [ ] Medir reducción de transferencia

**Tiempo estimado:** 1 día

---

#### 3.3 Database Indexing

**Beneficio:** Queries más rápidas

```sql
-- Índices recomendados
CREATE INDEX idx_prepedidos_clienteId_estado ON prepedidos(clienteId, estado);
CREATE INDEX idx_pedidos_cliente_fecha ON pedidos(cliente, fechaEntrega);
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_ofertas_fechas ON ofertas(fecha_inicio, fecha_fin, activa);
```

**Tareas:**
- [ ] Analizar queries lentas con EXPLAIN
- [ ] Agregar índices necesarios
- [ ] Medir mejora en performance
- [ ] Documentar índices críticos

**Tiempo estimado:** 2 días

---

## 💰 Costos Estimados

### Desarrollo
- **Fase 1**: 1 semana (40 horas)
- **Fase 2**: 2 semanas (80 horas)
- **Fase 3**: 1 semana (40 horas)
- **Total**: 4 semanas (160 horas)

### Hosting Mensual
- **Vercel**: Gratis (plan Hobby)
- **Railway**: 
  - Backend: $5/mes (500 horas)
  - Redis (opcional): $5/mes
- **Total**: $5-10/mes

---

## 📊 Métricas de Éxito

### Performance
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB

### UX
- [ ] App instalable en celular
- [ ] Funciona offline (básico)
- [ ] Carga inicial < 2s en 3G
- [ ] Touch-friendly (mínimo 44x44px)

### Backend
- [ ] Queries < 100ms (promedio)
- [ ] Zero errors en producción
- [ ] Rate limiting funcionando
- [ ] Cache hit rate > 70%

---

## 🎯 Alternativas Descartadas

### ❌ Next.js (React)
- **Razón:** Reescribir todo el frontend (3-4 semanas)
- **Costo/beneficio:** No justifica el esfuerzo
- **SSR:** No aporta valor en app privada con login

### ❌ React Native / Flutter
- **Razón:** Requiere instalación, no funciona en PC
- **Costo:** Desarrollo + mantenimiento + fees App Store
- **PWA resuelve el 90%** del caso de uso móvil

### ❌ Cambiar hosting
- **Vercel + Railway:** Óptimo para este stack
- **Alternativas:** Más caras o menos features

---

## 📝 Notas Importantes

1. **No tocar la BD:** Todas las mejoras son read-only sobre MariaDB
2. **Compatible con ScriptCase:** No afecta el ERP existente
3. **Incremental:** Se puede hacer por fases según presupuesto
4. **Sin breaking changes:** App sigue funcionando durante mejoras
5. **Rollback fácil:** Cada fase es independiente

---

## 🚦 Próximos Pasos

1. **Revisar plan** con el equipo
2. **Priorizar fases** según presupuesto
3. **Comenzar Fase 1** (PWA + optimizaciones)
4. **Medir resultados** antes de continuar

---

**Última actualización:** 6 de febrero de 2026
