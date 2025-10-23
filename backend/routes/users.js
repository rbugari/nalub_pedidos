const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile, getDebt } = require('../controllers/userController');

// GET /api/users/profile (cambiar de /user/ a /users/)
router.get('/profile', authenticateToken, getProfile);

// PUT /api/users/profile - Actualizar perfil
router.put('/profile', authenticateToken, updateProfile);

// GET /api/users/debt
router.get('/debt', authenticateToken, getDebt);

module.exports = router;