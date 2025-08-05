const { executeQuery } = require('../config/database');

// Get historical orders for authenticated user (last 365 days)
const getPedidos = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🔍 PEDIDOS ENDPOINT CALLED FOR USER:', userId);
        console.log('🔍 Request URL:', req.originalUrl);
        console.log('🔍 Request method:', req.method);
        
        // Get orders from last 365 days only - includes both primary and secondary accounts
        const pedidosQuery = `
            SELECT 
                p.id, 
                p.fechaEntrega, 
                p.estado, 
                p.importeTotal, 
                COALESCE(SUM(pi.cantidad), 0) as cantidadBultos, 
                CASE 
                    WHEN p.cliente = c.id THEN 'principal' 
                    WHEN p.cliente = c.idsecundario THEN 'secundario' 
                    ELSE 'desconocido' 
                END AS tipo_cliente, 
                CASE 
                    WHEN p.cliente = c.id THEN TRUE 
                    ELSE FALSE 
                END AS es_principal 
            FROM 
                clientes c 
                JOIN pedidos p ON (p.cliente = c.id OR p.cliente = c.idsecundario) 
                LEFT JOIN pedidoitems pi ON p.id = pi.pedidoId 
            WHERE 
                c.id = ? 
                AND p.fechaEntrega >= DATE_SUB(CURDATE(), INTERVAL 365 DAY) 
            GROUP BY 
                p.id, p.fechaEntrega, p.estado, p.importeTotal, tipo_cliente, es_principal 
            ORDER BY 
                p.fechaEntrega DESC
        `;
        
        console.log('🔍 Executing query for user:', userId);
        const pedidos = await executeQuery(pedidosQuery, [userId]);
        console.log('🔍 Query result:', pedidos.length, 'pedidos found');
        console.log('🔍 First few results:', pedidos.slice(0, 3));
        
        // Format response
        const formattedPedidos = pedidos.map(pedido => ({
            id: pedido.id,
            fechaEntrega: pedido.fechaEntrega,
            estado: pedido.estado,
            importeTotal: parseFloat(pedido.importeTotal) || 0,
            cantidadBultos: parseInt(pedido.cantidadBultos) || 0,
            tipo_cliente: pedido.tipo_cliente,
            es_principal: pedido.es_principal
        }));
        
        const response = {
            success: true,
            data: formattedPedidos
        };
        console.log('🔍 PEDIDOS RESPONSE:', JSON.stringify(response, null, 2));
        res.json(response);
        
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