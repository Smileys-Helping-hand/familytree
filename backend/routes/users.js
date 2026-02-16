const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('families');
    
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
    const User = require('../models/User');
    const { name, profilePhoto } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, profilePhoto },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user
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
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      storage: user.storage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
