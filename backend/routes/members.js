const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

// @route   POST /api/members
// @desc    Create a family member
// @access  Private
router.post('/', protect, memberController.createMember);

// @route   GET /api/members/family/:familyId
// @desc    Get all members in a family
// @access  Private
router.get('/family/:familyId', protect, memberController.getFamilyMembers);

// @route   GET /api/members/family/:familyId/tree
// @desc    Get family tree (members + relationships)
// @access  Private
router.get('/family/:familyId/tree', protect, memberController.getFamilyTree);

// @route   POST /api/members/relationship
// @desc    Add relationship between members
// @access  Private
router.post('/relationship', protect, memberController.addRelationship);

// @route   DELETE /api/members/relationship
// @desc    Remove relationship between members
// @access  Private
router.delete('/relationship', protect, memberController.removeRelationship);

// @route   GET /api/members/:id
// @desc    Get single member
// @access  Private
router.get('/:id', protect, memberController.getMember);

// @route   PUT /api/members/:id
// @desc    Update member
// @access  Private
router.put('/:id', protect, memberController.updateMember);

// @route   DELETE /api/members/:id
// @desc    Delete member
// @access  Private
router.delete('/:id', protect, memberController.deleteMember);

module.exports = router;
