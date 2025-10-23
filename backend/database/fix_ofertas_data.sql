-- ========================================
-- SCRIPT PARA COMPLETAR MIGRACIÓN DE DATOS
-- Actualizar precio_original para ofertas sin este campo
-- ========================================

-- Verificar estado actual
SELECT 
  COUNT(*) as total_ofertas,
  COUNT(precio_original) as con_precio_original,
  COUNT(precio_oferta) as con_precio_oferta,
  COUNT(CASE WHEN precio_original IS NULL THEN 1 END) as sin_precio_original
FROM ofertas;

-- Actualizar ofertas que tienen producto pero no precio_original
UPDATE ofertas o
JOIN productos p ON o.id_producto = p.id
SET o.precio_original = p.precioVenta
WHERE o.precio_original IS NULL AND o.id_producto IS NOT NULL;

-- Para ofertas sin producto específico, usar precio_oferta como base
UPDATE ofertas 
SET precio_original = COALESCE(precio_oferta, 0)
WHERE precio_original IS NULL AND id_producto IS NULL;

-- Verificar resultado final
SELECT 
  COUNT(*) as total_ofertas,
  COUNT(precio_original) as con_precio_original,
  COUNT(precio_oferta) as con_precio_oferta,
  COUNT(CASE WHEN precio_original IS NULL THEN 1 END) as sin_precio_original
FROM ofertas;

-- Mostrar algunas ofertas para verificación
SELECT 
  o.id, o.titulo, o.fecha_inicio, o.fecha_fin,
  o.precio_original, o.precio_oferta, o.activa,
  p.nombre as producto_nombre, p.precioVenta as precio_producto_actual
FROM ofertas o
LEFT JOIN productos p ON o.id_producto = p.id
WHERE o.activa = 1
ORDER BY o.id
LIMIT 10;