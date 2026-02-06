# 📡 Documentación de API - Sistema Nalub Pedidos

## Información General

**Base URL:** `http://localhost:3001/api` (desarrollo)  
**Formato:** JSON  
**Autenticación:** JWT Bearer Token  
**Charset:** UTF-8  

---

## Tabla de Contenidos

1. [Autenticación](#1-autenticación)
2. [Dashboard](#2-dashboard)
3. [Productos](#3-productos)
4. [Ofertas](#4-ofertas)
5. [Prepedidos](#5-prepedidos)
6. [Pedidos](#6-pedidos)
7. [Pagos](#7-pagos)
8. [Usuario](#8-usuario)
9. [Códigos de Error](#9-códigos-de-error)
10. [Ejemplos de Uso](#10-ejemplos-de-uso)

---

## 1. Autenticación

### 1.1 Login

**Endpoint:** `POST /api/auth/login`  
**Autenticación:** No requerida  
**Rate Limit:** 5 intentos por 15 minutos  

**Request Body:**
```json
{
  "usuario": "20174737127",
  "password": "mi_password"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 14,
      "nombre": "FURBATTO DARIO",
      "email": "",
      "usuario": "20174737127"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

### 1.2 Cambiar Contraseña

**Endpoint:** `POST /api/auth/change-password`  
**Autenticación:** ✅ Requerida  

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "password_actual",
  "newPassword": "nueva_password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 2. Dashboard

### 2.1 Obtener Datos del Dashboard

**Endpoint:** `GET /api/dashboard`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "cliente": {
      "id": 14,
      "nombre": "FURBATTO DARIO",
      "usuario": "20174737127",
      "deuda": 606000,
      "diasDeuda": 199
    },
    "prepedidosAbiertos": 2,
    "pedidosAnoActual": 5,
    "cuentasInfo": {
      "pedidos_principales": 5,
      "pedidos_secundarios": 0
    }
  }
}
```

---

### 2.2 Obtener Ofertas Destacadas

**Endpoint:** `GET /api/dashboard/ofertas-destacadas`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Oferta Especial Febrero",
      "descripcion": "Descuento en productos seleccionados",
      "tipo": "descuento",
      "descuento_texto": "-20%",
      "fecha_inicio": "2026-02-01T00:00:00.000Z",
      "fecha_fin": "2026-02-28T23:59:59.000Z",
      "producto_nombre": "Aceite Cocinero 900ml",
      "producto_foto": "data:image/jpeg;base64,/9j/4AAQ...",
      "cantidad_productos": 3
    }
  ]
}
```

---

## 3. Productos

### 3.1 Listar Productos

**Endpoint:** `GET /api/productos`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "ACE001",
      "nombre": "Aceite Cocinero 900ml",
      "marca": "Cocinero",
      "marca_nombre": "Cocinero",
      "origen": "Argentina",
      "pack": 12,
      "envase": "Botella PET",
      "envase_nombre": "900ml PET",
      "stockMinimo": 100,
      "stockActual": 500,
      "stockReservado": 50,
      "precioCompra": 1500.00,
      "precioVenta": 2000.00,
      "precio1": 2400.00,
      "precio2": 2500.00,
      "precio3": 2600.00,
      "rentabilidad": 33.33,
      "foto": "data:image/jpeg;base64,/9j/4AAQ..."
    }
  ]
}
```

---

### 3.2 Buscar Productos

**Endpoint:** `GET /api/productos/search`  
**Autenticación:** ✅ Requerida  

**Query Parameters:**
- `q` (string, opcional): Término de búsqueda
- `marca` (number, opcional): ID de marca
- `envase` (number, opcional): ID de envase
- `page` (number, opcional, default: 1): Página actual
- `limit` (number, opcional, default: 50): Items por página

**Ejemplo:**
```
GET /api/productos/search?q=aceite&marca=1&page=1&limit=20
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "productos": [
      {
        "id": 1,
        "nombre": "Aceite Cocinero 900ml",
        "precio1": 2400.00,
        "stockActual": 500
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

### 3.3 Obtener Detalle de Producto

**Endpoint:** `GET /api/productos/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "ACE001",
    "nombre": "Aceite Cocinero 900ml",
    "marca_nombre": "Cocinero",
    "stockActual": 500,
    "precio1": 2400.00,
    "foto": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

---

### 3.4 Obtener Marcas

**Endpoint:** `GET /api/productos/marcas`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Cocinero"
    },
    {
      "id": 2,
      "nombre": "Natura"
    }
  ]
}
```

---

### 3.5 Obtener Envases

**Endpoint:** `GET /api/productos/envases`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "900ml PET",
      "litros": 0.9,
      "tipo": "Botella"
    },
    {
      "id": 2,
      "nombre": "1.5L PET",
      "litros": 1.5,
      "tipo": "Botella"
    }
  ]
}
```

---

## 4. Ofertas

### 4.1 Listar Ofertas

**Endpoint:** `GET /api/ofertas`  
**Autenticación:** ✅ Requerida  

**Query Parameters:**
- `page` (number, opcional, default: 1)
- `limit` (number, opcional, default: 20)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "ofertas": [
      {
        "id": 1,
        "titulo": "Oferta Especial Febrero",
        "descripcion": "Descuento en productos seleccionados",
        "tipo": "descuento",
        "fecha_inicio": "2026-02-01T00:00:00.000Z",
        "fecha_fin": "2026-02-28T23:59:59.000Z",
        "activa": true,
        "modo_precio": "descuento_pct",
        "valor_precio": 20.00,
        "min_unidades_total": 6,
        "unidades_totales": 12,
        "productos": [
          {
            "detalle_id": 1,
            "producto_id": 5,
            "producto_codigo": "ACE001",
            "producto_nombre": "Aceite Cocinero 900ml",
            "unidades_fijas": 12,
            "precio_original": 2000.00,
            "precio_con_oferta": 1600.00,
            "producto_foto": "data:image/jpeg;base64,/9j/4AAQ..."
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  }
}
```

---

### 4.2 Obtener Ofertas Vigentes del Mes

**Endpoint:** `GET /api/ofertas/vigentes-mes`  
**Autenticación:** ✅ Requerida  

**Descripción:** Retorna ofertas activas que comenzaron este mes y están vigentes hoy.

**Response:** Mismo formato que 4.1 pero filtrado por mes actual

---

### 4.3 Obtener Detalle de Oferta

**Endpoint:** `GET /api/ofertas/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "Oferta Especial",
    "productos": [...]
  }
}
```

---

### 4.4 Obtener Ofertas por Producto

**Endpoint:** `GET /api/ofertas/por-producto/:producto_id`  
**Autenticación:** ✅ Requerida  
**Validación:** producto_id debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Oferta Especial Febrero",
      "descuento_texto": "-20%"
    }
  ]
}
```

---

### 4.5 Calcular Precio con Oferta

**Endpoint:** `POST /api/ofertas/calcular-precio`  
**Autenticación:** ✅ Requerida  

**Request Body:**
```json
{
  "oferta_id": 1,
  "producto_id": 5,
  "cantidad": 12
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "precio_original": 2000.00,
    "precio_con_oferta": 1600.00,
    "descuento_aplicado": 400.00,
    "porcentaje_descuento": 20,
    "cumple_minimo": true,
    "unidades_minimas": 6,
    "unidades_solicitadas": 12
  }
}
```

---

## 5. Prepedidos

### 5.1 Listar Prepedidos

**Endpoint:** `GET /api/prepedidos`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cliente_id": 14,
      "cliente_nombre": "FURBATTO DARIO",
      "estado": "enviado",
      "fecha_creacion": "2026-02-01T10:00:00.000Z",
      "fecha_modificacion": "2026-02-01T11:30:00.000Z",
      "observaciones": "Entrega preferente mañana",
      "total_estimado": 48000.00,
      "items_count": 5
    }
  ]
}
```

---

### 5.2 Obtener Detalle de Prepedido

**Endpoint:** `GET /api/prepedidos/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cliente_id": 14,
    "estado": "borrador",
    "fecha_creacion": "2026-02-01T10:00:00.000Z",
    "observaciones": "Entrega preferente",
    "items": [
      {
        "id": 1,
        "producto_id": 5,
        "producto_codigo": "ACE001",
        "producto_nombre": "Aceite Cocinero 900ml",
        "cantidad": 12,
        "precio_estimado": 1600.00,
        "subtotal": 19200.00,
        "oferta_id": 1,
        "oferta_titulo": "Oferta Especial Febrero"
      }
    ],
    "total_estimado": 48000.00
  }
}
```

---

### 5.3 Crear Prepedido

**Endpoint:** `POST /api/prepedidos`  
**Autenticación:** ✅ Requerida  

**Request Body:**
```json
{
  "observaciones": "Entrega preferente mañana",
  "items": [
    {
      "productoId": 5,
      "cantidad": 12,
      "precioEstimado": 1600.00,
      "ofertaId": 1
    },
    {
      "productoId": 8,
      "cantidad": 6,
      "precioEstimado": 2400.00,
      "ofertaId": null
    }
  ]
}
```

**Validación:**
- `observaciones`: string, max 500 chars
- `items`: array, mínimo 1 item
- `productoId`: integer positivo, requerido
- `cantidad`: integer positivo, requerido
- `precioEstimado`: number positivo, requerido
- `ofertaId`: integer positivo o null, opcional

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "estado": "borrador",
    "total_estimado": 33600.00
  },
  "message": "Prepedido creado exitosamente"
}
```

