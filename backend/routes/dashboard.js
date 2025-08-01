const express = require('express');
const router = express.Router();
const { getDashboardData, getOfertasDestacadas } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard data
router.get('/', authenticateToken, getDashboardData);

// Get featured offers for dashboard
router.get('/ofertas-destacadas', authenticateToken, getOfertasDestacadas);

module.exports = router;