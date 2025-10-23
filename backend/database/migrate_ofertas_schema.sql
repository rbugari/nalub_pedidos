-- ========================================
-- MIGRACIÓN DEL ESQUEMA DE OFERTAS
-- De descuentos (descuento_porcentaje/descuento_monto) 
-- A precios directos (precio_original/precio_oferta)
-- ========================================

-- PASO 1: Crear backup de la tabla actual
CREATE TABLE ofertas_backup AS SELECT * FROM ofertas;

-- PASO 2: Agregar nuevos campos
ALTER TABLE ofertas 
ADD COLUMN precio_original DECIMAL(10,2) DEFAULT NULL COMMENT 'Precio original del producto',
ADD COLUMN precio_oferta DECIMAL(12,2) DEFAULT NULL COMMENT 'Precio con descuento aplicado';

-- PASO 3: Migrar datos existentes
-- Para ofertas con producto específico
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

-- Para ofertas sin producto específico (ofertas generales)
UPDATE ofertas 
SET precio_original = 0, precio_oferta = 0 
WHERE id_producto IS NULL AND precio_original IS NULL;

-- PASO 4: Verificar migración de datos
SELECT 
  COUNT(*) as total_ofertas,
  COUNT(precio_original) as con_precio_original,
  COUNT(precio_oferta) as con_precio_oferta,
  COUNT(CASE WHEN precio_original IS NULL THEN 1 END) as sin_precio_original,
  COUNT(CASE WHEN precio_oferta IS NULL THEN 1 END) as sin_precio_oferta
FROM ofertas;

-- PASO 5: Eliminar campos antiguos (CUIDADO: Esto es irreversible)
-- Descomenta las siguientes líneas solo después de verificar que la migración es correcta
/*
ALTER TABLE ofertas 
DROP COLUMN descripcion,
DROP COLUMN descuento_porcentaje,
DROP COLUMN descuento_monto,
DROP COLUMN imagen_url;
*/

-- PASO 6: Actualizar índices
-- Eliminar índice antiguo
DROP INDEX IF EXISTS idx_activa_descuento ON ofertas;

-- Crear nuevo índice para precios
CREATE INDEX idx_activa_precios ON ofertas(activa, precio_oferta);

-- PASO 7: Verificación final
SELECT 
  o.id, o.titulo, o.fecha_inicio, o.fecha_fin,
  o.precio_original, o.precio_oferta, o.activa,
  p.nombre as producto_nombre, p.precioVenta as precio_producto_actual
FROM ofertas o
LEFT JOIN productos p ON o.id_producto = p.id
WHERE o.activa = 1
ORDER BY o.id
LIMIT 10;

-- ========================================
-- SCRIPT DE ROLLBACK (En caso de emergencia)
-- ========================================
/*
-- Para hacer rollback completo:
DROP TABLE ofertas;
RENAME TABLE ofertas_backup TO ofertas;

-- Recrear índices originales
CREATE INDEX idx_fechas_activa ON ofertas(fecha_inicio, fecha_fin, activa);
CREATE INDEX idx_activa_descuento ON ofertas(activa, descuento_porcentaje);
*/