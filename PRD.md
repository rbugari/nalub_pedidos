# PRD Final - Sistema de Pre-Pedidos Nalub

## 1. Resumen Ejecutivo

### 1.1 Objetivo del Proyecto
Desarrollar una aplicación web individual para cada cliente de Nalub, que permita a un cliente específico autenticado crear y gestionar sus propios pre-pedidos, consultar su información de deuda personal y acceder a su historial de pedidos. La aplicación está diseñada para uso exclusivo del cliente logueado, sin acceso a información de otros clientes.

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

### 2.1.1 Estructura de Clientes Primarios y Secundarios
**IMPORTANTE**: Cada cliente en el sistema tiene una estructura de cuentas primarias y secundarias:

- **Cliente Primario**: Identificado por el campo `id` en la tabla `clientes`
- **Cliente Secundario**: Identificado por el campo `idsecundario` en la tabla `clientes`
- **Relación**: El `idsecundario` de la cuenta primaria coincide con el `id` de la cuenta secundaria, y la cuenta secundaria referencia a la primaria
- **Pedidos y Deudas**: Tanto los pedidos como las deudas pueden estar asociados a cualquiera de las dos cuentas (primaria o secundaria)
- **Diferenciación**: Es crucial diferenciar entre pedidos/deudas de la cuenta primaria vs secundaria usando los campos:
  - `tipo_cliente`: 'principal' | 'secundario' | 'desconocido'
  - `es_principal`: TRUE | FALSE

**Consulta SQL para Pedidos con Diferenciación de Cuentas**:
```sql
SELECT 
    p.id, p.fechaEntrega, p.estado, p.importeTotal, 
    COALESCE(SUM(pi.cantidad), 0) as cantidadBultos, 
    CASE 
        WHEN p.cliente = c.id THEN 'principal' 
        WHEN p.cliente = c.idsecundario THEN 'secundario' 
        ELSE 'desconocido' 
    END AS tipo_cliente, 
    CASE 
        WHEN p.cliente = c.id THEN TRUE 
        ELSE FALSE 
    END AS es_principal 
FROM clientes c 
JOIN pedidos p ON (p.cliente = c.id OR p.cliente = c.idsecundario) 
LEFT JOIN pedidoitems pi ON p.id = pi.pedidoId 
WHERE c.id = ? AND p.fechaEntrega >= DATE_SUB(CURDATE(), INTERVAL 365 DAY) 
GROUP BY p.id, p.fechaEntrega, p.estado, p.importeTotal, tipo_cliente, es_principal 
ORDER BY p.fechaEntrega DESC;
```

### 2.2 Dashboard Principal (Cliente Individual)
- **Información Personal de Deuda**: Muestra únicamente la deuda actual del cliente logueado desde tabla `clientes`
  - Deuda Actual: Monto adeudado por el cliente
  - Días de Deuda: Días transcurridos desde el último pago
  - Fecha Último Pago: Fecha del último pago registrado
  - Estado de Deuda: Indicador visual (Al día/Vencida/Muy vencida)
- **Identificación del Cliente**: Header con el nombre del cliente logueado
- **Estado Personal de Pre-Pedidos**: Verifica si el cliente logueado tiene pre-pedidos abiertos
- **Métricas de Pedidos**: Muestra contadores diferenciados de pedidos del año actual
  - Total Pedidos: Suma total de pedidos del cliente (principales + secundarios)
  - Cuenta Principal: Pedidos asociados al ID principal del cliente
  - Cuenta Secundaria: Pedidos asociados al ID secundario del cliente (solo si idsecundario ≠ id)
- **Promociones del Mes**: Ofertas vigentes aplicables al cliente
- **Navegación Personal**: 
  - Acceso a crear/editar pre-pedidos propios
  - Consulta de historial de pedidos personal
  - Gestión de perfil individual
- **Restricción de Seguridad**: La aplicación NUNCA muestra información de otros clientes, solo del usuario autenticado

#### 2.2.1 Lógica de Conteo de Pedidos en Dashboard
**IMPORTANTE**: El dashboard implementa una lógica especial para evitar conteo duplicado de pedidos:

- **Caso Normal**: Cuando `idsecundario ≠ id`, se cuentan por separado:
  - Pedidos Principales: `COUNT(*) WHERE p.cliente = c.id`
  - Pedidos Secundarios: `COUNT(*) WHERE p.cliente = c.idsecundario`

- **Caso Especial**: Cuando `idsecundario = id` (cliente sin cuenta secundaria real):
  - Pedidos Principales: `COUNT(*) WHERE p.cliente = c.id`
  - Pedidos Secundarios: `0` (se evita el conteo duplicado con condición `c.idsecundario != c.id`)

**Consulta SQL Corregida para Dashboard**:
```sql
SELECT 
    (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_principales,
    (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.idsecundario AND c.idsecundario != c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_secundarios
FROM clientes c
WHERE c.id = ?
```

