# 🎯 Funcionalidades del Sistema - Nalub Pedidos

## Descripción General

**Nalub Pedidos** es un sistema completo de gestión comercial que permite a clientes autenticados crear pre-pedidos, consultar ofertas, ver historial de pedidos, gestionar su perfil y consultar información financiera.

---

## Tabla de Contenidos

1. [Autenticación y Perfil](#1-autenticación-y-perfil)
2. [Dashboard](#2-dashboard)
3. [Productos](#3-productos)
4. [Ofertas](#4-ofertas)
5. [Pre-Pedidos](#5-pre-pedidos)
6. [Pedidos Históricos](#6-pedidos-históricos)
7. [Pagos](#7-pagos)
8. [Características Técnicas](#8-características-técnicas)
9. [Roles y Permisos](#9-roles-y-permisos)

---

## 1. Autenticación y Perfil

### 1.1 Login

**Descripción:** Sistema de autenticación con usuario y contraseña.

**Características:**
- ✅ Login con CUIT (sin guiones) como usuario
- ✅ Contraseñas hasheadas con Bcrypt (10 salt rounds)
- ✅ JWT token con expiración de 24 horas
- ✅ Rate limiting: 5 intentos por 15 minutos
- ✅ Token almacenado en localStorage
- ✅ Auto-logout al expirar token

**Flujo:**
```
Usuario ingresa CUIT y contraseña
→ Backend valida credenciales
→ Genera JWT token
→ Frontend guarda token en localStorage
→ Todas las requests incluyen token en header
```

**Seguridad:**
- Bcrypt con 10 rounds
- JWT firmado con secret fuerte
- HttpOnly (en consideración para cookies)
- Rate limiting anti brute-force

### 1.2 Perfil de Usuario

**Descripción:** Consulta y edición de datos personales.

**Datos Mostrados:**
- Nombre completo
- Usuario (CUIT)
- Email
- CUIT con formato (20-12345678-9)
- Porcentajes de descuento (1, 2, 3)
- Deuda actual
- Días de deuda
- Fecha último pago

**Campos Editables:**
- CUIT
- Porcentaje 1 (0-100%)
- Porcentaje 2 (0-100%)
- Porcentaje 3 (0-100%)

**Restricciones:**
- Porcentajes deben estar entre 0 y 100
- Email no es editable (legacy system)

### 1.3 Cambio de Contraseña

**Descripción:** Permite cambiar la contraseña actual.

**Validaciones:**
- Contraseña actual correcta
- Nueva contraseña mínimo 6 caracteres
- Nueva contraseña diferente a la actual

**Flujo:**
```
Usuario ingresa contraseña actual y nueva
→ Backend valida contraseña actual con Bcrypt
→ Hashea nueva contraseña
→ Actualiza en BD
→ Usuario debe hacer login nuevamente (token se invalida)
```

---

## 2. Dashboard

### 2.1 Información del Cliente

**Descripción:** Vista resumida del estado del cliente.

**Datos Mostrados:**
- **Nombre:** Nombre completo del cliente
- **Deuda Actual:** Monto en pesos con formato (ej: $606.000,00)
- **Días de Deuda:** Días desde último pago
  - Verde: Al día (0 días)
  - Amarillo: Vencida (1-30 días)
  - Rojo: Muy vencida (>30 días)

**Cálculo de Días de Deuda:**
```javascript
const diasDeuda = Math.floor((hoy - fechaUltimoPago) / (1000 * 60 * 60 * 24));
```

### 2.2 Estadísticas de Pedidos

**Métricas:**
- **Prepedidos Abiertos:** Count de prepedidos en estado "borrador" o "enviado"
- **Pedidos Año Actual:** Count de pedidos con fechaEntrega del año en curso
- **Cuentas Info:**
  - Pedidos principales: Pedidos de cuenta principal
  - Pedidos secundarios: Pedidos de cuenta secundaria

**Soporte Multicuenta:**
- Clientes tienen estructura principal/secundaria
- Campo `idSecundario` crea relación bidireccional
- Dashboard muestra datos agregados de AMBAS cuentas

### 2.3 Ofertas Destacadas

**Descripción:** Top 3 ofertas vigentes ordenadas por descuento.

**Datos Mostrados:**
- Imagen del primer producto
- Título de la oferta
- Descripción
- Texto de descuento (ej: "-20%")
- Fechas de vigencia
- Cantidad de productos en bundle

**Filtrado:**
- Solo ofertas activas
- Solo ofertas vigentes HOY (fecha_inicio <= hoy, fecha_fin >= hoy)
- Máximo 3 ofertas

**Click en Oferta:**
- Redirige a vista completa de ofertas
- Muestra todos los productos incluidos

---

## 3. Productos

### 3.1 Catálogo de Productos

**Descripción:** Lista completa de productos con stock disponible.

**Información por Producto:**
- Código de producto
- Nombre descriptivo
- Marca
- Origen (país)
- Pack (unidades por pack)
- Envase (tipo y tamaño)
- Stock actual
- Stock mínimo
- Stock reservado
- Precio de compra
- Precio de venta base
- **Precio 1, 2, 3:** Con porcentajes del cliente aplicados
- Rentabilidad (%)
- Foto (BLOB convertido a base64)

**Filtros Disponibles:**
- Solo productos con stock > 0
- Solo productos con precio > 0

**Ordenamiento:**
- Por defecto: Nombre A-Z

### 3.2 Búsqueda de Productos

**Filtros Disponibles:**
- **Texto libre:** Busca en nombre, código, descripción
- **Marca:** Filtro por ID de marca
- **Envase:** Filtro por ID de envase
- **Paginación:** page y limit

**Búsqueda Avanzada:**
```javascript
// Ejemplo: buscar "aceite" en marca "Cocinero"
GET /api/productos/search?q=aceite&marca=1&page=1&limit=20
```

**Resultados:**
- Lista de productos coincidentes
- Metadata de paginación (total, página actual, páginas totales)

### 3.3 Detalle de Producto

**Descripción:** Vista completa de un producto individual.

**Datos Adicionales:**
- Relaciones completas (marca full object, envase full object)
- Tipos de envase (Botella, Bidón, Lata, etc.)
- Información de tipo de envase

### 3.4 Marcas y Envases

**Listados Auxiliares:**
- **Marcas:** Lista completa para filtros
- **Envases:** Lista con tipo de envase (Botella PET, Bidón, etc.)

---

## 4. Ofertas

### 4.1 Sistema de Ofertas

**Descripción:** Sistema flexible de descuentos con múltiples modalidades.

**Tipos de Ofertas:**
1. **Descuento Porcentual:** -X% sobre precio normal
2. **Precio Unitario Fijo:** Precio específico por unidad
3. **Precio Pack Fijo:** Precio específico por pack

**Modo de Precio:**
- `descuento_pct`: Descuento en porcentaje (ej: 20%)
- `precio_unitario`: Precio fijo por unidad (ej: $1,600)
- `precio_pack`: Precio fijo por pack (ej: $19,200)

### 4.2 Ofertas Disponibles

**Vista de Ofertas:**
- Lista paginada de todas las ofertas
- Filtro por estado (activas/inactivas)
- Búsqueda por texto

**Información por Oferta:**
- Título y descripción
- Tipo (descuento, bundle, promoción)
- Fechas de vigencia
- Estado (activa/inactiva)
- Productos incluidos con detalles:
  - Imagen del producto
  - Código y nombre
  - Unidades fijas en oferta
  - Precio original
  - Precio con oferta
  - Ahorro calculado

### 4.3 Ofertas Vigentes del Mes

**Descripción:** Ofertas activas que comenzaron en el mes actual.

**Filtrado:**
- Oferta activa = true
- fecha_inicio <= hoy
- fecha_fin >= hoy
- fecha_inicio dentro del mes actual

**Uso:** 
- Sección destacada en home
- Notificaciones de nuevas ofertas

### 4.4 Ofertas por Producto

**Descripción:** Buscar ofertas que incluyan un producto específico.

**Uso:**
- Desde detalle de producto: "Ver ofertas disponibles"
- Muestra todas las ofertas donde participa el producto
- Ayuda a decidir cuándo comprar

### 4.5 Calculadora de Precio con Oferta

**Descripción:** Endpoint para calcular precio final con oferta aplicada.

**Parámetros:**
- ID de oferta
- ID de producto
- Cantidad solicitada

**Retorna:**
- Precio original
- Precio con oferta
- Descuento aplicado
- Porcentaje de descuento
- Si cumple mínimo de unidades
- Unidades mínimas requeridas

**Validaciones:**
- Producto participa en oferta
- Cumple cantidad mínima
- Oferta está activa
- Oferta está vigente

**Cálculo según Modo:**

**Descuento Porcentual:**
```javascript
precio_con_oferta = precio_original * (1 - valor_precio / 100)
// Ejemplo: $2000 con 20% = $1600
```

**Precio Unitario Fijo:**
```javascript
precio_con_oferta = valor_precio
// Descuento = precio_original - valor_precio
```

**Precio Pack:**
```javascript
precio_con_oferta = precio_original - valor_precio
// Descuento absoluto por pack
```

---

## 5. Pre-Pedidos

### 5.1 Gestión de Pre-Pedidos

**Descripción:** Sistema de pre-pedidos con carritos de compra y ofertas.

**Estados:**
- **Borrador:** En edición, puede modificarse
- **Enviado:** Enviado para procesamiento
- **Procesado:** Convertido a pedido formal

### 5.2 Lista de Pre-Pedidos

**Información Mostrada:**
- ID del prepedido
- Fecha de creación
- Fecha de última modificación
- Estado actual
- Total estimado
- Cantidad de items
- Observaciones

**Acciones Disponibles:**
- Ver detalle
- Editar (solo si estado = borrador)
- Eliminar (solo si estado = borrador)
- Enviar (cambia a estado "enviado")
- Duplicar (crea copia como borrador)

### 5.3 Crear Pre-Pedido

**Flujo:**
```
Seleccionar productos
→ Agregar cantidad
→ Aplicar ofertas (opcional)
→ Agregar observaciones
→ Guardar como borrador
→ Enviar cuando esté listo
```

**Validaciones:**
- Al menos 1 producto
- Cantidad > 0 para todos los items
- Precio estimado > 0
- Observaciones max 500 caracteres

**Funcionalidades:**
- **Selector de Productos:** Autocompletado con búsqueda
- **Selector de Ofertas:** Muestra ofertas disponibles para cada producto
- **Cálculo Automático:** Total se actualiza en tiempo real
- **Vista Previa:** Productos con foto thumbnail

### 5.4 Editar Pre-Pedido

**Restricciones:**
- Solo pre-pedidos en estado "borrador"
- No se pueden editar pre-pedidos "enviados" o "procesados"

**Operaciones:**
- Agregar nuevos items
- Modificar cantidades
- Cambiar ofertas aplicadas
- Eliminar items
- Actualizar observaciones

**Transacción:**
- Se eliminan todos los items anteriores
- Se insertan nuevos items
- Operación atómica (todo o nada)

### 5.5 Enviar Pre-Pedido

**Descripción:** Marcar pre-pedido como listo para procesamiento.

**Flujo:**
```
Pre-pedido en borrador
→ Usuario revisa todo
→ Click "Enviar"
→ Estado cambia a "enviado"
→ Ya no se puede editar
→ Administrador procesa manualmente
```

**Notificaciones:**
- (Futuro) Email al administrador
- (Futuro) Notificación push

---

## 6. Pedidos Históricos

### 6.1 Lista de Pedidos

**Descripción:** Historial completo de pedidos confirmados.

**Filtros:**
- **Período:** Últimos 365 días por defecto
- **Paginación:** 20 pedidos por página
- **Tipo de cuenta:** Principal, Secundario, Todos

**Información por Pedido:**
- ID del pedido
- Fecha de entrega
- Estado (Pendiente, En Proceso, Entregado, Cancelado)
- Importe total
- Cantidad de bultos
- **Tipo de cliente:** Principal o Secundario
- **Es principal:** true/false

**Soporte Multicuenta:**
```javascript
// Query incluye AMBAS cuentas
WHERE p.cliente = cliente.id OR p.cliente = cliente.idSecundario
```

**Diferenciación Visual:**
- Pedidos principales: Color verde
- Pedidos secundarios: Color azul
- Indicador visual de cuenta

### 6.2 Detalle de Pedido

**Descripción:** Vista completa de un pedido específico.

**Información Mostrada:**
- Datos de cabecera (fecha, estado, total)
- Lista de items:
  - Producto (nombre, código)
  - Marca y envase
  - Cantidad
  - Precio unitario
  - Subtotal
- Total general
- Observaciones

**Validación de Acceso:**
- Solo puede ver pedidos de sus cuentas (principal o secundaria)
- 403 Forbidden si intenta acceder a pedido de otro cliente

---

## 7. Pagos

### 7.1 Historial de Pagos

**Descripción:** Últimos 5 pagos realizados.

**Información por Pago:**
- Fecha de recepción
- Medio de pago:
  - Efectivo
  - Transferencia
  - Cheque
  - Tarjeta
- Importe
- Receptor (persona que recibió el pago)

**Uso:**
- Verificar pagos recientes
- Confirmar acreditaciones
- Historial para reclamos

---

## 8. Características Técnicas

### 8.1 Progressive Web App (PWA)

**Características:**
- ✅ Instalable en dispositivos móviles y tablets
- ✅ Funciona offline (básico)
- ✅ Caché automático de assets
- ✅ Auto-actualización en segundo plano
- ✅ Icono en home screen
- ✅ Splash screen personalizado
- ✅ Notificaciones push (futuro)

**Estrategias de Caché:**
- **Assets estáticos:** CacheFirst (JS, CSS, imágenes)
- **API calls:** NetworkFirst (datos frescos cuando posible)
- **Imágenes:** CacheFirst con fallback

### 8.2 Optimizaciones de Performance

**Frontend:**
- ✅ Code splitting por ruta (lazy loading)
- ✅ Bundle bajo 200KB
- ✅ Chunks bajo 50KB
- ✅ Tree shaking automático
- ✅ Minificación con Terser
- ✅ First Paint < 1.5s

**Backend:**
- ✅ Prisma connection pooling
- ✅ Compresión gzip de respuestas
- ✅ Rate limiting para protección
- ✅ Queries optimizadas con includes selectivos

### 8.3 Seguridad

**Implementado:**
- ✅ JWT con expiración 24h
- ✅ Bcrypt (10 rounds) para passwords
- ✅ Helmet para headers HTTP seguros
- ✅ Rate limiting (100 req/15min global, 5 req/15min login)
- ✅ CORS configurado
- ✅ Validación de input con Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention (Vue escapa por defecto)

**Headers de Seguridad (Helmet):**
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### 8.4 Validación de Datos

**Zod Schemas:**
- ✅ 7 schemas de validación
- ✅ Errores descriptivos automáticos
- ✅ Type inference para TypeScript
- ✅ Validación consistente en todos los endpoints

**Campos Validados:**
- Strings (min/max length, regex patterns)
- Numbers (min/max, integer, positive)
- Arrays (min items, item validation)
- Objects (shape validation)
- Dates (format, range)

### 8.5 Manejo de Imágenes

**Formato:**
- Almacenadas como LONGBLOB en MySQL
- Convertidas a base64 en backend
- Formato: `data:image/jpeg;base64,<string>`
- Renderizadas directamente en `<img>` tags

**Optimización:**
- Conversión en backend (no en DB)
- Caché en frontend
- Lazy loading de imágenes

---

## 9. Roles y Permisos

### 9.1 Rol: Cliente

**Descripción:** Usuario final del sistema.

**Permisos:**
- ✅ Ver dashboard propio
- ✅ Ver catálogo de productos
- ✅ Ver ofertas disponibles
- ✅ Crear/editar/eliminar pre-pedidos propios
- ✅ Ver historial de pedidos propios (principal + secundario)
- ✅ Ver historial de pagos propios
- ✅ Ver y editar perfil propio
- ✅ Cambiar contraseña propia

**Restricciones:**
- ❌ Ver datos de otros clientes
- ❌ Ver todos los pre-pedidos del sistema
- ❌ Acceder como administrador
- ❌ Modificar productos u ofertas

### 9.2 Rol: Administrador (Futuro)

**Permisos Planificados:**
- Ver todos los clientes
- Gestionar productos (CRUD)
- Gestionar ofertas (CRUD)
- Ver todos los pre-pedidos
- Convertir pre-pedidos a pedidos
- Gestionar pedidos
- Registrar pagos
- Ver reportes y estadísticas

---

## 10. Flujos de Usuario Principales

### Flujo 1: Cliente Nueva Oferta

```
LOGIN
→ DASHBOARD
→ Ver "Ofertas Destacadas"
→ Click en oferta interesante
→ OFERTAS: Ver lista completa
→ Ver detalle de oferta
→ Ver productos incluidos
→ Decidir agregar a pre-pedido
→ PREPEDIDOS: Crear nuevo
→ Agregar productos de oferta
→ Sistema aplica descuento automáticamente
→ Agregar más productos (opcional)
→ Guardar como borrador
→ Revisar totales
→ ENVIAR prepedido
→ Confirmación visual
```

### Flujo 2: Consulta de Deuda

```
LOGIN
→ DASHBOARD
→ Ver tarjeta de deuda:
  - Monto total
  - Días de deuda
  - Color indicador (verde/amarillo/rojo)
→ Click en "Ver Detalle"
→ PERFIL
→ Ver:
  - Deuda actual
  - Fecha último pago
  - Días de deuda calculados
→ Click en "Ver Pagos"
→ PAGOS
→ Ver últimos 5 pagos con:
  - Fechas
  - Montos
  - Medios de pago
  - Receptores
```

### Flujo 3: Crear Pre-Pedido con Productos Múltiples

```
PREPEDIDOS
→ Click "Nuevo Pre-Pedido"
→ FORMULARIO:
  1. Buscar producto 1 (autocompletado)
     → Seleccionar
     → Ingresar cantidad
     → Ver si hay ofertas disponibles
     → Aplicar oferta (opcional)
  2. Agregar producto 2
     → Seleccionar
     → Ingresar cantidad
  3. Agregar producto 3
     → Con oferta diferente
→ Ver resumen en tiempo real:
  - Subtotales por item
  - Descuentos aplicados
  - Total general
→ Agregar observaciones: "Entrega urgente"
→ Guardar como BORRADOR
→ Revisar todo
→ Click "ENVIAR"
→ Estado cambia a "ENVIADO"
→ Confirmación: "Pre-pedido enviado exitosamente"
```

---

## 11. Características Futuras (Roadmap)

### Corto Plazo (1-3 meses)

- [ ] Notificaciones push para nuevas ofertas
- [ ] Filtros avanzados en productos (precio, rentabilidad)
- [ ] Exportar pedidos a PDF
- [ ] Chat de soporte en vivo
- [ ] Favoritos de productos

### Mediano Plazo (3-6 meses)

- [ ] App móvil nativa (React Native)
- [ ] Sistema de puntos/recompensas
- [ ] Sugerencias de compra basadas en historial
- [ ] Comparador de precios con/sin oferta
- [ ] Notificaciones de stock bajo

### Largo Plazo (6-12 meses)

- [ ] Integración con sistemas de pago online
- [ ] Facturación electrónica
- [ ] Portal de administrador completo
- [ ] Analytics avanzados
- [ ] Machine learning para predicción de compras

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0
