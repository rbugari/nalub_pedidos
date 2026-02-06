const express = require('express');
const router = express.Router();
const { getPedidos, getPedido, updatePedido } = require('../controllers/pedidosController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateId } = require('../middleware/validateRequest');
const { updatePedidoStatusSchema } = require('../schemas/validation');

// Get historical orders with pagination and filters
router.get('/', authenticateToken, getPedidos);

// Get specific order details
router.get('/:id', authenticateToken, validateId('id'), getPedido);

// Update order status
router.put('/:id', authenticateToken, validateId('id'), validateRequest(updatePedidoStatusSchema), updatePedido);

module.exports = router;