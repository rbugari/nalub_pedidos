# PRD Final - Sistema de Pre-Pedidos Nalub

## 1. Resumen Ejecutivo

### 1.1 Objetivo del Proyecto
Desarrollar una aplicación web que permita a los clientes de Nalub crear pre-pedidos que serán posteriormente procesados y ejecutados por administradores, integrándose con el sistema existente de productos, clientes y pedidos.

### 1.2 Alcance
- Sistema de autenticación para clientes usando tabla `clientes` existente
- Dashboard con consulta de deuda desde tabla `clientes`
- Creación y gestión de pre-pedidos con cabecera e ítems
- Validación de productos usando tabla `productos` existente
- Consulta de pedidos históricos desde tabla `pedidos` existente
- Validación de datos en la aplicación (sin foreign keys en BD para pre-pedidos)

## 2. Especificaciones Funcionales

### 2.1 Módulo de Autenticación
- **Login**: Usuario y contraseña desde tabla `clientes` existente
- **Sesión**: Mantenimiento de sesión con JWT
- **Perfil**: Cambio de contraseña desde área de perfil

### 2.2 Dashboard Principal
- **Información de Deuda**: Consulta y muestra el saldo/deuda actual del cliente desde tabla `clientes`
- **Estado de Pre-Pedidos**: Verifica si el cliente tiene pre-pedidos abiertos (estado 'borrador' o 'enviado')
- **Promociones del Mes**: Sección para mostrar promociones vigentes del mes en curso (solo lectura desde sistema central)
- **Navegación Condicional**: 
  - Si tiene pre-pedido abierto: botón "Editar Pre-Pedido"
  - Si no tiene pre-pedido abierto: botón "Crear Pre-Pedido"
- **Pedidos Históricos**: Acceso a consulta de pedidos anteriores desde tabla `pedidos`
- **Perfil de Usuario**: Información básica del cliente y acceso a configuración
- **Resumen Visual**: Cards informativos con estado actual del cliente
- **Header**: Consulta de deuda actual del cliente desde tabla `clientes`
- **Información**: Nombre del cliente y datos básicos
- **Navegación**: Acceso a crear pre-pedidos y ver historial
- **Pedidos Históricos**: Consulta desde tabla `pedidos` existente

### 2.3 Módulo de Pre-Pedidos
- **Creación**: Formulario con cabecera e ítems múltiples
- **Validación**: Cliente ID validado contra tabla `clientes`, Producto ID validado contra tabla `productos`
- **Estados**: borrador → enviado → procesado → completado/rechazado
- **Consulta**: Lista de pre-pedidos propios con filtros
- **Búsqueda de Productos**: Integración con tabla `productos`, `marcas`, `envases`, `tipoenvase`

## 3. Especificaciones Técnicas

### 3.1 Arquitectura
- **Frontend**: Vue.js 3 (SPA)
- **Backend**: Node.js + Express.js (REST API)
- **Base de Datos**: MySQL (usando BD existente `nalub`)
- **Autenticación**: JWT

### 3.2 Estructura de Base de Datos

#### Tablas Existentes (Solo Lectura)

**Tabla: clientes**
- Utilizada para autenticación y consulta de datos del cliente
- Campos relevantes: id, nombre, email, password, saldo/deuda

**Tabla: productos**
```sql
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    marca INT,
    origen VARCHAR(20) NOT NULL,
    pack VARCHAR(20) NOT NULL,
    envase INT,
    stockMinimo INT,
    stockActual INT,
    stockReservado INT,
    precioCompra DECIMAL(10,2),
    precioVenta DECIMAL(10,2),
    rentabilidad DECIMAL(10,2),
    foto MEDIUMBLOB,
    FOREIGN KEY (envase) REFERENCES envases(id),
    FOREIGN KEY (marca) REFERENCES marcas(id)
);
```

**Tabla: marcas**
```sql
CREATE TABLE marcas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);
```

**Tabla: envases**
```sql
CREATE TABLE envases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    litros DECIMAL(10,4) NOT NULL,
    tipoenvaseid INT,
    FOREIGN KEY (tipoenvaseid) REFERENCES tipoenvase(id)
);
```

**Tabla: tipoenvase**
```sql
CREATE TABLE tipoenvase (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL
);
```

