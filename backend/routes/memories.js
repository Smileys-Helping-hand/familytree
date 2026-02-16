const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const { protect, checkFamilyAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/memories
// @desc    Create a memory
// @access  Private
router.post('/', protect, upload.array('files', 10), memoryController.createMemory);

// @route   GET /api/memories/family/:familyId
// @desc    Get all memories for a family
// @access  Private
router.get('/family/:familyId', protect, checkFamilyAccess('viewer'), memoryController.getFamilyMemories);

// @route   GET /api/memories/:id
// @desc    Get single memory
// @access  Private
router.get('/:id', protect, memoryController.getMemory);

// @route   PUT /api/memories/:id
// @desc    Update memory
// @access  Private
router.put('/:id', protect, memoryController.updateMemory);

// @route   DELETE /api/memories/:id
// @desc    Delete memory
// @access  Private
router.delete('/:id', protect, memoryController.deleteMemory);

// @route   POST /api/memories/:id/like
// @desc    Like a memory
// @access  Private
router.post('/:id/like', protect, memoryController.likeMemory);

// @route   POST /api/memories/:id/comment
// @desc    Add comment to memory
// @access  Private
router.post('/:id/comment', protect, memoryController.addComment);

// @route   DELETE /api/memories/:id/comment/:commentId
// @desc    Delete comment
// @access  Private
router.delete('/:id/comment/:commentId', protect, memoryController.deleteComment);

module.exports = router;
