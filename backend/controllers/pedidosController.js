const { executeQuery } = require('../config/database');

// Get historical orders for authenticated user
const getPedidos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, estado, fecha_desde, fecha_hasta } = req.query;
        
        const offset = (page - 1) * limit;
        
        // Build WHERE clause
        let whereClause = 'WHERE p.cliente = ?';
        const queryParams = [userId];
        
        if (estado) {
            whereClause += ' AND p.estado = ?';
            queryParams.push(estado);
        }
        
        if (fecha_desde) {
            whereClause += ' AND p.fecha >= ?';
            queryParams.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            whereClause += ' AND p.fecha <= ?';
            queryParams.push(fecha_hasta);
        }
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM pedidos p
            ${whereClause}
        `;
        const [{ total }] = await executeQuery(countQuery, queryParams);
        
        // Get orders with pagination
        const pedidosQuery = `
            SELECT p.id, p.fecha, p.estado, p.importeTotal, p.observacion,
                   COUNT(pi.id) as total_items,
                   SUM(pi.cantidad) as total_cantidad
            FROM pedidos p
            LEFT JOIN pedidoitems pi ON p.id = pi.pedidoId
            ${whereClause}
            GROUP BY p.id, p.fecha, p.estado, p.importeTotal, p.observacion
            ORDER BY p.fecha DESC
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(parseInt(limit), offset);
        const pedidos = await executeQuery(pedidosQuery, queryParams);
        
        // Format response
        const formattedPedidos = pedidos.map(pedido => ({
            ...pedido,
            total: parseFloat(pedido.importeTotal) || 0,
            total_items: parseInt(pedido.total_items) || 0,
            total_cantidad: parseInt(pedido.total_cantidad) || 0
        }));
        
        res.json({
            data: formattedPedidos,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: parseInt(total),
                items_per_page: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Get specific order details
const getPedido = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Get order header
        const pedidoQuery = `
            SELECT p.id, p.fecha, p.estado, p.importeTotal, p.observacion
            FROM pedidos p
            WHERE p.id = ? AND p.cliente = ?
        `;
        const [pedido] = await executeQuery(pedidoQuery, [id, userId]);
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Get order items with product details
        const itemsQuery = `
            SELECT pi.id, pi.cantidad, pi.precioUnitario,
                   pr.id as producto_id, pr.nombre as producto_nombre,
                   pr.codigo as producto_codigo, pr.precioVenta as producto_precio,
                   m.nombre as marca_nombre,
                   e.nombre as envase_nombre, e.litros as envase_litros,
                   te.nombre as tipo_envase_nombre
            FROM pedidoitems pi
            JOIN productos pr ON pi.productoId = pr.id
            LEFT JOIN marcas m ON pr.marca = m.id
            LEFT JOIN envases e ON pr.envase = e.id
            LEFT JOIN tipoenvase te ON e.tipoenvaseid = te.id
            WHERE pi.pedidoId = ?
            ORDER BY pi.id
        `;
        const items = await executeQuery(itemsQuery, [id]);
        
        // Format response
        const formattedPedido = {
            ...pedido,
            total: parseFloat(pedido.importeTotal) || 0,
            items: items.map(item => ({
                id: item.id,
                cantidad: parseInt(item.cantidad),
                precio_unitario: parseFloat(item.precioUnitario) || 0,
                subtotal: (parseInt(item.cantidad) * parseFloat(item.precioUnitario)) || 0,
                producto: {
                    id: item.producto_id,
                    nombre: item.producto_nombre,
                    codigo: item.producto_codigo,
                    precio: parseFloat(item.producto_precio) || 0,
                    marca: item.marca_nombre,
                    envase: {
                        nombre: item.envase_nombre,
                        litros: item.envase_litros,
                        tipo: item.tipo_envase_nombre
                    }
                }
            }))
        };
        
        res.json(formattedPedido);
        
    } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getPedidos,
    getPedido
};