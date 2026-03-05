const crypto = require('crypto');
const { Op } = require('sequelize');
const { Family, User, FamilyMembership, FamilyInvite } = require('../models');
const { recordActivity } = require('../utils/activity');
const { sendEmail } = require('../utils/email');

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
    // Set household privacy to private by default
    await family.update({ settings: { ...family.settings, privacy: 'private' } });

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
    // Only show families the user is a member of or created
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
          required: true,
          where: { userId: req.user.id }
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

    if (family.createdBy !== req.user.id && !['admin', 'editor'].includes(membership?.role)) {
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

    if (family.createdBy !== req.user.id && !['admin', 'editor'].includes(membership?.role)) {
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

    // Send the invite email — best-effort, don't fail the request if email is down
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://thisisourfamilytree.co.za';
    const inviteLink = `${frontendUrl}/join/${token}`;
    const inviterName = req.user.name || 'A family member';
    try {
      await sendEmail({
        to: invite.email,
        subject: `${inviterName} invited you to join ${family.name} on Family Tree 🌳`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🌳</div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">You're Invited!</h1>
                <p style="color: #C7D2FE; margin: 8px 0 0 0; font-size: 16px;">Join your family tree on Family Tree</p>
              </div>
              <div style="padding: 40px 32px;">
                <p style="font-size: 18px; color: #1F2937; margin: 0 0 16px 0;">Hi there! 👋</p>
                <p style="font-size: 16px; color: #4B5563; margin: 0 0 24px 0;">
                  <strong style="color: #4F46E5;">${inviterName}</strong> has invited you to join the
                  <strong style="color: #4F46E5;">${family.name}</strong> family tree on Family Tree.
                </p>
                <p style="font-size: 15px; color: #6B7280; margin: 0 0 32px 0;">
                  Your role will be: <span style="background: #EEF2FF; color: #4F46E5; padding: 4px 10px; border-radius: 20px; font-weight: 600; text-transform: capitalize;">${invite.role}</span>
                </p>
                <div style="text-align: center; margin: 0 0 32px 0;">
                  <a href="${inviteLink}"
                     style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none;
                            padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(79,70,229,0.4);">
                    ✅ Accept Invitation
                  </a>
                </div>
                <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                  <p style="font-size: 13px; color: #9CA3AF; margin: 0 0 8px 0;">Or copy this link:</p>
                  <p style="font-size: 13px; color: #4F46E5; word-break: break-all; margin: 0; font-family: monospace;">${inviteLink}</p>
                </div>
                <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 12px 16px; margin: 0 0 24px 0;">
                  <p style="font-size: 13px; color: #92400E; margin: 0;">
                    ⏰ This invitation expires in <strong>7 days</strong>. You'll need to create an account or log in to accept it.
                  </p>
                </div>
                <p style="font-size: 13px; color: #9CA3AF; text-align: center; margin: 0;">
                  If you did not expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `${inviterName} invited you to join ${family.name} on Family Tree.\n\nAccept your invitation here: ${inviteLink}\n\nThis link expires in 7 days.`
      });
    } catch (emailError) {
      console.warn('Invite email could not be sent:', emailError.message);
      // Don't fail — the invite link is still returned in the response
    }

    res.status(201).json({ success: true, invite, inviteLink });
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

    if (family.createdBy !== req.user.id && !['admin', 'editor'].includes(requester?.role)) {
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

    if (family.createdBy !== req.user.id && !['admin', 'editor'].includes(requester?.role)) {
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
