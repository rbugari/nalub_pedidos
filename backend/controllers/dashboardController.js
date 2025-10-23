const { executeQuery } = require('../config/database');

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
        
        // Obtener información de deuda del cliente logueado únicamente
        const clientQuery = `
            SELECT 
                id,
                nombre,
                usuario,
                deuda,
                fechaUltimoPago,
                CASE 
                    WHEN fechaUltimoPago IS NULL THEN 0
                    ELSE DATEDIFF(CURDATE(), fechaUltimoPago)
                END as diasDeuda
            FROM clientes 
            WHERE id = ?
        `;
        
        const clientData = await executeQuery(clientQuery, [userId]);
        console.log('🔍 Datos del cliente logueado:', clientData[0]);
        
        // Verificar si el cliente tiene pre-pedidos abiertos (incluye cuentas primarias y secundarias)
        const prepedidosQuery = `
            SELECT COUNT(*) as prepedidosAbiertos
            FROM clientes c
            JOIN prepedidos_cabecera pc ON (pc.cliente_id = c.id OR pc.cliente_id = c.idsecundario)
            WHERE c.id = ? AND pc.estado IN ('borrador', 'enviado')
        `;
        
        const prepedidosData = await executeQuery(prepedidosQuery, [userId]);
        
        // Obtener cantidad de pedidos del año actual (incluye cuentas primarias y secundarias)
        const pedidosAnoQuery = `
            SELECT COUNT(*) as pedidosAnoActual
            FROM clientes c
            JOIN pedidos p ON (p.cliente = c.id OR p.cliente = c.idsecundario)
            WHERE c.id = ? AND YEAR(p.fechaEntrega) = YEAR(CURDATE())
        `;
        
        const pedidosAnoData = await executeQuery(pedidosAnoQuery, [userId]);
        
        // Obtener información adicional sobre tipos de cuenta
        const cuentasInfoQuery = `
            SELECT 
                (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_principales,
                (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.idsecundario AND c.idsecundario != c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_secundarios
            FROM clientes c
            WHERE c.id = ?
        `;
        
        const cuentasInfoData = await executeQuery(cuentasInfoQuery, [userId]);
        

        
        res.json({
            success: true,
            data: {
                cliente: clientData[0] || null,
                prepedidosAbiertos: prepedidosData[0]?.prepedidosAbiertos || 0,
                pedidosAnoActual: pedidosAnoData[0]?.pedidosAnoActual || 0,
                cuentasInfo: {
                    pedidos_principales: cuentasInfoData[0]?.pedidos_principales || 0,
                    pedidos_secundarios: cuentasInfoData[0]?.pedidos_secundarios || 0
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
        const query = `
            SELECT 
                o.id, o.titulo, o.fecha_inicio, o.fecha_fin,
                o.precio_original, o.precio_oferta,
                p.nombre as producto_nombre, 
                CASE 
                    WHEN p.foto IS NOT NULL THEN CONCAT('data:image/jpeg;base64,', TO_BASE64(p.foto))
                    ELSE NULL 
                END as producto_foto, 
                p.precioVenta as producto_precio
            FROM ofertas o
            LEFT JOIN productos p ON o.id_producto = p.id
            WHERE o.activa = 1 
                AND o.fecha_inicio <= CURDATE() 
                AND o.fecha_fin >= CURDATE()
                AND MONTH(o.fecha_inicio) = MONTH(CURDATE())
                AND YEAR(o.fecha_inicio) = YEAR(CURDATE())
                AND (p.id IS NULL OR p.stockActual > 0)
            ORDER BY 
                CASE 
                    WHEN o.precio_original > 0 AND o.precio_oferta > 0 
                    THEN ((o.precio_original - o.precio_oferta) / o.precio_original) * 100
                    ELSE 0 
                END DESC,
                o.created_at DESC
            LIMIT 3
        `;
        
        const ofertas = await executeQuery(query);
        
        // Formatear ofertas con precios directos
        const ofertasFormateadas = ofertas.map(oferta => ({
            ...oferta,
            precio_original: oferta.precio_original || 0,
            precio_oferta: oferta.precio_oferta || 0,
            producto_precio: oferta.producto_precio || 0
        }));
        
        res.json({
            success: true,
            data: ofertasFormateadas
        });
        
    } catch (error) {
        console.error('Error getting featured offers:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getDashboardData,
    getOfertasDestacadas
};