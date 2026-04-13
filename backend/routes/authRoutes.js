// routes/authRoutes.js - Authentication API routes
const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, verifyPin, updatePin, sendOTP, verifyOTP } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Validation rules ─────────────────────────────────────────────────────────
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Routes ──────────────────────────────────────────────────────────────────
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe); // Protected route

// Security PIN Routes
router.post('/verify-pin', verifyPin);
router.post('/update-pin', protect, updatePin);

// SMS OTP Routes
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

module.exports = router;