---

### 5.4 Actualizar Prepedido

**Endpoint:** `PUT /api/prepedidos/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Request Body:** Mismo formato que 5.3

**Response Success (200):**
```json
{
  "success": true,
  "message": "Prepedido actualizado exitosamente",
  "data": {
    "id": 15,
    "total_estimado": 40000.00
  }
}
```

---

### 5.5 Enviar Prepedido

**Endpoint:** `PUT /api/prepedidos/:id/enviar`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Descripción:** Cambia el estado del prepedido de "borrador" a "enviado".

**Response Success (200):**
```json
{
  "success": true,
  "message": "Prepedido enviado exitosamente"
}
```

---

### 5.6 Eliminar Prepedido

**Endpoint:** `DELETE /api/prepedidos/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "message": "Prepedido eliminado exitosamente"
}
```

---

## 6. Pedidos

### 6.1 Listar Pedidos

**Endpoint:** `GET /api/pedidos`  
**Autenticación:** ✅ Requerida  

**Query Parameters:**
- `page` (number, opcional, default: 1)
- `limit` (number, opcional, default: 20)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "pedidos": [
      {
        "id": 20481,
        "fechaEntrega": "2025-07-28T00:00:00.000Z",
        "estado": "Entregado",
        "importeTotal": 606000,
        "cantidadBultos": 19,
        "tipo_cliente": "principal",
        "es_principal": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85
    }
  }
}
```

