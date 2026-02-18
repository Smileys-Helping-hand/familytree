// @desc    Export family tree as JSON for external ingestion
exports.exportFamilyTree = async (req, res) => {
  try {
    const { familyId } = req.params;
    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found' });
    }
    // Only allow export if family privacy is not 'private'
    if (family.settings?.privacy === 'private') {
      return res.status(403).json({ success: false, error: 'This family tree is private' });
    }
    const members = await FamilyMember.findAll({ where: { familyId } });
    res.json({
      success: true,
      family: {
        id: family.id,
        name: family.name,
        description: family.description,
        createdBy: family.createdBy,
        stats: family.stats,
        settings: family.settings
      },
      members: members.map(serializeMember)
    });
  } catch (error) {
    console.error('Export family tree error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to export family tree' });
  }
};
const { FamilyMember, Family, FamilyMembership } = require('../models');
const { recordActivity } = require('../utils/activity');

const parseRelationships = (relationships) => {
  if (!relationships) return {};
  if (typeof relationships === 'string') {
    try {
      return JSON.parse(relationships);
    } catch (error) {
      return {};
    }
  }
  return relationships;
};

const prepareRelationshipsForStorage = (relationships) => {
  const normalized = normalizeRelationshipSet(relationships);
  return JSON.stringify(normalized);
};

const normalizeRelationshipSet = (relationships) => {
  const parsed = parseRelationships(relationships);
  return {
    parents: parsed?.parents || [],
    children: parsed?.children || [],
    spouse: parsed?.spouse || [],
    siblings: parsed?.siblings || []
  };
};

const serializeMember = (member) => {
  if (!member) return member;
  const data = member.toJSON ? member.toJSON() : member;
  return {
    ...data,
    relationships: normalizeRelationshipSet(data.relationships)
  };
};

const addUnique = (list, value) => {
  if (!list.includes(value)) list.push(value);
  return list;
};

const removeValue = (list, value) => list.filter(item => item !== value);

// @desc    Create family member
exports.createMember = async (req, res) => {
  try {
    const { familyId, firstName, lastName, gender, birthDate, deathDate, photo, biography, email, phone, isLiving, relationships, treePosition } = req.body;

    if (!familyId || !firstName) {
      return res.status(400).json({
        success: false,
        error: 'Family ID and first name are required'
      });
    }

    // Check if family exists and user has access
    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const member = await FamilyMember.create({
      familyId,
      firstName,
      lastName: lastName || '',
      gender: gender || 'other',
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      isLiving: isLiving !== undefined ? isLiving : true,
      photo: photo || null,
      biography: biography || null,
      email: email || null,
      phone: phone || null,
      relationships: prepareRelationshipsForStorage(relationships),
      treePosition: treePosition || null
    });

    const stats = family.stats || {};
    await family.update({
      stats: {
        ...stats,
        totalMembers: (stats.totalMembers || 0) + 1
      }
    });

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'member_added',
      action: 'added a family member',
      description: `${member.firstName} ${member.lastName || ''}`.trim(),
      metadata: { memberId: member.id }
    });

    res.status(201).json({
      success: true,
      member
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create member'
    });
  }
};

// @desc    Get all members in a family
exports.getFamilyMembers = async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Check if family exists and user has access
    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const members = await FamilyMember.findAll({
      where: { familyId },
      order: [['firstName', 'ASC']]
    });

    res.json({
      success: true,
      count: members.length,
      members: members.map(serializeMember)
    });
  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members'
    });
  }
};

// @desc    Get single member
exports.getMember = async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.id, {
      include: [{
        model: Family,
        as: 'family',
        attributes: ['id', 'name']
      }]
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    const family = await Family.findByPk(member.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: member.familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      member: serializeMember(member)
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch member'
    });
  }
};

// @desc    Update member
exports.updateMember = async (req, res) => {
  try {
    const { firstName, lastName, gender, birthDate, deathDate, photo, biography, email, phone, isLiving, relationships, treePosition } = req.body;

    const member = await FamilyMember.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Check if user has access to the family
    const family = await Family.findByPk(member.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: family.id, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && (!membership || membership.role === 'viewer')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await member.update({
      firstName: firstName || member.firstName,
      lastName: lastName !== undefined ? lastName : member.lastName,
      gender: gender || member.gender,
      birthDate: birthDate !== undefined ? birthDate : member.birthDate,
      deathDate: deathDate !== undefined ? deathDate : member.deathDate,
      isLiving: isLiving !== undefined ? isLiving : member.isLiving,
      photo: photo !== undefined ? photo : member.photo,
      biography: biography !== undefined ? biography : member.biography,
      email: email !== undefined ? email : member.email,
      phone: phone !== undefined ? phone : member.phone,
      relationships: relationships !== undefined
        ? prepareRelationshipsForStorage(relationships)
        : prepareRelationshipsForStorage(member.relationships),
      treePosition: treePosition !== undefined ? treePosition : member.treePosition
    });

    await recordActivity({
      familyId: family.id,
      userId: req.user.id,
      type: 'member_updated',
      action: 'updated a family member',
      description: `${member.firstName} ${member.lastName || ''}`.trim(),
      metadata: { memberId: member.id }
    });

    res.json({
      success: true,
      member
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update member'
    });
  }
};

// @desc    Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Check if user has access to the family
    const family = await Family.findByPk(member.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: family.id, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await member.destroy();

    const stats = family.stats || {};
    await family.update({
      stats: {
        ...stats,
        totalMembers: Math.max((stats.totalMembers || 1) - 1, 0)
      }
    });

    await recordActivity({
      familyId: family.id,
      userId: req.user.id,
      type: 'member_removed',
      action: 'removed a family member',
      description: `${member.firstName} ${member.lastName || ''}`.trim(),
      metadata: { memberId: member.id }
    });

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete member'
    });
  }
};

