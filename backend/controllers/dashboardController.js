const prisma = require('../lib/prisma');

// Get dashboard data for the authenticated client only
const getDashboardData = async (req, res) => {
    try {
        // Validar que req.user existe
        if (!req.user) {
            console.error('❌ ERROR CRÍTICO: req.user es undefined en getDashboardData');
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const userId = req.user.id;
        
        // Validar que userId es válido
        if (!userId || typeof userId !== 'number' || userId <= 0) {
            console.error('❌ ERROR CRÍTICO: userId inválido en getDashboardData:', userId);
            return res.status(400).json({
                success: false,
                message: 'ID de usuario inválido'
            });
        }
        
        console.log('🔍 Dashboard endpoint called for user:', userId);
        
        // Obtener información del cliente
        const cliente = await prisma.clientes.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nombre: true,
                usuario: true,
                deuda: true,
                fechaUltimoPago: true,
                idSecundario: true
            }
        });
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Calcular días de deuda
        let diasDeuda = 0;
        if (cliente.fechaUltimoPago) {
            const hoy = new Date();
            diasDeuda = Math.floor(
                (hoy - new Date(cliente.fechaUltimoPago)) / (1000 * 60 * 60 * 24)
            );
        }
        
        const clienteData = {
            id: cliente.id,
            nombre: cliente.nombre,
            usuario: cliente.usuario,
            deuda: parseFloat(cliente.deuda.toString()),
            fechaUltimoPago: cliente.fechaUltimoPago,
            diasDeuda
        };
        
        console.log('🔍 Datos del cliente logueado:', clienteData);
        
        // Build where condition for primary and secondary accounts
        const whereConditionPedidos = {
            OR: [
                { cliente: cliente.id }
            ]
        };
        
        if (cliente.idSecundario && cliente.idSecundario !== cliente.id) {
            whereConditionPedidos.OR.push({ cliente: cliente.idSecundario });
        }
        
        // Verificar prepedidos abiertos
        const prepedidosAbiertos = await prisma.prepedidos_cabecera.count({
            where: {
                cliente_id: {
                    in: cliente.idSecundario && cliente.idSecundario !== cliente.id 
                        ? [cliente.id, cliente.idSecundario]
                        : [cliente.id]
                },
                estado: {
                    in: ['borrador', 'enviado']
                }
            }
        });
        
        // Obtener cantidad de pedidos del año actual
        const añoActual = new Date().getFullYear();
        const inicioAño = new Date(añoActual, 0, 1);
        const finAño = new Date(añoActual, 11, 31, 23, 59, 59);
        
        const pedidosAnoActual = await prisma.pedidos.count({
            where: {
                ...whereConditionPedidos,
                fechaEntrega: {
                    gte: inicioAño,
                    lte: finAño
                }
            }
        });
        
        // Obtener información de cuentas principales y secundarias
        const pedidos_principales = await prisma.pedidos.count({
            where: {
                cliente: cliente.id,
                fechaEntrega: {
                    gte: inicioAño,
                    lte: finAño
                }
            }
        });
        
        let pedidos_secundarios = 0;
        if (cliente.idSecundario && cliente.idSecundario !== cliente.id) {
            pedidos_secundarios = await prisma.pedidos.count({
                where: {
                    cliente: cliente.idSecundario,
                    fechaEntrega: {
                        gte: inicioAño,
                        lte: finAño
                    }
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                cliente: clienteData,
                prepedidosAbiertos,
                pedidosAnoActual,
                cuentasInfo: {
                    pedidos_principales,
                    pedidos_secundarios
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
        });
    }
};

// Get featured offers for dashboard (top 3 del mes actual)
const getOfertasDestacadas = async (req, res) => {
    try {
        const hoy = new Date();
        
        // Obtener ofertas vigentes actualmente (top 3)
        const ofertas = await prisma.ofertas.findMany({
            where: {
                activa: true,
                fecha_inicio: { lte: hoy },
                fecha_fin: { gte: hoy }
            },
            include: {
                ofertas_detalle: {
                    take: 1,
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                precioVenta: true,
                                foto: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 3
        });
        
        // Formatear ofertas con descuentos calculados
        const ofertasFormateadas = ofertas.map(oferta => {
            const producto = oferta.ofertas_detalle[0]?.productos;
            
            if (!producto) {
                return null;
            }
            
            let descuento_texto = '';
            let precio_original = parseFloat(producto.precioVenta.toString());
            let precio_oferta = precio_original;
            const valor_precio = parseFloat(oferta.valor_precio?.toString() || '0');
            
            // Calcular descuento según modo_precio
            if (oferta.modo_precio === 'descuento_pct') {
                descuento_texto = `-${valor_precio}%`;
                precio_oferta = precio_original * (1 - valor_precio / 100);
            } else if (oferta.modo_precio === 'precio_unitario') {
                precio_oferta = valor_precio;
                if (precio_original > 0) {
                    const desc = ((precio_original - precio_oferta) / precio_original) * 100;
                    descuento_texto = `-${Math.round(desc)}%`;
                }
            } else if (oferta.modo_precio === 'precio_pack') {
                precio_oferta = Math.max(0, precio_original - valor_precio);
                if (precio_original > 0) {
                    const desc = (valor_precio / precio_original) * 100;
                    descuento_texto = `-${Math.round(desc)}%`;
                }
            }
            
            // Contar productos en la oferta
            const cantidad_productos = oferta.ofertas_detalle.length;
            
            return {
                id: oferta.id,
                titulo: oferta.titulo,
                descripcion: oferta.descripcion,
                tipo: oferta.tipo,
                descuento_texto,
                fecha_inicio: oferta.fecha_inicio,
                fecha_fin: oferta.fecha_fin,
                producto_nombre: producto.nombre,
                producto_foto: producto.foto 
                    ? `data:image/jpeg;base64,${producto.foto.toString('base64')}` 
                    : null,
                producto_precio: precio_original,
                precio_original,
                precio_oferta: Math.round(precio_oferta * 100) / 100,
                cantidad_productos
            };
        }).filter(o => o !== null);
        
        res.json({
            success: true,
            data: ofertasFormateadas
        });
        
    } catch (error) {
        console.error('Error getting featured offers:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
        });
    }
};

module.exports = {
    getDashboardData,
    getOfertasDestacadas
};