**Notas:**
- `tipo_cliente`: "principal", "secundario" o "desconocido"
- `es_principal`: true si es cuenta principal, false si es secundaria

---

### 6.2 Obtener Detalle de Pedido

**Endpoint:** `GET /api/pedidos/:id`  
**Autenticación:** ✅ Requerida  
**Validación:** ID debe ser numérico positivo

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 20481,
    "cliente": 14,
    "fechaEntrega": "2025-07-28T00:00:00.000Z",
    "estado": "Entregado",
    "importeTotal": 606000,
    "observaciones": "Entrega completa",
    "items": [
      {
        "id": 1,
        "producto_id": 5,
        "producto_nombre": "Aceite Cocinero 900ml",
        "cantidad": 24,
        "precio_unitario": 2000.00,
        "subtotal": 48000.00
      }
    ]
  }
}
```

---

## 7. Pagos

### 7.1 Obtener Historial de Pagos

**Endpoint:** `GET /api/pagos`  
**Autenticación:** ✅ Requerida  

**Descripción:** Retorna los últimos 5 pagos del cliente.

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fechaRecep": "2025-07-22T00:00:00.000Z",
      "medioPago": "Transferencia",
      "importe": 606000,
      "receptor": "Juan Pérez"
    },
    {
      "id": 2,
      "fechaRecep": "2025-06-15T00:00:00.000Z",
      "medioPago": "Efectivo",
      "importe": 300000,
      "receptor": "María García"
    }
  ]
}
```

**Tipos de Medio de Pago:**
- `1` = "Efectivo"
- `2` = "Transferencia"
- `3` = "Cheque"
- `4` = "Tarjeta"

---

## 8. Usuario

### 8.1 Obtener Perfil

**Endpoint:** `GET /api/users/profile`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "id": 14,
  "nombre": "FURBATTO DARIO",
  "email": "",
  "usuario": "20174737127",
  "telefono": "",
  "direccion": "",
  "deuda": 606000,
  "diasDeuda": 199,
  "fechaUltimoPago": "2025-07-22T00:00:00.000Z",
  "cuit": "20-17473712-7",
  "porcentaje1": 20,
  "porcentaje2": 25,
  "porcentaje3": 30
}
```

**Nota:** Este endpoint NO usa el wrapper `{success: true, data: {...}}`, retorna el objeto directamente.

---

### 8.2 Actualizar Perfil

**Endpoint:** `PUT /api/users/profile`  
**Autenticación:** ✅ Requerida  

**Request Body:**
```json
{
  "cuit": "20-17473712-7",
  "porcentaje1": 20,
  "porcentaje2": 25,
  "porcentaje3": 30
}
```

**Validación:**
- Campos opcionales: `cuit`, `porcentaje1`, `porcentaje2`, `porcentaje3`
- Porcentajes deben estar entre 0 y 100

**Response Success (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente"
}
```

