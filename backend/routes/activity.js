const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// @route   GET /api/activity
// @desc    Get recent activity (optionally filter by family)
// @access  Private
router.get('/', protect, activityController.getRecentActivities);

module.exports = router;
