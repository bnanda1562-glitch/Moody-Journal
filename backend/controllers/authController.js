const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { handleUpload } = require('../middleware/upload');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mood_journal_ai_jwt_secret_token_2026_key', {
    expiresIn: '30d'
  });
};

// @desc    Register User
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Set first registered user as admin (makes testing the admin page easier!)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        joinedAt: user.joinedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check user & include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        joinedAt: user.joinedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update name
    if (req.body.name) user.name = req.body.name;

    // Handle avatar upload if exists
    if (req.file) {
      const avatarUrl = await handleUpload(req.file);
      user.avatar = avatarUrl;
    } else if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    // Update password if requested
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        joinedAt: user.joinedAt,
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        achievements: user.achievements
      }
    });
  } catch (err) {
    next(err);
  }
};

// Mock Temporary Password Reset Tokens
const resetTokensStore = {};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User with that email does not exist' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Store token in simple mock store for 10 minutes
    resetTokensStore[resetToken] = {
      userId: user._id,
      expires: Date.now() + 10 * 60 * 1000 // 10 mins
    };

    // Return the reset token to frontend (in real app, this goes via email)
    res.json({
      success: true,
      message: 'Email reset simulation successful. Reset token generated.',
      resetToken // Returned directly so client can perform the reset
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, password } = req.body;

    const tokenData = resetTokensStore[resetToken];
    if (!tokenData || tokenData.expires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });
    }

    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = password;
    await user.save();

    // Clean token
    delete resetTokensStore[resetToken];

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};