**Tabla: pedidos** (Para consulta de historial)
```sql
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente INT NOT NULL,
    fecha DATETIME NOT NULL,
    login VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    bultos INT NOT NULL,
    importeTotal DECIMAL(16,2) NOT NULL,
    observacion VARCHAR(255),
    fechaEntrega DATE,
    saldo DECIMAL(16,2),
    fechaSaldo DATE,
    usuario VARCHAR(20),
    FOREIGN KEY (cliente) REFERENCES clientes(id),
    FOREIGN KEY (login) REFERENCES sec_users(login)
);
```

**Tabla: pedidoitems** (Para detalle de pedidos históricos)
```sql
CREATE TABLE pedidoitems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedidoId INT NOT NULL,
    productoId INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(16,2) NOT NULL,
    precioTotal DECIMAL(16,2) NOT NULL,
    FOREIGN KEY (productoId) REFERENCES productos(id),
    FOREIGN KEY (pedidoId) REFERENCES pedidos(id)
);
```

#### Tablas Nuevas (Para Pre-Pedidos)
**Tabla: prepedidos_cabecera**
```sql
CREATE TABLE prepedidos_cabecera (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_prepedido VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT NOT NULL, -- Sin FK, validado en app
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('borrador', 'enviado', 'procesado') DEFAULT 'borrador',
    observaciones TEXT,
    total_estimado DECIMAL(10,2) DEFAULT 0,
    notas_admin TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);
```
**Tabla: prepedidos_items**
```sql
CREATE TABLE prepedidos_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prepedido_id INT NOT NULL,
    producto_id INT NOT NULL, -- Sin FK, validado en app
    descripcion_producto VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad_medida VARCHAR(20),
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    observaciones_item TEXT,
    orden_item INT DEFAULT 1,
    FOREIGN KEY (prepedido_id) REFERENCES prepedidos_cabecera(id) ON DELETE CASCADE
);
```
**Tabla: ofertas (Tabla del sistema central - Solo lectura)**
-- NOTA: Esta tabla es administrada por el sistema central
-- La aplicación solo consulta ofertas vigentes del mes actual
CREATE TABLE ofertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descuento_porcentaje DECIMAL(5,2),
    descuento_monto DECIMAL(10,2),
    productos_aplicables TEXT, -- JSON con IDs de productos
    activa BOOLEAN DEFAULT TRUE,
    imagen_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 APIs REST Actualizadas

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión (valida contra tabla `clientes`)
- `PUT /api/auth/change-password` - Cambiar contraseña

#### Usuario
- `GET /api/user/profile` - Obtener perfil desde tabla `clientes`
- `GET /api/user/debt` - Consultar deuda desde tabla `clientes`

#### Productos (Solo Lectura)
- `GET /api/productos/search` - Buscar productos con filtros
- `GET /api/productos/:id` - Obtener producto específico
- `GET /api/productos/:id/details` - Producto con marca, envase, tipo
- `GET /api/marcas` - Listar marcas disponibles
- `GET /api/envases` - Listar envases disponibles

#### Pre-Pedidos
- `POST /api/prepedidos` - Crear pre-pedido completo
- `GET /api/prepedidos` - Listar pre-pedidos del usuario
- `GET /api/prepedidos/:id` - Obtener pre-pedido específico
- `PUT /api/prepedidos/:id` - Actualizar pre-pedido (solo estado 'borrador')
- `PUT /api/prepedidos/:id/enviar` - Cambiar estado a 'enviado'
- `DELETE /api/prepedidos/:id` - Eliminar pre-pedido (solo estado 'borrador')

#### Pedidos Históricos (Solo Lectura)
- `GET /api/pedidos/historial` - Pedidos históricos del cliente
- `GET /api/pedidos/:id` - Detalle de pedido específico
- `GET /api/pedidos/:id/items` - Items de un pedido específico

#### Validaciones
- `GET /api/validate/cliente/:id` - Validar cliente contra tabla `clientes`
- `GET /api/validate/producto/:id` - Validar producto contra tabla `productos`

### 3.4 Estructura Frontend

