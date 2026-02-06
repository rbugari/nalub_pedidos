const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateId } = require('../middleware/validateRequest');
const { calcularPrecioOfertaSchema } = require('../schemas/validation');
const {
  getOfertas,
  getOfertasVigentesMes,
  getOferta,
  getOfertasPorProducto,
  getOfertasDestacadas,
  calcularPrecio
} = require('../controllers/ofertasController');

// GET /api/ofertas (base route for all offers)
router.get('/', authenticateToken, getOfertas);

// GET /api/ofertas/vigentes-mes (público para selector de ofertas)
router.get('/vigentes-mes', getOfertasVigentesMes);

// GET /api/ofertas/destacadas
router.get('/destacadas', authenticateToken, getOfertasDestacadas);

// GET /api/ofertas/por-producto/:producto_id
router.get('/por-producto/:producto_id', authenticateToken, validateId('producto_id'), getOfertasPorProducto);

// POST /api/ofertas/calcular-precio
router.post('/calcular-precio', authenticateToken, validateRequest(calcularPrecioOfertaSchema), calcularPrecio);

// GET /api/ofertas/:id
router.get('/:id', authenticateToken, validateId('id'), getOferta);

module.exports = router;