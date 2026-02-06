const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateId } = require('../middleware/validateRequest');
const { createPrepedidoSchema, updatePrepedidoSchema } = require('../schemas/validation');
const {
  createPrepedido,
  getPrepedidos,
  getPrepedido,
  updatePrepedido,
  enviarPrepedido,
  deletePrepedido
} = require('../controllers/prepedidoController');

// POST /api/prepedidos - Validación Zod
router.post('/', authenticateToken, validateRequest(createPrepedidoSchema), createPrepedido);

// GET /api/prepedidos
router.get('/', authenticateToken, getPrepedidos);

// GET /api/prepedidos/:id - Validación de ID numérico
router.get('/:id', authenticateToken, validateId('id'), getPrepedido);

// PUT /api/prepedidos/:id - Validación Zod + ID
router.put('/:id', authenticateToken, validateId('id'), validateRequest(updatePrepedidoSchema), updatePrepedido);

// PUT /api/prepedidos/:id/enviar - Validación ID
router.put('/:id/enviar', authenticateToken, validateId('id'), enviarPrepedido);

// DELETE /api/prepedidos/:id - Validación ID
router.delete('/:id', authenticateToken, validateId('id'), deletePrepedido);

module.exports = router;