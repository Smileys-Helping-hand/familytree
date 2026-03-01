const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User } = require('../models/index');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken', 'emailVerificationToken'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, profilePhoto } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.update({ name, profilePhoto });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        subscription: user.subscription,
        storageUsed: user.storageUsed
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/storage
// @desc    Get storage usage
// @access  Private
router.get('/storage', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'storageUsed']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      storage: { storageUsed: user.storageUsed }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/notifications
// @desc    Update notification preferences
// @access  Private
router.put('/notifications', protect, async (req, res, next) => {
  try {
    // Notification settings are stored client-side for now
    res.json({ success: true, message: 'Notification preferences saved' });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res, next) => {
  try {
    // Preferences are stored client-side for now
    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
