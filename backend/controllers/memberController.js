const User = require('../models/User');

// @desc    Get all members
// @route   GET /api/members
// @access  Private
exports.getMembers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update member role
// @route   PATCH /api/members/:id
// @access  Private/Admin
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'editor', 'viewer', 'uploader', 'downloader'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private/Admin
exports.deleteMember = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Admin create member
// @route   POST /api/members
// @access  Private/Admin
exports.createMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (role && !['admin', 'editor', 'viewer', 'uploader', 'downloader'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'viewer',
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
