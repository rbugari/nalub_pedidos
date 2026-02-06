const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateId } = require('../middleware/validateRequest');
const { productSearchSchema } = require('../schemas/validation');
const {
  getProductos,
  searchProductos,
  getProducto,
  getMarcas,
  getEnvases
} = require('../controllers/productosController');

// GET /api/productos - Lista todos los productos
router.get('/', authenticateToken, getProductos);

// GET /api/productos/search - Validación opcional de query params
router.get('/search', authenticateToken, searchProductos);

// GET /api/productos/marcas
router.get('/marcas', authenticateToken, getMarcas);

// GET /api/productos/envases
router.get('/envases', authenticateToken, getEnvases);

// GET /api/productos/:id - Validación de ID numérico
router.get('/:id', authenticateToken, validateId('id'), getProducto);

module.exports = router;