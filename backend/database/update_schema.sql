-- Script para actualizar el esquema de prepedidos
-- Eliminar tablas existentes y recrearlas con la estructura correcta

USE nalub;

-- Eliminar tablas en orden correcto (items primero por foreign key)
DROP TABLE IF EXISTS prepedidos_items;
DROP TABLE IF EXISTS prepedidos_cabecera;

-- Recrear prepedidos_cabecera
CREATE TABLE prepedidos_cabecera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('borrador', 'enviado') DEFAULT 'borrador',
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    INDEX idx_cliente_estado (cliente_id, estado),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- Recrear prepedidos_items con estructura correcta
CREATE TABLE prepedidos_items (
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

-- Insertar datos de prueba
INSERT INTO prepedidos_cabecera (cliente_id, estado, observaciones) VALUES
(14, 'borrador', 'Pedido de prueba en borrador'),
(14, 'enviado', 'Pedido de prueba enviado');

INSERT INTO prepedidos_items (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones) VALUES
(1, 4, 'ADVANCED 0W-16 SP, SN PLUS, SN', 5, 'litros', 25.50, 'Observaciones del producto 1'),
(1, 5, 'ADVANCED 0W-16 SP, SN PLUS, SN', 3, 'litros', 18.75, 'Observaciones del producto 2'),
(2, 4, 'ADVANCED 0W-16 SP, SN PLUS, SN', 2, 'litros', 25.50, NULL);