---

### 8.3 Obtener Deuda

**Endpoint:** `GET /api/users/debt`  
**Autenticación:** ✅ Requerida  

**Response Success (200):**
```json
{
  "deuda": 606000,
  "diasDeuda": 199,
  "fechaUltimoPago": "2025-07-22T00:00:00.000Z"
}
```

---

## 9. Códigos de Error

### HTTP Status Codes

| Código | Significado | Uso Común |
|--------|-------------|-----------|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Error de validación de datos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para acceder |
| 404 | Not Found | Recurso no encontrado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

### Errores de Validación

**Formato de error de validación:**
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "cantidad",
      "message": "La cantidad debe ser mayor a 0",
      "code": "invalid_type"
    }
  ]
}
```

### Errores Comunes

**Token Inválido (401):**
```json
{
  "success": false,
  "message": "Token inválido",
  "code": "TOKEN_INVALID"
}
```

**Token Expirado (401):**
```json
{
  "success": false,
  "message": "Token expirado",
  "code": "TOKEN_EXPIRED"
}
```

**Rate Limit Excedido (429):**
```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Intenta nuevamente en 15 minutos."
}
```

---

## 10. Ejemplos de Uso

### 10.1 Flujo Completo de Login y Consulta

**JavaScript con Axios:**

```javascript
import axios from 'axios';

const baseURL = 'http://localhost:3001/api';

// 1. Login
async function login() {
  const response = await axios.post(`${baseURL}/auth/login`, {
    usuario: '20174737127',
    password: 'mi_password'
  });
  
  const token = response.data.data.token;
  localStorage.setItem('token', token);
  return token;
}

// 2. Configurar Axios con token
function setupAxios(token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 3. Obtener productos
async function getProductos() {
  const response = await axios.get(`${baseURL}/productos`);
  return response.data.data;
}

// Uso
const token = await login();
setupAxios(token);
const productos = await getProductos();
console.log(productos);
```

### 10.2 Crear un Prepedido

```javascript
async function crearPrepedido() {
  const prepedido = {
    observaciones: 'Entrega urgente',
    items: [
      {
        productoId: 5,
        cantidad: 12,
        precioEstimado: 1600.00,
        ofertaId: 1
      },
      {
        productoId: 8,
        cantidad: 6,
        precioEstimado: 2400.00,
        ofertaId: null
      }
    ]
  };

  const response = await axios.post(
    `${baseURL}/prepedidos`,
    prepedido
  );

  console.log('Prepedido creado:', response.data.data.id);
  return response.data.data;
}
```

### 10.3 Calcular Precio con Oferta

```javascript
async function calcularPrecio(ofertaId, productoId, cantidad) {
  const response = await axios.post(
    `${baseURL}/ofertas/calcular-precio`,
    {
      oferta_id: ofertaId,
      producto_id: productoId,
      cantidad: cantidad
    }
  );

  const { precio_original, precio_con_oferta, descuento_aplicado } = response.data.data;
  console.log(`Precio original: $${precio_original}`);
  console.log(`Precio con oferta: $${precio_con_oferta}`);
  console.log(`Ahorrás: $${descuento_aplicado}`);
  
  return response.data.data;
}
```

### 10.4 cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"20174737127","password":"mi_password"}'
```

**Obtener Dashboard (con token):**
```bash
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Crear Prepedido:**
```bash
curl -X POST http://localhost:3001/api/prepedidos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "observaciones": "Entrega urgente",
    "items": [
      {
        "productoId": 5,
        "cantidad": 12,
        "precioEstimado": 1600.00,
        "ofertaId": 1
      }
    ]
  }'
```

---

## 11. Rate Limiting

### Límites por Endpoint

| Endpoint | Límite | Ventana de Tiempo |
|----------|--------|-------------------|
| `POST /api/auth/login` | 5 requests | 15 minutos |
| Todos los demás | 100 requests | 15 minutos |

### Headers de Rate Limit

Las respuestas incluyen estos headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738858800
```

---

## 12. Versionado

**Versión Actual:** v1.0  
**Última Actualización:** Febrero 2026  

No hay versionado de API actualmente. Todos los endpoints están en `/api/*`.

---

## 13. Soporte y Documentación Adicional

- **Arquitectura:** Ver [ARCHITECTURE.md](ARCHITECTURE.md)
- **Base de Datos:** Ver [DATABASE.md](DATABASE.md)
- **Setup:** Ver [SETUP.md](SETUP.md)

---

**Changelog:**
- v1.0 (Feb 2026): Migración completa a Prisma ORM, 8 controllers migrados
