# 📚 Documentación - Sistema Nalub Pedidos

## Bienvenida

**Nalub Pedidos** es un sistema completo de gestión de pedidos, pre-pedidos y ofertas diseñado específicamente para Nalub. Permite a clientes autenticados crear pre-pedidos, consultar deuda, acceder a ofertas especiales y gestionar su historial de pedidos.

---

## 🗂️ Índice de Documentación

### Documentos Principales

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura técnica y diseño del sistema
2. **[SETUP.md](SETUP.md)** - Instalación y configuración del entorno
3. **[API.md](API.md)** - Documentación completa de endpoints de la API
4. **[DATABASE.md](DATABASE.md)** - Esquema de base de datos y relaciones
5. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de deploy en Railway y Vercel
6. **[MIGRATION-HISTORY.md](MIGRATION-HISTORY.md)** - Historial de mejoras y migraciones
7. **[FEATURES.md](FEATURES.md)** - Funcionalidades y características del sistema

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 20.19+
- MySQL 8.0+
- npm o yarn

### Instalación Express

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/nalub-pedidos.git
cd nalub-pedidos

# Backend
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npx prisma generate
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Para más detalles, consulta [SETUP.md](SETUP.md).

---

## 💡 Características Principales

- ✅ **Sistema PWA** - App instalable en celulares y tablets
- ✅ **Gestión de Pre-pedidos** - Creación, edición y seguimiento
- ✅ **Sistema de Ofertas** - Descuentos automáticos con múltiples modalidades
- ✅ **Dashboard Personalizado** - Métricas de deuda, pedidos y ofertas
- ✅ **Historial de Pedidos** - Consulta de pedidos históricos con diferenciación de cuentas
- ✅ **Autenticación JWT** - Sistema seguro de login
- ✅ **API REST con Prisma ORM** - Backend moderno y eficiente
- ✅ **Validación Zod** - Validación robusta de datos
- ✅ **Rate Limiting** - Protección contra ataques

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js 22+** - Runtime JavaScript
- **Express.js 4.18** - Framework web
- **Prisma ORM 5.22** - ORM type-safe
- **MySQL/MariaDB** - Base de datos
- **JWT** - Autenticación
- **Zod 4.3** - Validación de esquemas
- **Helmet + Rate Limit** - Seguridad

### Frontend
- **Vue.js 3.5** - Framework progresivo
- **Vuetify 3.9** - UI Material Design
- **Vue Router 4.5** - Navegación SPA
- **Axios 1.11** - Cliente HTTP
- **Pinia 3.0** - State management
- **Vite 7.0** - Build tool ultra-rápido
- **PWA Plugin** - Progressive Web App

---

## 📊 Estructura del Proyecto

```
nalubPedidos/
├── backend/                     # API REST Node.js
│   ├── app.js                  # Punto de entrada
│   ├── controllers/            # Lógica de negocio
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── ofertasController.js
│   │   ├── pagosController.js
│   │   ├── pedidosController.js
│   │   ├── prepedidoController.js
│   │   ├── productosController.js
│   │   └── userController.js
│   ├── routes/                 # Definición de rutas
│   ├── middleware/             # Auth y validación
│   ├── config/                 # Configuración
│   ├── schemas/                # Schemas Zod
│   ├── database/               # Scripts SQL
│   └── prisma/                 # Prisma ORM
│       └── schema.prisma
├── frontend/                    # App Vue.js
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── views/              # Páginas principales
│   │   │   ├── auth/           # Login, Perfil
│   │   │   ├── dashboard/      # Dashboard principal
│   │   │   ├── ofertas/        # Gestión de ofertas
│   │   │   ├── pagos/          # Historial de pagos
│   │   │   ├── pedidos/        # Lista y detalle de pedidos
│   │   │   ├── prepedidos/     # Gestión de prepedidos
│   │   │   └── productos/      # Catálogo de productos
│   │   ├── services/           # API services
│   │   ├── stores/             # Pinia stores
│   │   ├── router/             # Vue Router
│   │   └── utils/              # Utilidades
│   └── public/                 # Assets estáticos
├── docs/                        # 📚 Esta documentación
└── scripts/                     # Scripts de utilidad
```

---

## 🔐 Seguridad

El sistema implementa las siguientes medidas de seguridad:

- **JWT tokens** con expiración de 24 horas
- **Bcrypt** para hash de contraseñas
- **Helmet** para headers HTTP seguros
- **Rate limiting** (100 requests/15min global, 5 intentos/15min en login)
- **CORS** configurado para dominios específicos
- **Validación de datos** con Zod en todos los endpoints
- **SQL Injection prevention** con Prisma ORM (queries parametrizadas)

---

## 🤝 Contribuir

Para contribuir al proyecto:

1. Lee la [ARCHITECTURE.md](ARCHITECTURE.md) para entender el diseño
2. Revisa [SETUP.md](SETUP.md) para configurar el entorno
3. Consulta [MIGRATION-HISTORY.md](MIGRATION-HISTORY.md) para ver el progreso actual
4. Sigue los patrones establecidos en los controllers existentes

---

## 📞 Soporte

Para dudas técnicas o problemas:

- Revisa la documentación de API en [API.md](API.md)
- Consulta el esquema de base de datos en [DATABASE.md](DATABASE.md)
- Verifica la guía de deployment en [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📝 Licencia

Este proyecto es de uso privado para Nalub.

---

## 🎯 Estado del Proyecto

**Versión Actual:** 1.0.0

**Fase 1 (Frontend):** ✅ Completada
- PWA implementado
- Lazy loading optimizado
- Bundle optimizado

**Fase 2 (Backend):** ✅ Completada
- Migración a Prisma ORM (8/8 controllers)
- Validación con Zod (7 schemas)
- Seguridad mejorada (Helmet, Rate Limit)
- TypeScript setup

**Próxima Fase:** En planificación
- Testing automatizado
- Optimización de performance
- Monitoreo y analytics
