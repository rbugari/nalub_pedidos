# Documentación Técnica: Migración del Sistema de Ofertas

## 1. Resumen Ejecutivo

Este documento describe la migración del sistema de ofertas desde el esquema actual basado en descuentos (`descuento_porcentaje`/`descuento_monto`) al nuevo esquema basado en precios directos (`precio_original`/`precio_oferta`).

### Objetivo
Simplificar la gestión de ofertas utilizando precios directos en lugar de cálculos de descuentos, mejorando la claridad y reduciendo la complejidad de cálculos en tiempo real.

## 2. Cambios en el Esquema de Base de Datos

### 2.1 Esquema Actual (A Eliminar)
```sql
CREATE TABLE ofertas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT NULL,
    descuento_monto DECIMAL(10,2) DEFAULT NULL,
    activa TINYINT(1) DEFAULT 1,
    imagen_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INT(11) DEFAULT NULL
);
```

### 2.2 Nuevo Esquema (Objetivo)
```sql
CREATE TABLE ofertas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_original DECIMAL(10,2) DEFAULT NULL,
    precio_oferta DECIMAL(12,2) DEFAULT NULL,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INT(11) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_fechas_activa (fecha_inicio, fecha_fin, activa),
    KEY idx_activa_descuento (activa)
);
```

### 2.3 Campos Eliminados
- `descripcion` (TEXT)
- `descuento_porcentaje` (DECIMAL(5,2))
- `descuento_monto` (DECIMAL(10,2))
- `imagen_url` (VARCHAR(500))

### 2.4 Campos Agregados
- `precio_original` (DECIMAL(10,2)) - Precio original del producto
- `precio_oferta` (DECIMAL(12,2)) - Precio con descuento aplicado

## 3. Impacto en el Backend

### 3.1 Controladores Afectados

#### `ofertasController.js`
**Funciones a modificar:**
- `getOfertas()` - Líneas 11-18, 30-32
- `getOfertasVigentesMes()` - Líneas 49-56, 75-85
- `getOferta()` - Líneas 132-138
- `getOfertasPorProducto()` - Líneas 174-180
- `getOfertasDestacadas()` - Líneas 215-221

**Cambios requeridos:**
```javascript
// ANTES
const query = `
  SELECT 
    id, titulo, descripcion, fecha_inicio, fecha_fin,
    descuento_porcentaje, descuento_monto, id_producto,
    imagen_url, activa, created_at
  FROM ofertas`;

// DESPUÉS
const query = `
  SELECT 
    id, titulo, fecha_inicio, fecha_fin,
    precio_original, precio_oferta, id_producto,
    activa, created_at
  FROM ofertas`;
```

#### `dashboardController.js`
**Función afectada:**
- `getOfertasDestacadas()` - Líneas 85-91

### 3.2 Lógica de Cálculo de Precios

**ANTES (Cálculo dinámico):**
```javascript
let precioOferta = oferta.producto_precio || 0;
if (oferta.descuento_porcentaje) {
  precioOferta = precioOferta * (1 - oferta.descuento_porcentaje / 100);
} else if (oferta.descuento_monto) {
  precioOferta = Math.max(0, precioOferta - oferta.descuento_monto);
}
```

**DESPUÉS (Uso directo):**
```javascript
const precioOriginal = oferta.precio_original || oferta.producto_precio || 0;
const precioOferta = oferta.precio_oferta || precioOriginal;
```

## 4. Impacto en el Frontend

### 4.1 Componentes Afectados

#### `OfertaSelector.vue`
**Líneas a modificar:**
- Headers de tabla (línea 66): Cambiar "Precio Original" y "Precio Oferta"
- Template de precios (líneas 316-325)
- Lógica de cálculo de descuentos (líneas 90-96)

#### `Ofertas.vue`
**Cambios requeridos:**
- Headers de tabla (líneas 15-20)
- Mostrar precios directos en lugar de calcular descuentos

#### `Dashboard.vue`
**Sección afectada:**
- Componente de ofertas destacadas (líneas 164-196)
- Mostrar precio_original y precio_oferta directamente

### 4.2 Servicios
No requieren cambios significativos, solo ajustes en el manejo de respuestas.

## 5. Plan de Migración Paso a Paso

### Fase 1: Preparación (30 min)
1. **Backup de base de datos**
   ```bash
   mysqldump -u usuario -p nalub > backup_pre_migracion.sql
   ```

2. **Crear script de migración de datos**
3. **Preparar entorno de testing**

### Fase 2: Migración de Base de Datos (15 min)
1. **Agregar nuevos campos**
2. **Migrar datos existentes**
3. **Eliminar campos antiguos**
4. **Actualizar índices**

### Fase 3: Actualización del Backend (45 min)
1. **Modificar controladores de ofertas**
2. **Actualizar queries SQL**
3. **Eliminar lógica de cálculo de descuentos**
4. **Testing de endpoints**

