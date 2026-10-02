const express = require('express');
const { createRental, getAllRentals, getRentalById, updateRentalStatus } = require('../controllers/rentalController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRental } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/rentals  (logged-in users can book)
router.post('/', authMiddleware, validateRental, createRental);

// GET /api/rentals  (user sees their own, admin sees all)
router.get('/', authMiddleware, getAllRentals);

// GET /api/rentals/:id  (user sees their own, admin sees any)
router.get('/:id', authMiddleware, getRentalById);

// PUT /api/rentals/:id/status  (admin only)
router.put('/:id/status', authMiddleware, isAdmin, updateRentalStatus);

module.exports = router;
