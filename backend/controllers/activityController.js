const { Op } = require('sequelize');
const { Activity, Family, FamilyMembership, User } = require('../models');

exports.getRecentActivities = async (req, res) => {
  try {
    const { familyId, limit = 20 } = req.query;

    let familyIds = [];

    if (familyId) {
      const family = await Family.findByPk(familyId);
      if (!family) {
        return res.status(404).json({ success: false, error: 'Family not found' });
      }

      const membership = await FamilyMembership.findOne({
        where: { familyId, userId: req.user.id }
      });

      if (family.createdBy !== req.user.id && !membership) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      familyIds = [familyId];
    } else {
      const memberships = await FamilyMembership.findAll({
        where: { userId: req.user.id },
        attributes: ['familyId']
      });
      const memberFamilyIds = memberships.map(m => m.familyId);
      const ownedFamilies = await Family.findAll({
        where: { createdBy: req.user.id },
        attributes: ['id']
      });
      const ownedFamilyIds = ownedFamilies.map(f => f.id);
      familyIds = [...new Set([...memberFamilyIds, ...ownedFamilyIds])];
    }

    const activities = await Activity.findAll({
      where: {
        familyId: { [Op.in]: familyIds }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'profilePhoto']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch activity' });
  }
};
