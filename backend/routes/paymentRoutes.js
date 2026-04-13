// routes/paymentRoutes.js - Payment API routes
const express = require('express');
const { processCheckout } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All payment routes required authentication
router.use(protect);

router.post('/checkout', processCheckout);

module.exports = router;
