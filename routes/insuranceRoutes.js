const express = require('express');
const { createInsurance, getAllInsurance, getInsuranceById } = require('../controllers/insuranceController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateInsurance } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/insurance  (admin only)
router.post('/', authMiddleware, isAdmin, validateInsurance, createInsurance);

// GET /api/insurance  (admin only)
router.get('/', authMiddleware, isAdmin, getAllInsurance);

// GET /api/insurance/:id  (admin only)
router.get('/:id', authMiddleware, isAdmin, getInsuranceById);

module.exports = router;
