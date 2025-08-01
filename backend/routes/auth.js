const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { login, changePassword } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', login);

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;