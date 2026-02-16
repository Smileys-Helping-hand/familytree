const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { protect } = require('../middleware/auth');

// @route   POST /api/families
// @desc    Create a new family
// @access  Private
router.post('/', protect, familyController.createFamily);

// @route   GET /api/families
// @desc    Get all families user has access to
// @access  Private
router.get('/', protect, familyController.getMyFamilies);

// @route   GET /api/families/:id
// @desc    Get single family
// @access  Private
router.get('/:id', protect, familyController.getFamily);

// @route   PUT /api/families/:id
// @desc    Update family
// @access  Private
router.put('/:id', protect, familyController.updateFamily);

// @route   DELETE /api/families/:id
// @desc    Delete family
// @access  Private
router.delete('/:id', protect, familyController.deleteFamily);

// @route   POST /api/families/:id/invite
// @desc    Invite a member to family
// @access  Private
router.post('/:id/invite', protect, familyController.inviteMember);

// @route   POST /api/families/join
// @desc    Join family with invite token
// @access  Private
router.post('/join', protect, familyController.joinFamily);

// @route   DELETE /api/families/:id/members/:userId
// @desc    Remove family member
// @access  Private
router.delete('/:id/members/:userId', protect, familyController.removeMember);

// @route   PUT /api/families/:id/members/:userId/role
// @desc    Update family member role
// @access  Private
router.put('/:id/members/:userId/role', protect, familyController.updateMemberRole);

module.exports = router;
