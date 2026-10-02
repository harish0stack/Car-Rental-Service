const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/auth/register       → customer registration
router.post('/register', validateRegister, register);

// POST /api/auth/login          → customer login
router.post('/login', validateLogin, login);

// GET /api/auth/profile         → protected, returns logged-in customer info
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
