const crypto = require('crypto');
const { Op } = require('sequelize');
const { Family, User, FamilyMembership, FamilyInvite } = require('../models');
const { recordActivity } = require('../utils/activity');

// @desc    Create a new family
exports.createFamily = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Family name is required'
      });
    }

    const family = await Family.create({
      name,
      description: description || '',
      createdBy: req.user.id
    });

    await FamilyMembership.create({
      familyId: family.id,
      userId: req.user.id,
      role: 'admin'
    });

    await recordActivity({
      familyId: family.id,
      userId: req.user.id,
      type: 'family_created',
      action: 'created a family',
      description: `${family.name} family created`,
      metadata: { familyId: family.id }
    });

    res.status(201).json({
      success: true,
      family
    });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create family'
    });
  }
};

// @desc    Get all families user belongs to
exports.getMyFamilies = async (req, res) => {
  try {
    const families = await Family.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profilePhoto']
        },
        {
          model: FamilyMembership,
          as: 'memberships',
          attributes: ['role', 'userId'],
          required: false
        }
      ],
      where: {
        [Op.or]: [
          { createdBy: req.user.id },
          { '$memberships.userId$': req.user.id }
        ]
      },
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      count: families.length,
      families
    });
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch families'
    });
  }
};

// @desc    Get single family
exports.getFamily = async (req, res) => {
  try {
    const family = await Family.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email', 'profilePhoto']
      }, {
        model: FamilyMembership,
        as: 'memberships',
        attributes: ['role', 'userId']
      }]
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    // Check if user has access
    const membership = family.memberships?.find(m => m.userId === req.user.id);
    if (!membership && family.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      family
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch family'
    });
  }
};

// @desc    Update family
exports.updateFamily = async (req, res) => {
  try {
    const { name, description, coverPhoto } = req.body;

    const family = await Family.findByPk(req.params.id);
    
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId: family.id, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await family.update({ name, description, coverPhoto });

    await recordActivity({
      familyId: family.id,
      userId: req.user.id,
      type: 'family_updated',
      action: 'updated family settings',
      description: `${family.name} family updated`,
      metadata: { familyId: family.id }
    });

    res.json({
      success: true,
      family
    });
  } catch (error) {
    console.error('Update family error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update family'
    });
  }
};

// @desc    Delete family
exports.deleteFamily = async (req, res) => {
  try {
    const family = await Family.findByPk(req.params.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId: family.id, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await FamilyMembership.destroy({ where: { familyId: family.id } });
    await FamilyInvite.destroy({ where: { familyId: family.id } });
    await family.destroy();

    res.json({
      success: true,
      message: 'Family deleted successfully'
    });
  } catch (error) {
    console.error('Delete family error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete family'
    });
  }
};

// Placeholder functions for future implementation
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { id: familyId } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found' });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const invite = await FamilyInvite.create({
      familyId,
      email: email.toLowerCase(),
      role: role || 'viewer',
      token,
      expiresAt,
      invitedBy: req.user.id
    });

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'invite_sent',
      action: 'invited a family member',
      description: `Invitation sent to ${invite.email}`,
      metadata: { inviteId: invite.id, email: invite.email, role: invite.role }
    });

    res.status(201).json({ success: true, invite });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to invite member' });
  }
};

exports.joinFamily = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invite token is required' });
    }

    const invite = await FamilyInvite.findOne({ where: { token } });

    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invite token is invalid or expired' });
    }

    const existing = await FamilyMembership.findOne({
      where: { familyId: invite.familyId, userId: req.user.id }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Already a family member' });
    }

    const membership = await FamilyMembership.create({
      familyId: invite.familyId,
      userId: req.user.id,
      role: invite.role
    });

    await invite.destroy();

    await recordActivity({
      familyId: membership.familyId,
      userId: req.user.id,
      type: 'member_joined',
      action: 'joined the family',
      description: 'Joined via invitation',
      metadata: { role: membership.role }
    });

    res.json({ success: true, membership });
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to join family' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id: familyId, userId } = req.params;

    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found' });
    }

    const requester = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && requester?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (userId === family.createdBy) {
      return res.status(400).json({ success: false, error: 'Cannot remove the family creator' });
    }

    const removed = await FamilyMembership.destroy({
      where: { familyId, userId }
    });

    if (!removed) {
      return res.status(404).json({ success: false, error: 'Member not found in family' });
    }

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'member_removed',
      action: 'removed a family member',
      description: 'Member removed from family',
      metadata: { removedUserId: userId }
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to remove member' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { id: familyId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found' });
    }

    const requester = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && requester?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId, userId }
    });

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Member not found in family' });
    }

    await membership.update({ role });

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'role_updated',
      action: 'updated a family role',
      description: `Updated member role to ${role}`,
      metadata: { updatedUserId: userId, role }
    });

    res.json({ success: true, membership });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update role' });
  }
};