### Fase 4: Actualización del Frontend (60 min)
1. **Modificar componentes de ofertas**
2. **Actualizar templates de precios**
3. **Eliminar cálculos de descuentos**
4. **Testing de UI**

### Fase 5: Testing y Validación (30 min)
1. **Pruebas de integración**
2. **Validación de datos**
3. **Testing de regresión**

## 6. Scripts de Migración

### 6.1 Script de Migración de Datos
```sql
-- Paso 1: Agregar nuevos campos
ALTER TABLE ofertas 
ADD COLUMN precio_original DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN precio_oferta DECIMAL(12,2) DEFAULT NULL;

-- Paso 2: Migrar datos existentes
UPDATE ofertas o
JOIN productos p ON o.id_producto = p.id
SET 
  o.precio_original = p.precioVenta,
  o.precio_oferta = CASE 
    WHEN o.descuento_porcentaje IS NOT NULL THEN 
      ROUND(p.precioVenta * (1 - o.descuento_porcentaje / 100), 2)
    WHEN o.descuento_monto IS NOT NULL THEN 
      GREATEST(0, p.precioVenta - o.descuento_monto)
    ELSE p.precioVenta
  END
WHERE o.id_producto IS NOT NULL;

-- Paso 3: Manejar ofertas sin producto específico
UPDATE ofertas 
SET precio_original = 0, precio_oferta = 0 
WHERE id_producto IS NULL AND precio_original IS NULL;

-- Paso 4: Eliminar campos antiguos
ALTER TABLE ofertas 
DROP COLUMN descripcion,
DROP COLUMN descuento_porcentaje,
DROP COLUMN descuento_monto,
DROP COLUMN imagen_url;

-- Paso 5: Actualizar índices
DROP INDEX idx_activa_descuento ON ofertas;
CREATE INDEX idx_activa_precios ON ofertas(activa, precio_oferta);
```

### 6.2 Script de Rollback
```sql
-- Restaurar desde backup
-- mysql -u usuario -p nalub < backup_pre_migracion.sql
```

## 7. Testing Requerido

### 7.1 Testing de Backend
- [ ] **GET /api/ofertas** - Verificar nuevos campos en respuesta
- [ ] **GET /api/ofertas/vigentes-mes** - Validar precios directos
- [ ] **GET /api/ofertas/:id** - Comprobar oferta individual
- [ ] **GET /api/ofertas/producto/:id** - Ofertas por producto
- [ ] **GET /api/dashboard/ofertas-destacadas** - Dashboard

### 7.2 Testing de Frontend
- [ ] **Página de Ofertas** - Mostrar precios correctos
- [ ] **Selector de Ofertas** - Funcionalidad de selección
- [ ] **Dashboard** - Ofertas destacadas
- [ ] **Prepedidos** - Integración con ofertas

### 7.3 Testing de Datos
- [ ] **Migración completa** - Todos los registros migrados
- [ ] **Integridad de precios** - Precios calculados correctamente
- [ ] **Ofertas activas** - Funcionalidad preservada
- [ ] **Relaciones** - Enlaces con productos mantenidos

## 8. Riesgos y Mitigaciones

### 8.1 Riesgos Identificados
1. **Pérdida de datos durante migración**
   - *Mitigación*: Backup completo antes de iniciar

2. **Cálculos incorrectos de precios**
   - *Mitigación*: Validación exhaustiva de datos migrados

3. **Downtime del sistema**
   - *Mitigación*: Migración en horario de menor uso

4. **Incompatibilidad con datos existentes**
   - *Mitigación*: Testing en ambiente de desarrollo

### 8.2 Plan de Contingencia
- Rollback automático si falla la migración
- Backup de datos disponible para restauración
- Notificación a usuarios sobre mantenimiento

## 9. Cronograma Estimado

| Fase | Duración | Responsable | Estado |
|------|----------|-------------|---------|
| Preparación | 30 min | Dev Team | ⏳ Pendiente |
| Migración BD | 15 min | DBA | ⏳ Pendiente |
| Backend | 45 min | Backend Dev | ⏳ Pendiente |
| Frontend | 60 min | Frontend Dev | ⏳ Pendiente |
| Testing | 30 min | QA Team | ⏳ Pendiente |
| **Total** | **3 horas** | | |

## 10. Checklist de Implementación

### Pre-migración
- [ ] Backup de base de datos realizado
- [ ] Scripts de migración validados
- [ ] Ambiente de testing preparado
- [ ] Equipo notificado sobre el mantenimiento

### Durante la migración
- [ ] Migración de esquema ejecutada
- [ ] Datos migrados correctamente
- [ ] Backend actualizado y desplegado
- [ ] Frontend actualizado y desplegado

### Post-migración
- [ ] Testing completo ejecutado
- [ ] Validación de datos realizada
- [ ] Sistema funcionando correctamente
- [ ] Documentación actualizada

---

**Documento creado:** `r new Date().toISOString()`  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Nalub