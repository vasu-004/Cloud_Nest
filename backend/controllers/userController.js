const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user profile & preferences
// @route   PATCH /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences, role, tier, avatar } = req.body;
    
    // Find the user first and explicitly select the password field so Mongoose validation passes when we save!
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Apply updates
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (role) user.role = role;
    if (tier) user.tier = tier;
    
    if (preferences) {
      const currentPrefs = user.preferences ? (typeof user.preferences.toObject === 'function' ? user.preferences.toObject() : user.preferences) : {};
      user.preferences = { ...currentPrefs, ...preferences };
    }

    // Save with validators
    const updatedUser = await user.save();
    
    // Hide password for response
    const data = updatedUser.toObject();
    delete data.password;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Initiate 2FA Setup (Send mock OTP)
// @route   POST /api/users/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    // In a real app, generate a secret and send SMS/Email
    // For this demo, we'll return a fixed OTP for the user to enter
    const mockOTP = '123456'; 
    
    res.status(200).json({ 
      success: true, 
      message: 'OTP sent to your registered contact',
      mockOTP // Sending this only for the demo walkthrough
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify 2FA and Enable
// @route   POST /api/users/2fa/verify
// @access  Private
exports.verify2FA = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: true }, {
      new: true
    }).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
