# 🛒 Nalub Pedidos

> Sistema completo de gestión de pedidos, pre-pedidos y ofertas con PWA Progressive Web App

**Sistema B2B** de gestión comercial que permite a clientes autenticados crear pre-pedidos, consultar ofertas, ver historial de pedidos y gestionar información financiera desde una interfaz web moderna instalable como app.

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
git clone <repository-url>
cd nalubPedidos
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales MySQL
npx prisma generate
node app.js
# ✅ Servidor corriendo en http://localhost:3001
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
# ✅ App corriendo en http://localhost:5173
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

- 🔐 **Autenticación JWT** - Login seguro con tokens de 24h
- 📊 **Dashboard Interactivo** - Métricas, deuda, ofertas destacadas
- 🛍️ **Catálogo de Productos** - Búsqueda, filtros, imágenes
- 🎁 **Sistema de Ofertas** - Descuentos porcentuales y bundles
- 🛒 **Pre-Pedidos** - Crear, editar, enviar pre-pedidos con ofertas
- 📦 **Historial de Pedidos** - Consulta de pedidos principales y secundarios
- 💰 **Gestión de Pagos** - Historial de últimos 5 pagos
- 👤 **Perfil de Usuario** - Editar datos y cambiar contraseña
- 📱 **PWA** - Instalable en móviles y tablets
- 🔒 **Seguridad** - Helmet, rate limiting, validación Zod

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
- MySQL provisioning automático
- Deploy desde GitHub
- Variables de entorno
- Auto-deploy en push

### Frontend - Vercel
- Build optimizado con Vite
- PWA assets generados
- CORS configurado
- Auto-deploy en push

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
