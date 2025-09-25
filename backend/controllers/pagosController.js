const { executeQuery } = require('../config/database');

const pagosController = {
  /**
   * Obtiene los últimos 5 pagos del cliente autenticado
   * @param {Object} req - Request object (contiene clienteId del JWT)
   * @param {Object} res - Response object
   */
  async getPagos(req, res) {
    try {
      const clienteId = req.user.id;
      
      if (!clienteId) {
        return res.status(400).json({
          success: false,
          message: 'Cliente ID no encontrado en el token'
        });
      }

      const query = `
        SELECT 
          p.fechaRecep AS fecha, 
          t.nombre AS medio_pago, 
          p.importe, 
          p.receptor 
        FROM pagos p 
        INNER JOIN tipomediospago t ON p.tipoMedioPagoId = t.id 
        WHERE p.clienteId = ? 
        ORDER BY p.fechaRecep DESC, p.id DESC 
        LIMIT 5
      `;

      const rows = await executeQuery(query, [clienteId]);

      res.json({
        success: true,
        data: rows,
        message: 'Pagos obtenidos exitosamente'
      });

    } catch (error) {
      console.error('Error en pagosController.getPagos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener los pagos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = pagosController;