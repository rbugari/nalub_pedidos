-- Nalub Pre-orders System Database Schema
-- This script creates all necessary tables for the system

-- Create database (uncomment if needed)
-- CREATE DATABASE nalub_prepedidos;
-- USE nalub_prepedidos;

-- Existing tables (assumed to exist)
-- clientes, productos, marcas, envases, tipoEnvase, pedidos, pedidoItems

-- Create prepedidos_cabecera table
CREATE TABLE IF NOT EXISTS prepedidos_cabecera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('borrador', 'enviado') DEFAULT 'borrador',
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    INDEX idx_cliente_estado (cliente_id, estado),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- Create prepedidos_items table
CREATE TABLE IF NOT EXISTS prepedidos_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prepedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    unidad VARCHAR(50) DEFAULT 'unidad',
    precio_estimado DECIMAL(10,2) DEFAULT 0 CHECK (precio_estimado >= 0),
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prepedido_id) REFERENCES prepedidos_cabecera(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_prepedido (prepedido_id),
    INDEX idx_producto (producto_id)
);

-- Create ofertas table (read-only, managed by central system)
CREATE TABLE IF NOT EXISTS ofertas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT NULL CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    descuento_monto DECIMAL(10,2) DEFAULT NULL CHECK (descuento_monto >= 0),
    activa TINYINT(1) DEFAULT 1,
    imagen_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INT(11) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_fechas_activa (fecha_inicio, fecha_fin, activa),
    KEY idx_activa_descuento (activa, descuento_porcentaje)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample data for testing

-- Sample offers (for testing) - Based on real data from ofertas.csv
-- Using current month dates to ensure offers are visible
INSERT INTO ofertas (titulo, descripcion, fecha_inicio, fecha_fin, descuento_porcentaje, activa, imagen_url, id_producto) VALUES
('Oferta especial del mes', '¡Descuento del 15% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 15.00, 1, NULL, 367),
('Oferta especial del mes', '¡Descuento del 10% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 10.00, 1, NULL, 281),
('Oferta especial del mes', '¡Descuento del 15% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 15.00, 1, NULL, 348),
('Oferta especial del mes', '¡Descuento del 20% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 20.00, 1, NULL, 262),
('Oferta especial del mes', '¡Descuento del 10% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 10.00, 1, NULL, 243),
('Oferta especial del mes', '¡Descuento del 15% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 15.00, 1, NULL, 268),
('Oferta especial del mes', '¡Descuento del 15% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 15.00, 1, NULL, 143),
('Oferta especial del mes', '¡Descuento del 20% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 20.00, 1, NULL, 223),
('Oferta especial del mes', '¡Descuento del 15% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 15.00, 1, NULL, 71),
('Oferta especial del mes', '¡Descuento del 10% durante este mes!', DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 10.00, 1, NULL, 344);

-- Sample pre-orders (for testing)
-- Note: These assume cliente_id 14 exists
INSERT INTO prepedidos_cabecera (cliente_id, estado, observaciones) VALUES
(14, 'borrador', 'Pedido de prueba en borrador'),
(14, 'enviado', 'Pedido de prueba enviado');

-- Sample pre-order items (for testing)
-- Note: These assume producto_id 1, 2 exist
INSERT INTO prepedidos_items (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones) VALUES
(1, 1, 'Producto de prueba 1', 5, 'unidad', 25.50, 'Observaciones del producto 1'),
(1, 2, 'Producto de prueba 2', 3, 'kg', 18.75, 'Observaciones del producto 2'),
(2, 1, 'Producto de prueba 1', 2, 'unidad', 25.50, NULL);

-- Update some products with sample images (small base64 encoded images for testing)
-- This is a simple 1x1 pixel red image in base64
UPDATE productos SET foto = FROM_BASE64('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==') WHERE id IN (1, 2, 3, 4, 5) AND EXISTS (SELECT 1 FROM productos WHERE id IN (1, 2, 3, 4, 5));