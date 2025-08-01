-- Nalub Pre-orders System Database Schema
-- This script creates all necessary tables for the system

-- Create database (uncomment if needed)
-- CREATE DATABASE nalub_prepedidos;
-- USE nalub_prepedidos;

-- Existing tables (assumed to exist)
-- clientes, productos, marcas, envases, tipoenvase, pedidos, pedidoitems

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
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    FOREIGN KEY (prepedido_id) REFERENCES prepedidos_cabecera(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_prepedido_producto (prepedido_id, producto_id),
    INDEX idx_prepedido (prepedido_id),
    INDEX idx_producto (producto_id)
);

-- Create ofertas table (read-only, managed by central system)
CREATE TABLE IF NOT EXISTS ofertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descuento_porcentaje DECIMAL(5,2) CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    descuento_monto DECIMAL(10,2) CHECK (descuento_monto >= 0),
    productos_aplicables JSON, -- Array of product IDs or 'all'
    activa BOOLEAN DEFAULT TRUE,
    imagen_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fechas_activa (fecha_inicio, fecha_fin, activa),
    INDEX idx_activa_descuento (activa, descuento_porcentaje)
);

-- Insert sample data for testing

-- Sample offers (for testing)
INSERT INTO ofertas (titulo, descripcion, fecha_inicio, fecha_fin, descuento_porcentaje, productos_aplicables, activa, imagen_url) VALUES
('Descuento 15% en Bebidas', 'Descuento especial en todas las bebidas del mes', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 15.00, '["all"]', TRUE, 'https://example.com/offer1.jpg'),
('Promoción Cervezas', 'Descuento en cervezas seleccionadas', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 20.00, '[1, 2, 3]', TRUE, 'https://example.com/offer2.jpg'),
('Oferta Especial Vinos', 'Descuento en vinos premium', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 25.00, '[4, 5, 6]', TRUE, 'https://example.com/offer3.jpg');

-- Sample pre-orders (for testing)
-- Note: These assume cliente_id 1 exists
INSERT INTO prepedidos_cabecera (cliente_id, estado, observaciones) VALUES
(1, 'borrador', 'Pedido de prueba en borrador'),
(1, 'enviado', 'Pedido de prueba enviado');

-- Sample pre-order items (for testing)
-- Note: These assume producto_id 1, 2 exist
INSERT INTO prepedidos_items (prepedido_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 5, 25.50),
(1, 2, 3, 18.75),
(2, 1, 2, 25.50);