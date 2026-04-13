// controllers/paymentController.js - Handles simulated payment and tier upgrades
const User = require('../models/User');

// @desc    Process a simulated checkout and upgrade user tier
// @route   POST /api/payments/checkout
// @access  Private
exports.processCheckout = async (req, res) => {
  try {
    const { tier, cardLastFour, amount } = req.body;

    if (!['plus', 'pro'].includes(tier)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription tier targeted.' });
    }

    // SIMULATION: In a real app, you would integrate Stripe/Razorpay here.
    // We simulate a successful transaction verification.
    console.log(`[Payment] Processing ₹${amount} for ${req.user.email} -> Tier: ${tier}`);
    
    // Artificial delay to simulate real bank processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update user tier
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.tier = tier;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to Nest ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
      tier: user.tier,
      transactionId: `txn_${Math.random().toString(36).substr(2, 12)}`
    });
  } catch (error) {
    console.error('Payment Processing Error:', error);
    res.status(500).json({ success: false, message: 'Payment gateway error. Please try again.' });
  }
};
