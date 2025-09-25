const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pagosController = require('../controllers/pagosController');

/**
 * @route GET /api/pagos
 * @desc Obtiene los últimos 5 pagos del cliente autenticado
 * @access Private (requiere autenticación)
 */
router.get('/', authenticateToken, pagosController.getPagos);

module.exports = router;