const express = require('express');
const {
    createAdmin,
    loginAdmin,
    getAllCarsAdmin,
    getAllRentalsAdmin,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// ── ADMIN AUTH ────────────────────────────────
// POST /api/admin/register       → Admin sign up / profile creation
router.post('/register', createAdmin);

// POST /api/admin/login          → Admin login with credentials
router.post('/login', loginAdmin);

// ── ADMIN ENDPOINTS (PS REQUIREMENT) ──────────
// GET /api/admin/cars            → Admin fleet overview (admin only)
router.get('/cars', authMiddleware, isAdmin, getAllCarsAdmin);

// GET /api/admin/rentals         → Admin all rentals overview (admin only)
router.get('/rentals', authMiddleware, isAdmin, getAllRentalsAdmin);

module.exports = router;
