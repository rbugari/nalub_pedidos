const prisma = require('../lib/prisma');

// Get historical orders for authenticated user (last 365 days)
const getPedidos = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🔍 PEDIDOS ENDPOINT CALLED FOR USER:', userId);
        console.log('🔍 Request URL:', req.originalUrl);
        console.log('🔍 Request method:', req.method);
        
        // Calculate date 365 days ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        // Get orders from last 365 days - includes both primary and secondary accounts
        // First get the client to check for secondary ID
        const cliente = await prisma.clientes.findUnique({
            where: { id: userId },
            select: { id: true, idSecundario: true }
        });
        
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        // Build where condition for primary and secondary accounts
        const whereCondition = {
            fechaEntrega: {
                gte: oneYearAgo
            },
            OR: [
                { cliente: cliente.id }
            ]
        };
        
        // Add secondary account condition if it exists
        if (cliente.idSecundario) {
            whereCondition.OR.push({ cliente: cliente.idSecundario });
        }
        
        const pedidos = await prisma.pedidos.findMany({
            where: whereCondition,
            include: {
                pedidoItems: {
                    select: {
                        cantidad: true
                    }
                },
                clientes: {
                    select: {
                        id: true,
                        idSecundario: true
                    }
                }
            },
            orderBy: {
                fechaEntrega: 'desc'
            }
        });
        
        console.log('🔍 Query result:', pedidos.length, 'pedidos found');
        
        // Format response with calculated fields
        const formattedPedidos = pedidos.map(pedido => {
            // Calculate total bultos from items
            const cantidadBultos = pedido.pedidoItems.reduce(
                (sum, item) => sum + item.cantidad, 
                0
            );
            
            // Determine client type (principal or secundario)
            const esPrincipal = pedido.cliente === cliente.id;
            const tipoCliente = esPrincipal ? 'principal' : 'secundario';
            
            return {
                id: pedido.id,
                fechaEntrega: pedido.fechaEntrega,
                estado: pedido.estado,
                importeTotal: parseFloat(pedido.importeTotal.toString()) || 0,
                cantidadBultos: cantidadBultos || 0,
                tipo_cliente: tipoCliente,
                es_principal: esPrincipal
            };
        });
        
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
        
        // Validate ID
        const pedidoId = parseInt(id);
        if (isNaN(pedidoId)) {
            return res.status(400).json({ error: 'ID de pedido inválido' });
        }
        
        // Get order with all details, including check for secondary account
        const cliente = await prisma.clientes.findUnique({
            where: { id: userId },
            select: { id: true, idSecundario: true }
        });
        
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        // Check if order belongs to primary or secondary account
        const whereCondition = {
            id: pedidoId,
            OR: [
                { cliente: cliente.id }
            ]
        };
        
        if (cliente.idSecundario) {
            whereCondition.OR.push({ cliente: cliente.idSecundario });
        }
        
        const pedido = await prisma.pedidos.findFirst({
            where: whereCondition,
            include: {
                pedidoItems: {
                    include: {
                        productos: {
                            include: {
                                marcas: true,
                                envases: {
                                    include: {
                                        tipoEnvase: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        });
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Format response
        const formattedPedido = {
            id: pedido.id,
            fecha: pedido.fecha,
            estado: pedido.estado,
            importeTotal: parseFloat(pedido.importeTotal.toString()) || 0,
            observacion: pedido.observacion,
            total: parseFloat(pedido.importeTotal.toString()) || 0,
            items: pedido.pedidoItems.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precioUnitario.toString()) || 0,
                subtotal: (item.cantidad * parseFloat(item.precioUnitario.toString())) || 0,
                producto: {
                    id: item.productos.id,
                    nombre: item.productos.nombre,
                    codigo: item.productos.codigo,
                    precio: parseFloat(item.productos.precioVenta.toString()) || 0,
                    marca: item.productos.marcas?.nombre || null,
                    envase: item.productos.envases ? {
                        nombre: item.productos.envases.nombre,
                        litros: item.productos.envases.litros,
                        tipo: item.productos.envases.tipoEnvase?.nombre || null
                    } : null
                }
            }))
        };
        
        res.json(formattedPedido);
        
    } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Update order status
const updatePedido = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { estado } = req.body;
        
        // Validate ID
        const pedidoId = parseInt(id);
        if (isNaN(pedidoId)) {
            return res.status(400).json({ error: 'ID de pedido inválido' });
        }
        
        // Get client to check for secondary account
        const cliente = await prisma.clientes.findUnique({
            where: { id: userId },
            select: { id: true, idSecundario: true }
        });
        
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        // Check if order exists and belongs to user (primary or secondary)
        const whereCondition = {
            id: pedidoId,
            OR: [
                { cliente: cliente.id }
            ]
        };
        
        if (cliente.idSecundario) {
            whereCondition.OR.push({ cliente: cliente.idSecundario });
        }
        
        const existingPedido = await prisma.pedidos.findFirst({
            where: whereCondition,
            select: { id: true }
        });
        
        if (!existingPedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Update order status (Zod validation already checked estado is valid)
        await prisma.pedidos.update({
            where: { id: pedidoId },
            data: { estado }
        });
        
        res.json({ 
            success: true, 
            message: 'Estado del pedido actualizado correctamente' 
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getPedidos,
    getPedido,
    updatePedido
};