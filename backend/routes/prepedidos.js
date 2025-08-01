const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validatePrepedido } = require('../middleware/validation');
const {
  createPrepedido,
  getPrepedidos,
  getPrepedido,
  updatePrepedido,
  enviarPrepedido,
  deletePrepedido
} = require('../controllers/prepedidoController');

// POST /api/prepedidos
router.post('/', authenticateToken, validatePrepedido, createPrepedido);

// GET /api/prepedidos
router.get('/', authenticateToken, getPrepedidos);

// GET /api/prepedidos/:id
router.get('/:id', authenticateToken, getPrepedido);

// PUT /api/prepedidos/:id
router.put('/:id', authenticateToken, validatePrepedido, updatePrepedido);

// PUT /api/prepedidos/:id/enviar
router.put('/:id/enviar', authenticateToken, enviarPrepedido);

// DELETE /api/prepedidos/:id
router.delete('/:id', authenticateToken, deletePrepedido);

module.exports = router;