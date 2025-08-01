const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getProductos,  // ← Nueva función
  searchProductos,
  getProducto,
  getMarcas,
  getEnvases
} = require('../controllers/productosController');

// GET /api/productos - Lista todos los productos
router.get('/', authenticateToken, getProductos);

// GET /api/productos/search
router.get('/search', authenticateToken, searchProductos);

// GET /api/productos/marcas
router.get('/marcas', authenticateToken, getMarcas);

// GET /api/productos/envases
router.get('/envases', authenticateToken, getEnvases);

// GET /api/productos/:id
router.get('/:id', authenticateToken, getProducto);

module.exports = router;