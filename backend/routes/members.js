const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinary');
// @route   GET /api/members/family/:familyId/tree/export
// @desc    Export family tree as JSON (public/external API)
// @access  Public (read-only)
router.get('/family/:familyId/tree/export', require('../controllers/memberController').exportFamilyTree);

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

// @route   POST /api/members/upload-photo
// @desc    Upload a member profile photo
// @access  Private
router.post('/upload-photo', protect, upload.single('file'), async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				error: 'No file uploaded'
			});
		}

		const familyId = req.body.familyId || 'general';
		const memberId = req.body.memberId || 'unassigned';

		const uploadResult = await uploadBuffer(req.file.buffer, {
			folder: `familytree/members/${familyId}/${memberId}`,
			use_filename: true,
			unique_filename: true,
			resource_type: 'image'
		});

		return res.json({
			success: true,
			url: uploadResult.secure_url,
			publicId: uploadResult.public_id,
			resourceType: uploadResult.resource_type
		});
	} catch (error) {
		return next(error);
	}
});

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
