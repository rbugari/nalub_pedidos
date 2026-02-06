# 📌 Sistema de Ofertas — Modelo Unificado (Cabecera + Detalle)

## 1. Objetivo

Implementar un sistema de promociones flexible que permita administrar:

- Ofertas simples por producto  
- Ofertas por cantidad mínima  
- Combos fijos (bundles)  
- Ofertas por mix de productos (combinación libre)

Todo bajo un modelo único, fácil de administrar en el módulo de backoffice (Scriptcase),
sin complicar la experiencia del usuario final.

---

## 2. Principio de diseño

El sistema se basa en un patrón clásico:

### ✅ Cabecera + Detalle

- **Cabecera (`ofertas`)**  
  Define la regla comercial: vigencia, tipo, precio, mínimos, etc.

- **Detalle (`ofertas_detalle`)**  
  Define qué productos participan en la oferta.

Este esquema permite soportar todos los tipos de promociones con una sola estructura.

---

## 3. Modelo de Datos

---

### 3.1 Tabla Cabecera: `ofertas`

Contiene la definición principal de la oferta.

| Campo | Descripción |
|------|-------------|
| id | Identificador único |
| titulo | Nombre visible de la promoción |
| descripcion | Explicación comercial |
| fecha_inicio / fecha_fin | Vigencia |
| activa | Flag lógico |
| tipo | Tipo funcional de oferta |
| modo_precio | Forma de cálculo |
| valor_precio | Precio o descuento |
| min_unidades_total | Mínimo requerido (si aplica) |
| unidad_base | Unidad o caja (si aplica) |

---

### 3.2 Tabla Detalle: `ofertas_detalle`

Define los productos que participan en una oferta.

| Campo | Descripción |
|------|-------------|
| id | PK |
| oferta_id | FK hacia ofertas |
| producto_id | Producto participante |
| unidades_fijas | Solo para bundles (cantidad obligatoria) |

---

## 4. Tipos de Oferta

---

## 4.1 Oferta Unitaria

### Qué es
Un producto puntual baja su precio durante un período.

### Ejemplo
ADVANCED 0W-16 pasa de 16.500 a 13.990 en diciembre.

---

## 4.2 Oferta por Cantidad Mínima

### Qué es
Un producto obtiene precio especial solo si se compra al menos X unidades.

### Ejemplo
Llevando 3 unidades del pack ADVANCED, cada una cuesta 69.900.

---

## 4.3 Oferta Bundle (Combo fijo)

### Qué es
Un conjunto fijo de productos con cantidades obligatorias y precio único.

### Ejemplo
Combo Premium: A + B + C por 45.000.

---

## 4.4 Oferta Mix (Combinable)

### Qué es
Grupo de productos donde el cliente puede combinar libremente hasta llegar a un mínimo.

### Ejemplo
Elegí cualquier combinación de A, B, C. Llevando 3 unidades en total pagás 180.000.

---

## 5. Reglas de Validación (Admin)

- Unitaria / Mínima → exactamente 1 producto hijo  
- Bundle → >=2 productos y unidades_fijas obligatoria  
- Mix → >=2 productos y min_unidades_total obligatorio  

---

📌 Documento preparado para administración interna.
