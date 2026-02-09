# 🛒 Nalub Pedidos

> Sistema completo de gestión de pedidos, pre-pedidos y ofertas con PWA Progressive Web App

**Sistema B2B** de gestión comercial que permite a clientes autenticados crear pre-pedidos, consultar ofertas, ver historial de pedidos y gestionar información financiera desde una interfaz web moderna instalable como app.

[![Production](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](https://github.com/rbugari/nalub_pedidos)
[![Node](https://img.shields.io/badge/Node.js-22.17.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Vue](https://img.shields.io/badge/Vue-3.5.18-42b883?style=for-the-badge&logo=vue.js)](https://vuejs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)

---

## 📚 Documentación Completa

Toda la documentación del proyecto está organizada en el directorio **[docs/](docs/)**:

| Documento | Descripción |
|-----------|-------------|
| **[README](docs/README.md)** | 📖 Índice principal y resumen del proyecto |
| **[ARCHITECTURE](docs/ARCHITECTURE.md)** | 🏗️ Arquitectura técnica con diagramas |
| **[FEATURES](docs/FEATURES.md)** | ✨ Funcionalidades completas del sistema |
| **[SETUP](docs/SETUP.md)** | ⚙️ Guía de instalación paso a paso |
| **[API](docs/API.md)** | 🔌 Referencia completa de API (30+ endpoints) |
| **[DATABASE](docs/DATABASE.md)** | 💾 Esquema de base de datos con 12 tablas |
| **[DEPLOYMENT](docs/DEPLOYMENT.md)** | 🚀 Guía de despliegue Railway + Vercel |
| **[MIGRATION-HISTORY](docs/MIGRATION-HISTORY.md)** | 📜 Historial de mejoras y migraciones |

---

## 🚀 Quick Start

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/rbugari/nalub_pedidos.git
cd nalubPedidos
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales MySQL
npx prisma generate
npm start
# ✅ Servidor corriendo en http://localhost:3001
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
# ✅ App corriendo en http://localhost:5173
```

### 4️⃣ Credenciales de Prueba

```
Usuario: 20174737127
Password: 754872
```

📖 **Documentación detallada:** [docs/SETUP.md](docs/SETUP.md)

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js 22.17.0** + **Express 4.18.2**
- **Prisma ORM 5.22.0** + **MySQL/MariaDB 11.8**
- **JWT** + **Bcrypt** (autenticación segura)
- **Zod 4.3.6** (validación de datos)
- **Helmet** + **Rate Limiting** (seguridad)

### Frontend
- **Vue 3.5.18** + **Vite 7.0.6**
- **Vuetify 3.9** (Material Design)
- **Pinia** (state management)
- **PWA** (Progressive Web App)

---

## ✨ Funcionalidades Principales

### 🔐 Autenticación & Seguridad
- **Login JWT** - Autenticación segura con tokens de 24h
- **Rate Limiting** - Protección contra ataques de fuerza bruta
- **Helmet** - Headers de seguridad configurados
- **Validación Zod** - Validación de datos en 20+ endpoints
- **Cambio de contraseña** - Gestión segura de credenciales

### 📊 Dashboard & Visualización
- **Dashboard interactivo** - Métricas en tiempo real con animaciones
- **Ofertas destacadas** - Tarjetas visuales con precios resaltados
- **Gestión de deuda** - Visualización clara del estado financiero
- **Navegación moderna** - Iconos Material Design en todas las vistas
- **Diseño responsive** - Optimizado para desktop, tablet y móvil

### 🛍️ Catálogo & Productos
- **Búsqueda avanzada** - Filtros por marca, envase, nombre
- **Imágenes de producto** - Visualización con modal ampliado
- **Información detallada** - Precio, stock, características
- **Selector inteligente** - Componente reutilizable con validación

### 🎁 Sistema de Ofertas
- **4 tipos de ofertas** - Unitaria, mínima, bundle, mix
- **Descuentos dinámicos** - Cálculo automático de precios
- **Visualización destacada** - Precios con fondo verde y tamaño grande
- **Validación automática** - Reglas de negocio aplicadas
- **Ofertas vigentes** - Filtrado por fecha de validez

### 🛒 Pre-Pedidos
- **Creación intuitiva** - Selector de productos y ofertas integrado
- **Edición completa** - Agregar, modificar, eliminar items
- **Cálculo automático** - Totales y descuentos en tiempo real
- **Envío a aprobación** - Workflow completo de pre-pedido
- **Validación de reglas** - Mínimos, máximos, incompatibilidades

### 📦 Pedidos & Historial
- **Historial completo** - Pedidos principales y secundarios
- **Detalle expandido** - Items, precios, estado
- **Filtros y búsqueda** - Por fecha, estado, número
- **Exportación** - Descarga de información

### 💰 Gestión Financiera
- **Historial de pagos** - Últimos 5 pagos registrados
- **Estado de cuenta** - Deuda actualizada
- **Información detallada** - Fecha, monto, método de pago

### 👤 Perfil de Usuario
- **Edición de datos** - CUIT, email, teléfono, dirección
- **Cambio de contraseña** - Con validación segura
- **Información de cuenta** - Datos del cliente principal/secundario

### 📱 Progressive Web App (PWA)
- **Instalable** - En móviles, tablets y desktop
- **Offline básico** - Caché de assets estáticos
- **App-like experience** - Navegación fluida sin recarga
- **Optimizado** - Bundle reducido 60% vs versión anterior

### 🎨 UI/UX Mejorado
- **Material Design 3** - Vuetify 3.9 con componentes modernos
- **Iconografía completa** - Material Design Icons en toda la app
- **Animaciones suaves** - Transiciones y efectos visuales
- **Modo claro optimizado** - Contraste y legibilidad mejorados
- **Cards modernas** - Bordes redondeados, sombras, hover effects
- **Navegación intuitiva** - Drawer mobile con header de usuario
- **Precios destacados** - Visualización clara con fondo verde y tamaño grande

📖 **Documentación completa de funcionalidades:** [docs/FEATURES.md](docs/FEATURES.md)

---

## 📁 Estructura del Proyecto

```
nalubPedidos/
├── docs/                    # 📚 Documentación completa
├── backend/                 # 🔧 API REST con Node.js + Express
│   ├── controllers/         # Controladores (8 módulos migrados a Prisma)
│   ├── routes/              # Rutas y endpoints
│   ├── middleware/          # Auth + validación Zod
│   ├── database/            # Scripts SQL de migraciones
│   └── prisma/              # Schema Prisma ORM
├── frontend/                # 🎨 Aplicación Vue 3 + Vuetify
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── views/           # Páginas (auth, dashboard, ofertas, etc.)
│   │   ├── services/        # Servicios API
│   │   ├── stores/          # Pinia stores
│   │   └── router/          # Vue Router
│   └── public/              # PWA assets (manifest, icons)
└── scripts/                 # 🛠️ Scripts de utilidad (backup, migración)
```

---

## 🏗️ Arquitectura

**Frontend (Vue 3 + PWA)**  
Vue Router → Pinia → API Service → Backend

**Backend (Express + Prisma)**  
Routes → Auth Middleware → Validation → Controllers → Prisma → MySQL

📖 **Documentación completa de arquitectura:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🔌 API Endpoints

### Módulos Disponibles
- 🔐 **Auth** - Login, change password
- 📊 **Dashboard** - Data, ofertas destacadas
- 🛍️ **Productos** - List, search, detail, marcas, envases
- 🎁 **Ofertas** - List, vigentes, detail, por-producto, calcular-precio
- 🛒 **Prepedidos** - CRUD completo
- 📦 **Pedidos** - List, detail
- 💰 **Pagos** - Historial
- 👤 **Usuario** - Profile, update, debt

📖 **Documentación completa de API:** [docs/API.md](docs/API.md)

---

## 💾 Base de Datos

### 12 Tablas Principales
- `clientes` - Datos de clientes (principal/secundario)
- `productos` - Catálogo de productos
- `marcas` - Marcas de productos
- `envases` - Tipos de envase
- `ofertas` - Ofertas y promociones
- `ofertas_detalle` - Productos incluidos en ofertas
- `prepedidos_cabecera` - Cabecera de pre-pedidos
- `prepedidos_items` - Items de pre-pedidos
- `pedidos` - Pedidos confirmados
- `pedidoItems` - Items de pedidos
- `pagos` - Historial de pagos
- `users` - Usuarios del sistema

📖 **Documentación completa de base de datos:** [docs/DATABASE.md](docs/DATABASE.md)

---

## 🚀 Deployment

### Backend - Railway
- ✅ MySQL provisioning automático
- ✅ Deploy desde GitHub (rama `main`)
- ✅ Variables de entorno configuradas
- ✅ Auto-deploy en cada push
- 🌐 **URL:** https://nalubpedidos-production.up.railway.app

### Frontend - Vercel
- ✅ Build optimizado con Vite
- ✅ PWA assets generados automáticamente
- ✅ CORS configurado para Railway backend
- ✅ Auto-deploy en cada push a `main`
- ✅ Preview deployments en Pull Requests

📖 **Guía completa de deployment:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📜 Historial de Migraciones

### ✅ Fase 1 (Completada)
- PWA Progressive Web App
- Lazy loading de rutas
- Optimización de bundle (60% reducción)

### ✅ Fase 2 (Completada)
- Migración completa a Prisma ORM (8/8 controladores)
- Validación Zod en 20 endpoints
- Mejoras de seguridad (Helmet, rate limiting)
- ~2,500 líneas SQL reemplazadas

📖 **Historial completo:** [docs/MIGRATION-HISTORY.md](docs/MIGRATION-HISTORY.md)

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Lee la documentación completa en [docs/](docs/)
2. Revisa la guía de setup en [docs/SETUP.md](docs/SETUP.md)
3. Consulta la arquitectura en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. Crea una rama feature desde `main`
5. Implementa cambios siguiendo las convenciones existentes
6. Crea un Pull Request con descripción detallada

---

## 📄 Licencia

Este proyecto es propiedad de **Nalub**. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte técnico, documentación o consultas:
- 📚 Consulta la documentación completa en [docs/](docs/)
- 🔧 Revisa troubleshooting en [docs/SETUP.md](docs/SETUP.md)
- 🚀 Guía de deployment en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

**Proyecto:** Nalub Pedidos  
**Versión:** 3.0.0 - Sistema completo migrado a Prisma ORM con PWA  
**Última actualización:** Febrero 2026
