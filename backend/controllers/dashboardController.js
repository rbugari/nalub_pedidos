const { executeQuery } = require('../config/database');

// Get dashboard data for the authenticated client only
const getDashboardData = async (req, res) => {
    try {
        console.log('🔍 Dashboard endpoint called for user:', req.user?.id);
        
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
        
        const clientData = await executeQuery(clientQuery, [req.user.id]);
        console.log('🔍 Datos del cliente logueado:', clientData[0]);
        
        // Verificar si el cliente tiene pre-pedidos abiertos (incluye cuentas primarias y secundarias)
        const prepedidosQuery = `
            SELECT COUNT(*) as prepedidosAbiertos
            FROM clientes c
            JOIN prepedidos_cabecera pc ON (pc.cliente_id = c.id OR pc.cliente_id = c.idsecundario)
            WHERE c.id = ? AND pc.estado IN ('borrador', 'enviado')
        `;
        
        const prepedidosData = await executeQuery(prepedidosQuery, [req.user.id]);
        
        // Obtener cantidad de pedidos del año actual (incluye cuentas primarias y secundarias)
        const pedidosAnoQuery = `
            SELECT COUNT(*) as pedidosAnoActual
            FROM clientes c
            JOIN pedidos p ON (p.cliente = c.id OR p.cliente = c.idsecundario)
            WHERE c.id = ? AND YEAR(p.fechaEntrega) = YEAR(CURDATE())
        `;
        
        const pedidosAnoData = await executeQuery(pedidosAnoQuery, [req.user.id]);
        
        // Obtener información adicional sobre tipos de cuenta
        const cuentasInfoQuery = `
            SELECT 
                (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_principales,
                (SELECT COUNT(*) FROM pedidos p WHERE p.cliente = c.idsecundario AND c.idsecundario != c.id AND YEAR(p.fechaEntrega) = YEAR(CURDATE())) as pedidos_secundarios
            FROM clientes c
            WHERE c.id = ?
        `;
        
        const cuentasInfoData = await executeQuery(cuentasInfoQuery, [req.user.id]);
        

        
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
                o.id, o.titulo, o.descripcion, o.fecha_inicio, o.fecha_fin,
                o.descuento_porcentaje, o.descuento_monto, o.imagen_url,
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
            ORDER BY 
                CASE 
                    WHEN o.descuento_porcentaje IS NOT NULL THEN o.descuento_porcentaje 
                    ELSE 0 
                END DESC,
                o.created_at DESC
            LIMIT 3
        `;
        
        const ofertas = await executeQuery(query);
        
        res.json({
            success: true,
            data: ofertas
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