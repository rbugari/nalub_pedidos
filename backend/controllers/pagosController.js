const prisma = require('../lib/prisma');

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

      const pagos = await prisma.pagos.findMany({
        where: {
          clienteId: clienteId
        },
        select: {
          fechaRecep: true,
          tipoMedioPagoId: true,
          importe: true,
          receptor: true
        },
        orderBy: [
          { fechaRecep: 'desc' },
          { id: 'desc' }
        ],
        take: 5
      });

      // Formatear datos con nombre de medio de pago
      const pagosFormateados = pagos.map(pago => {
        let medioPago = '';
        switch (pago.tipoMedioPagoId) {
          case 1:
            medioPago = 'Efectivo';
            break;
          case 2:
            medioPago = 'Transferencia';
            break;
          case 3:
            medioPago = 'Cheque';
            break;
          case 4:
            medioPago = 'Tarjeta';
            break;
          default:
            medioPago = `Medio Pago #${pago.tipoMedioPagoId}`;
        }
        
        return {
          fecha: pago.fechaRecep,
          medio_pago: medioPago,
          importe: parseFloat(pago.importe.toString()),
          receptor: pago.receptor
        };
      });

      res.json({
        success: true,
        data: pagosFormateados,
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