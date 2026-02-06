const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { login, changePassword } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');
const { loginSchema, changePasswordSchema } = require('../schemas/validation');

// POST /api/auth/login con validación Zod
router.post('/login', validateRequest(loginSchema), login);

// PUT /api/auth/change-password con validación Zod
router.put('/change-password', authenticateToken, validateRequest(changePasswordSchema), changePassword);

module.exports = router;