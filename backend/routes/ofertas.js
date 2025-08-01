const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getOfertas,
  getOfertasVigentesMes,
  getOferta,
  getOfertasPorProducto,
  getOfertasDestacadas
} = require('../controllers/ofertasController');

// GET /api/ofertas (base route for all offers)
router.get('/', authenticateToken, getOfertas);

// GET /api/ofertas/vigentes-mes
router.get('/vigentes-mes', authenticateToken, getOfertasVigentesMes);

// GET /api/ofertas/destacadas
router.get('/destacadas', authenticateToken, getOfertasDestacadas);

// GET /api/ofertas/por-producto/:producto_id
router.get('/por-producto/:producto_id', authenticateToken, getOfertasPorProducto);

// GET /api/ofertas/:id
router.get('/:id', authenticateToken, getOferta);

module.exports = router;