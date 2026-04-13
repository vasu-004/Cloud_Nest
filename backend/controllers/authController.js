// controllers/authController.js - Handles signup and login logic
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { validationResult } = require('express-validator');
const User = require('../models/User');


// ─── Helper: generate signed JWT ─────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ─── Helper: Send SMS using Fast2SMS ──────────────────────────────────────────
const sendSMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`\n--- [SMS LOG (MOCK)] ---`);
    console.log(`To: ${phone}`);
    console.log(`Code: ${otp}`);
    console.log(`Note: Set FAST2SMS_API_KEY in .env for real delivery.`);
    console.log(`------------------------\n`);
    return true;
  }

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'otp',
      variables_values: otp,
      numbers: phone,
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.return) {
      console.log(`✅ SMS sent successfully to ${phone}`);
      return true;
    }
    throw new Error(response.data.message || 'Fast2SMS failed to send SMS');
  } catch (error) {
    console.error('❌ SMS Sending Error:', error.response?.data || error.message);
    throw error;
  }
};

// ─── @route   POST /api/auth/signup ──────────────────────────────────────────
// ─── @desc    Register a new user ────────────────────────────────────────────
// ─── @access  Public ──────────────────────────────────────────────────────────
const signup = async (req, res) => {
  // Validate incoming request fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password is hashed by the pre-save hook in the model)
    const user = await User.create({ name, email, password });

    // Send back token and user info (excluding password)
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        preferences: user.preferences
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

// ─── @route   POST /api/auth/login ───────────────────────────────────────────
// ─── @desc    Authenticate user and return token ─────────────────────────────
// ─── @access  Public ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    // Find user and explicitly select password (excluded by default)
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      console.log(`[AUTH-DEBUG] Login failed: User not found for email '${cleanEmail}'`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Use the model method to compare hashed passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`[AUTH-DEBUG] Login failed: Invalid password for email '${cleanEmail}'`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Diagnostic Log
    console.log(`[AUTH] Login attempt: ${email} | Role: ${user.role || 'none'}`);

    // Security PIN Check (Admin Only)
    const isAdmin = user.role?.toLowerCase().trim() === 'admin' || user.email === 'admin@cloudnest.com';
    
    if (isAdmin) {
      console.log(`[AUTH] Admin detected. Requesting PIN verification for: ${email}`);
      return res.json({
        success: true,
        requiresPin: true,
        message: 'Administrator identification required.',
        userId: user._id
      });
    }

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        preferences: user.preferences
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── @route   POST /api/auth/verify-pin ──────────────────────────────────────
const verifyPin = async (req, res) => {
  const { userId, pin } = req.body;

  // Validate format: must be exactly 6 digits
  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits.' });
  }

  try {
    const user = await User.findById(userId).select('+securityPin +pinAttempts +pinLockedUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session. Please log in again.' });
    }

    // ── Lockout check ────────────────────────────────────────────────────
    if (user.pinLockedUntil && user.pinLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.pinLockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        locked: true,
        message: `Too many failed attempts. Account locked for ${minutesLeft} more minute(s).`,
      });
    }

    // ── No PIN set yet ───────────────────────────────────────────────────
    if (!user.securityPin) {
      return res.status(401).json({
        success: false,
        message: 'No Security PIN has been set. Please set one in Settings first.',
      });
    }

    // ── Compare bcrypt hash ──────────────────────────────────────────────
    const isMatch = await bcrypt.compare(pin, user.securityPin);

    if (!isMatch) {
      user.pinAttempts = (user.pinAttempts || 0) + 1;
      const remaining = Math.max(0, 5 - user.pinAttempts);

      if (user.pinAttempts >= 5) {
        user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        user.pinAttempts = 0;
        await user.save();
        return res.status(429).json({
          success: false,
          locked: true,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }

      await user.save();
      return res.status(401).json({
        success: false,
        message: `Incorrect PIN. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // ── Success: reset counters ──────────────────────────────────────────
    user.pinAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    console.log(`[AUTH] PIN verified for UserID: ${userId}`);
    res.json({
      success: true,
      message: 'PIN verified successfully.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        preferences: user.preferences
      },
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ success: false, message: 'PIN verification failed.' });
  }
};

// ─── @route   POST /api/auth/update-pin ──────────────────────────────────────
const updatePin = async (req, res) => {
  const { pin } = req.body;
  const userId = req.user._id;

  // Validate: exactly 6 digits
  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Hash PIN before storing
    const salt = await bcrypt.genSalt(12);
    user.securityPin = await bcrypt.hash(pin, salt);

    // Reset any lockout state when PIN is changed
    user.pinAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    res.json({ success: true, message: 'Security PIN updated successfully.' });
  } catch (error) {
    console.error('Update PIN error:', error);
    res.status(500).json({ success: false, message: 'Failed to update PIN.' });
  }
};

// ─── @route   GET /api/auth/me ────────────────────────────────────────────────
// ─── @desc    Get current logged-in user ─────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      tier: req.user.tier,
      avatar: req.user.avatar,
      twoFactorEnabled: req.user.twoFactorEnabled,
      preferences: req.user.preferences
    },
  });
};

// ─── @route   POST /api/auth/send-otp ─────────────────────────────────────────
const sendOTP = async (req, res) => {
  const { phone } = req.body;
  const userId = req.user._id;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    user.otpCode = await bcrypt.hash(otp, salt);
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save();

    // Call SMS helper
    await sendSMS(phone, otp);

    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// ─── @route   POST /api/auth/verify-otp ───────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select('+otpCode +otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // Success: Clear OTP fields and update phone
    user.otpCode = null;
    user.otpExpires = null;
    user.phone = phone;
    await user.save();

    res.json({ success: true, message: 'Phone number verified successfully!' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

module.exports = { signup, login, getMe, verifyPin, updatePin, sendOTP, verifyOTP };
