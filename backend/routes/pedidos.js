const express = require('express');
const router = express.Router();
const { getPedidos, getPedido, updatePedido } = require('../controllers/pedidosController');
const { authenticateToken } = require('../middleware/auth');

// Get historical orders with pagination and filters
router.get('/', authenticateToken, getPedidos);

// Get specific order details
router.get('/:id', authenticateToken, getPedido);

// Update order status
router.put('/:id', authenticateToken, updatePedido);

module.exports = router;