// Placeholder functions for future implementation
exports.getFamilyTree = async (req, res) => {
  try {
    const { familyId } = req.params;

    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    const membership = await FamilyMembership.findOne({
      where: { familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const members = await FamilyMember.findAll({
      where: { familyId },
      order: [['firstName', 'ASC']]
    });

    res.json({
      success: true,
      count: members.length,
      members: members.map(serializeMember)
    });
  } catch (error) {
    console.error('Get family tree error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch family tree'
    });
  }
};

exports.addRelationship = async (req, res) => {
  try {
    const { memberId, targetId, type } = req.body;

    if (!memberId || !targetId || !type) {
      return res.status(400).json({
        success: false,
        error: 'memberId, targetId, and type are required'
      });
    }

    const member = await FamilyMember.findByPk(memberId);
    const target = await FamilyMember.findByPk(targetId);

    if (!member || !target || member.familyId !== target.familyId) {
      return res.status(404).json({
        success: false,
        error: 'Members not found in the same family'
      });
    }

    const family = await Family.findByPk(member.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: member.familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && (!membership || membership.role === 'viewer')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const memberRel = normalizeRelationshipSet(member.relationships);
    const targetRel = normalizeRelationshipSet(target.relationships);

    if (type === 'parent') {
      addUnique(memberRel.parents, targetId);
      addUnique(targetRel.children, memberId);
    } else if (type === 'child') {
      addUnique(memberRel.children, targetId);
      addUnique(targetRel.parents, memberId);
    } else if (type === 'spouse') {
      addUnique(memberRel.spouse, targetId);
      addUnique(targetRel.spouse, memberId);
    } else if (type === 'sibling') {
      addUnique(memberRel.siblings, targetId);
      addUnique(targetRel.siblings, memberId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid relationship type'
      });
    }

    await member.update({ relationships: prepareRelationshipsForStorage(memberRel) });
    await target.update({ relationships: prepareRelationshipsForStorage(targetRel) });

    res.json({ success: true, member: serializeMember(member), target: serializeMember(target) });
  } catch (error) {
    console.error('Add relationship error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add relationship'
    });
  }
};

exports.removeRelationship = async (req, res) => {
  try {
    const { memberId, targetId, type } = req.body;

    if (!memberId || !targetId || !type) {
      return res.status(400).json({
        success: false,
        error: 'memberId, targetId, and type are required'
      });
    }

    const member = await FamilyMember.findByPk(memberId);
    const target = await FamilyMember.findByPk(targetId);

    if (!member || !target || member.familyId !== target.familyId) {
      return res.status(404).json({
        success: false,
        error: 'Members not found in the same family'
      });
    }

    const family = await Family.findByPk(member.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: member.familyId, userId: req.user.id }
    });

    if (family.createdBy !== req.user.id && (!membership || membership.role === 'viewer')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const memberRel = normalizeRelationshipSet(member.relationships);
    const targetRel = normalizeRelationshipSet(target.relationships);

    if (type === 'parent') {
      memberRel.parents = removeValue(memberRel.parents, targetId);
      targetRel.children = removeValue(targetRel.children, memberId);
    } else if (type === 'child') {
      memberRel.children = removeValue(memberRel.children, targetId);
      targetRel.parents = removeValue(targetRel.parents, memberId);
    } else if (type === 'spouse') {
      memberRel.spouse = removeValue(memberRel.spouse, targetId);
      targetRel.spouse = removeValue(targetRel.spouse, memberId);
    } else if (type === 'sibling') {
      memberRel.siblings = removeValue(memberRel.siblings, targetId);
      targetRel.siblings = removeValue(targetRel.siblings, memberId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid relationship type'
      });
    }

    await member.update({ relationships: prepareRelationshipsForStorage(memberRel) });
    await target.update({ relationships: prepareRelationshipsForStorage(targetRel) });

    res.json({ success: true, member: serializeMember(member), target: serializeMember(target) });
  } catch (error) {
    console.error('Remove relationship error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove relationship'
    });
  }
};