src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.vue
│   │   └── ProfileSettings.vue
│   ├── Dashboard/
│   │   ├── DashboardHeader.vue
│   │   ├── DebtDetailCard.vue
│   │   ├── PrepedidoStatusCard.vue
│   │   ├── OfertasDestacadas.vue
│   │   ├── NavigationActions.vue
│   │   └── AccesosRapidos.vue
│   ├── Ofertas/
│   │   ├── OfertasList.vue
│   │   ├── OfertaCard.vue
│   │   └── OfertaDetail.vue
│   └── Prepedidos/
│       ├── PrepedidoForm.vue
│       ├── PrepedidoCabecera.vue
│       ├── PrepedidoItems.vue
│       ├── PrepedidoItemForm.vue
│       ├── PrepedidoList.vue
│       ├── PrepedidoDetail.vue
│       └── ProductoSearch.vue
├── views/
│   ├── Login.vue
│   ├── Dashboard.vue
│   ├── Prepedidos.vue
│   ├── Ofertas.vue
│   └── Profile.vue
├── router/
├── store/
└── services/
└── api.js

### 3.5 Estructura Backend
backend/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── prepedidoController.js
│   ├── ofertasController.js  // Solo consultas - No CRUD
│   └── validationController.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── models/
│   ├── User.js
│   ├── Prepedido.js
│   └── PrepedidoItem.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── prepedidos.js
│   └── validation.js
├── config/
│   └── database.js
└── app.js


## 4. Flujos de Usuario

### 4.1 Flujo de Dashboard Post-Login
1. Usuario se autentica exitosamente
2. Sistema redirige a dashboard principal
3. Dashboard carga:
   - Información de deuda desde tabla `clientes`
   - Estado de pre-pedidos abiertos
   - Promociones del mes (placeholder)
4. Sistema evalúa estado de pre-pedidos:
   - Si tiene pre-pedido abierto: muestra botón "Editar Pre-Pedido"
   - Si no tiene pre-pedido abierto: muestra botón "Crear Pre-Pedido"
5. Usuario puede navegar a:
   - Crear/Editar pre-pedido
   - Ver pedidos históricos
   - Configurar perfil

### 4.2 Flujo de Autenticación
1. Usuario accede a `/login`
2. Ingresa credenciales
3. Sistema valida contra tabla clientes
4. Genera JWT y redirige a dashboard

// Eliminar estas líneas de comentarios y aplicar las correcciones:
// En sección 4 - Flujos de Usuario, corregir numeración:
### 4.3 Flujo de Creación de Pre-Pedido
### 4.4 Flujo de Consulta

// En sección 5.3 - Estados de Pre-Pedido, unificar:
- **borrador**: Recién creado por cliente
- **enviado**: Cliente envió para revisión
- **procesado**: Admin está evaluando/procesando
- **completado**: Pre-pedido ejecutado exitosamente
- **rechazado**: Pre-pedido no aprobado

// Eliminar líneas 420-430 (endpoints duplicados)
1. Usuario accede a "Mis Pre-Pedidos"
2. Ve lista con filtros por estado/fecha
3. Puede ver detalle de cada pre-pedido
4. Ve estado actual y notas del admin

## 5. Validaciones y Reglas de Negocio

### 5.1 Validaciones Frontend
- Cliente ID debe existir antes de crear pre-pedido
- Producto ID debe validarse antes de agregar ítem
- Cantidad debe ser mayor a 0
- Descripción del producto es obligatoria

### 5.2 Validaciones Backend
- JWT válido para todas las operaciones
- Usuario solo puede ver/modificar sus propios pre-pedidos
- Validación de tipos de datos
- Sanitización de inputs

### 5.3 Estados de Pre-Pedido
- **Pendiente**: Recién creado por cliente
- **Revisión**: Admin está evaluando
- **Aprobado**: Admin aprobó, en proceso
- **Completado**: Pre-pedido ejecutado
- **Rechazado**: Pre-pedido no aprobado

## 6. Interfaz de Usuario

### 6.1 Formulario de Pre-Pedido
┌─────────────────────────────────────┐
│ Nuevo Pre-Pedido                    │
├─────────────────────────────────────┤
│ Observaciones Generales:            │
│ [Textarea]                          │
│                                     │
│ ┌─ Ítems del Pre-Pedido ──────────┐ │
│ │ Item #1                         │ │
│ │ Producto ID: [ ] [Validar]    │ │
│ │ Descripción: [ ]  │ │
│ │ Cantidad: [ ] Unidad: [ ]   │ │
│ │ Precio: [ ] Subtotal: [ ]   │ │
│ │ Observaciones: [__________ ]   │ │
│ │ [Eliminar Item]                 │ │
│ │                                 │ │
│ │ [+ Agregar Otro Item]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Total Estimado: $ __               │
│ [Cancelar] [Guardar Pre-Pedido]     │
└─────────────────────────────────────┘