Esta corrección garantiza que la suma de pedidos principales + secundarios = total de pedidos.

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

### 6.3 Dashboard Principal (Diseño Compacto v1.2)
┌─────────────────────────────────────┐
│ Dashboard - Bienvenido [Nombre]     │
├─────────────────────────────────────┤
│ 💰 Mi Deuda: $2,450  📅 25 días    │
│ 📆 Último: 15/01/24  ⚠️ Vencida    │
├─────────────────────────────────────┤
│ 📊 Pedidos 2025: 8  👤 Principal:8 │
│ 👥 Secundaria: 0    🛒 Abiertos: 1 │
├─────────────────────────────────────┤
│ 🎯 Ofertas Destacadas (Compactas)   │
│ [IMG] 15% OFF Aceites    [Añadir]  │
│ [IMG] 2x1 Filtros       [Añadir]  │
│ [IMG] Desc. Volumen     [Añadir]  │
├─────────────────────────────────────┤
│ 📊 Acciones Rápidas (Compactas)     │
│ [Pre-Pedido] [Historial] [Perfil]   │
└─────────────────────────────────────┘

**Características del Diseño Compacto**:
- **Tarjetas Uniformes**: Altura fija de 90px para todas las secciones
- **Información Condensada**: Múltiples datos en una sola línea
- **Iconos Pequeños**: 22px para mejor aprovechamiento del espacio
- **Botones Compactos**: 32px de altura con texto reducido
- **Ofertas con Imágenes**: Fotos de productos 90x90px con información esencial
- **Tipografía Optimizada**: Tamaños de fuente reducidos manteniendo legibilidad
- **Espaciado Mínimo**: Padding y márgenes optimizados para máxima densidad de información
#### Dashboard
- `GET /api/dashboard/summary` - Resumen completo del dashboard
- `GET /api/dashboard/debt-details` - Deuda con días de antigüedad y estado
- `GET /api/dashboard/open-prepedidos` - Verificar pre-pedidos abiertos del cliente
- `GET /api/dashboard/ofertas-destacadas` - Top 3 ofertas para mostrar en dashboard

#### Ofertas/Promociones (Solo Lectura - Sistema Central)
- `GET /api/ofertas/vigentes-mes` - Ofertas vigentes del mes actual
- `GET /api/ofertas/:id` - Detalle de oferta específica

## 6. Historial de Cambios

### v1.2 - Optimización de Diseño Dashboard (Enero 2025)
**Mejora Implementada**: Diseño compacto y uniforme para todas las tarjetas del dashboard

**Descripción de la Mejora**:
- Implementación de diseño minimalista con tarjetas de altura uniforme
- Optimización del espacio vertical para mostrar más información sin scroll
- Mejora en la experiencia visual y usabilidad del dashboard

**Cambios Técnicos Implementados**:
- **Altura Uniforme**: Todas las tarjetas ahora tienen 90px de altura (reducción de 30px)
- **Padding Optimizado**: Reducción del padding interno para maximizar espacio útil
- **Iconos Compactos**: Tamaño reducido de iconos de 28px a 22px
- **Tipografía Optimizada**: Tamaños de fuente ajustados manteniendo legibilidad
- **Botones Compactos**: Altura reducida a 32px y 28px respectivamente
- **Espaciado Minimalista**: Márgenes y espacios internos optimizados

**Elementos Afectados**:
- Tarjetas de información personal (deuda, días de deuda, último pago, pre-pedidos)
- Estadísticas de pedidos (año actual, cuenta principal/secundaria)
- Acciones rápidas con botones más compactos
- Ofertas destacadas con imágenes de 90x90px

**Archivos Modificados**:
- `frontend/src/views/dashboard/Dashboard.vue` (estilos CSS y clases)
- `PRD.md` (documentación actualizada)

**Impacto**: Dashboard significativamente más compacto que mantiene funcionalidad y legibilidad, permitiendo ver más información en pantalla.

### v1.1 - Corrección Dashboard (Enero 2025)
**Problema Resuelto**: Conteo duplicado de pedidos en dashboard cuando `idsecundario = id`

**Descripción del Issue**:
- El dashboard mostraba inconsistencias: Total Pedidos = 8, pero Cuenta Principal = 8 y Cuenta Secundaria = 8
- La suma incorrecta (8 ≠ 8 + 8) se debía a que clientes con `idsecundario = id` contaban los mismos pedidos dos veces

**Solución Implementada**:
- Modificación en `dashboardController.js` línea 52
- Agregada condición `c.idsecundario != c.id` en consulta de pedidos secundarios
- Resultado: Cuenta Principal = 8, Cuenta Secundaria = 0, Total = 8 (suma correcta)

**Archivos Modificados**:
- `backend/controllers/dashboardController.js`
- `PRD.md` (documentación actualizada)

**Impacto**: Garantiza consistencia lógica en métricas del dashboard para todos los tipos de clientes.
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