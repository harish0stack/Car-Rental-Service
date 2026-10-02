const express = require('express');
const { getAllCars, getCarById, createCar, updateCar, deleteCar } = require('../controllers/carController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateCar } = require('../middleware/validationMiddleware');

const router = express.Router();

// GET /api/cars  (public - anyone can browse cars)
router.get('/', getAllCars);

// GET /api/cars/:id  (public)
router.get('/:id', getCarById);

// POST /api/cars  (admin only)
router.post('/', authMiddleware, isAdmin, validateCar, createCar);

// PUT /api/cars/:id  (admin only)
router.put('/:id', authMiddleware, isAdmin, updateCar);

// DELETE /api/cars/:id  (admin only)
router.delete('/:id', authMiddleware, isAdmin, deleteCar);

module.exports = router;