### 6.2 Lista de Pre-Pedidos
┌─────────────────────────────────────┐
│ Mis Pre-Pedidos                     │
├─────────────────────────────────────┤
│ Filtros: [Estado ▼] [Fecha ▼]       │
├─────────────────────────────────────┤
│ #PP001 - 15/01/2024                 │
│ Estado: Enviado                     │
│ Total: $1,500.00                    │
│ Items: 3                            │
│ [Ver Detalle] [Editar]              │
├─────────────────────────────────────┤
│ #PP002 - 10/01/2024                 │
│ Estado: Procesado                   │
│ Total: $850.00                      │
│ Items: 2                            │
│ [Ver Detalle]                       │
└─────────────────────────────────────┘

### 6.3 Dashboard Principal
┌─────────────────────────────────────┐
│ Dashboard - Bienvenido [Nombre]     │
├─────────────────────────────────────┤
│ 💰 Estado de Cuenta                 │
│ Deuda Actual: $ 2,450.00           │
│ Días de deuda: 25 días             │
│ Último Pago: 15/01/2024            │
│ Estado: ⚠️ Vencida                  │
├─────────────────────────────────────┤
│ 📋 Pre-Pedidos                     │
│ ● Tienes 1 pre-pedido abierto      │
│ [Editar Pre-Pedido] [Ver Todos]     │
│ ○ No tienes pre-pedidos abiertos    │
│ [Crear Pre-Pedido] [Ver Todos]      │
├─────────────────────────────────────┤
│ 🎯 Ofertas del Mes                 │
│ • 15% OFF en Aceites Valvoline     │
│ • 2x1 en Filtros de Aire          │
│ • Descuento por volumen +50L       │
│ [Ver Todas las Ofertas]            │
├─────────────────────────────────────┤
│ 📊 Accesos Rápidos                 │
│ [Crear Pre-Pedido] [Ofertas]       │
│ [Pedidos Históricos] [Mi Perfil]    │
└─────────────────────────────────────┘
#### Dashboard
- `GET /api/dashboard/summary` - Resumen completo del dashboard
- `GET /api/dashboard/debt-details` - Deuda con días de antigüedad y estado
- `GET /api/dashboard/open-prepedidos` - Verificar pre-pedidos abiertos del cliente
- `GET /api/dashboard/ofertas-destacadas` - Top 3 ofertas para mostrar en dashboard

#### Ofertas/Promociones (Solo Lectura - Sistema Central)
- `GET /api/ofertas/vigentes-mes` - Ofertas vigentes del mes actual
- `GET /api/ofertas/:id` - Detalle de oferta específica
- `GET /api/ofertas/por-producto/:producto_id` - Ofertas aplicables a un producto
- `GET /api/ofertas/destacadas` - Top 3 ofertas para dashboard

### 5.4 Reglas de Negocio - Ofertas
- **Solo Lectura**: Las ofertas son administradas por el sistema central
- **Vigencia**: Solo se muestran ofertas del mes en curso
- **Filtrado Automático**: El sistema filtra automáticamente ofertas vencidas
- **Actualización**: Las ofertas se sincronizan desde el sistema central
- **Sin CRUD Local**: No se pueden crear, editar o eliminar ofertas desde esta aplicación
### 6.4 Vista de Ofertas (Solo Lectura)
┌─────────────────────────────────────┐
│ Ofertas Vigentes - [Mes Actual]     │
├─────────────────────────────────────┤
│ ℹ️ Ofertas administradas por sistema │
│    central - Solo consulta          │
├─────────────────────────────────────┤
│ 🏷️ 15% OFF Aceites Valvoline       │
│ Válido hasta: 31/01/2024           │
│ Productos: Aceites 5W30, 10W40     │
│ [Ver Productos]                     │
├─────────────────────────────────────┤
│ 🏷️ 2x1 Filtros de Aire            │
│ Válido hasta: 28/01/2024           │
│ Productos: Todos los filtros       │
│ [Ver Productos]                     │
└─────────────────────────────────────┘