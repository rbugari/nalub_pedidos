# Nalub Pedidos

Sistema completo de gestión de pedidos y pre-pedidos para Nalub, con funcionalidades avanzadas de ofertas y descuentos.

## 🚀 Características Principales

- **Gestión de Pre-pedidos**: Creación, edición y seguimiento de pre-pedidos
- **Sistema de Ofertas**: Integración completa de ofertas con descuentos automáticos
- **Gestión de Productos**: Catálogo completo con precios y especificaciones
- **Dashboard Administrativo**: Panel de control con métricas y reportes
- **Autenticación Segura**: Sistema de login con roles de usuario
- **API REST Completa**: Backend robusto con endpoints documentados

## 📁 Estructura del Proyecto

```
nalubPedidos/
├── backend/                 # API REST con Node.js y Express
│   ├── controllers/         # Controladores de la API
│   ├── routes/             # Rutas y endpoints
│   ├── middleware/         # Middleware de autenticación y validación
│   └── database/           # Scripts SQL y migraciones
├── frontend/               # Aplicación Vue.js con Vuetify
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── views/          # Páginas principales
│   │   └── services/       # Servicios de API
└── .trae/documents/        # Documentación técnica
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** + **Express.js** - Servidor y API REST
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **Vue.js 3** - Framework frontend reactivo
- **Vuetify** - Biblioteca de componentes Material Design
- **Vue Router** - Navegación SPA
- **Axios** - Cliente HTTP para API

## ⚙️ Configuración e Instalación

### Prerrequisitos
- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### 1. Configuración del Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=nalub_pedidos
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=3000
```

Inicializar la base de datos:
```bash
mysql -u root -p < database/init.sql
```

Ejecutar migraciones de ofertas:
```bash
mysql -u root -p nalub_pedidos < database/migrate_ofertas_schema.sql
```

Iniciar el servidor:
```bash
npm start
```

### 2. Configuración del Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env.production`:
```env
VITE_API_URL=http://localhost:3000/api
```

Iniciar en modo desarrollo:
```bash
npm run dev
```

## 🎯 Funcionalidades Principales

### Sistema de Pre-pedidos
- ✅ Crear nuevos pre-pedidos con múltiples productos
- ✅ Editar pre-pedidos existentes
- ✅ Asociar ofertas a productos específicos
- ✅ Cálculo automático de descuentos
- ✅ Seguimiento de estado de pre-pedidos

### Sistema de Ofertas
- ✅ Gestión completa de ofertas con porcentajes de descuento
- ✅ Selector visual de ofertas en formularios
- ✅ Aplicación automática de descuentos
- ✅ Visualización de ofertas activas
- ✅ Persistencia de ofertas en base de datos

### Componentes Clave
- **PrepedidoForm.vue**: Formulario principal de pre-pedidos
- **OfertaSelector.vue**: Selector de ofertas con vista previa
- **ProductoSelector.vue**: Búsqueda y selección de productos
- **Dashboard**: Panel administrativo con métricas

## 📊 Base de Datos

### Tablas Principales
- `prepedidos_cabecera`: Información principal de pre-pedidos
- `prepedidos_items`: Items individuales con ofertas asociadas
- `ofertas`: Catálogo de ofertas disponibles
- `productos`: Catálogo de productos
- `users`: Usuarios del sistema

### Campo Clave: `ofertaid`
El campo `ofertaid` en `prepedidos_items` permite asociar ofertas específicas a cada producto, habilitando descuentos personalizados por item.

## 🔧 API Endpoints

### Pre-pedidos
- `GET /api/prepedidos` - Listar pre-pedidos
- `POST /api/prepedidos` - Crear pre-pedido
- `PUT /api/prepedidos/:id` - Actualizar pre-pedido
- `GET /api/prepedidos/:id` - Obtener pre-pedido específico

### Ofertas
- `GET /api/ofertas` - Listar ofertas disponibles
- `POST /api/ofertas` - Crear nueva oferta
- `PUT /api/ofertas/:id` - Actualizar oferta

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/search` - Buscar productos

## 🚨 Troubleshooting

### Error: "Bind parameters must not contain undefined"
**Solución**: Este error se resolvió implementando validación de parámetros undefined en el backend. Asegurar que todos los campos opcionales se conviertan a `null` antes de insertar en la base de datos.

### Ofertas no se muestran en edición
**Solución**: Verificar que el campo `ofertaid` esté incluido en la consulta `getPrepedidoById()` y que el componente `OfertaSelector.vue` reciba correctamente el valor inicial.

### Frontend no conecta con Backend
**Solución**: Verificar que las variables de entorno `VITE_API_URL` estén configuradas correctamente y que el backend esté ejecutándose en el puerto especificado.

## 📈 Próximas Funcionalidades

- [ ] Reportes avanzados de ventas
- [ ] Notificaciones en tiempo real
- [ ] Integración con sistemas de facturación
- [ ] App móvil nativa
- [ ] Sistema de inventario automático

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es propiedad de Nalub. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Última actualización**: Octubre 2024  
**Versión**: 2.0.0 - Sistema de Ofertas Integrado