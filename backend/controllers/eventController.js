const { Op } = require('sequelize');
const { Event, Family, FamilyMembership } = require('../models');
const { recordActivity } = require('../utils/activity');

// @desc    Create event
exports.createEvent = async (req, res, next) => {
  try {
    const { familyId, title, description, type, date, endDate, isAllDay, location, relatedMemberId, recurrence, notifications } = req.body;

    if (!familyId || !title || !type || !date) {
      return res.status(400).json({
        success: false,
        error: 'familyId, title, type, and date are required'
      });
    }

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

    if (family.createdBy !== req.user.id && (!membership || membership.role === 'viewer')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location || null;
    const parsedRecurrence = typeof recurrence === 'string' ? JSON.parse(recurrence) : recurrence || undefined;
    const parsedNotifications = typeof notifications === 'string' ? JSON.parse(notifications) : notifications || undefined;
    const normalizedDate = date ? new Date(date) : null;
    const normalizedEndDate = endDate ? new Date(endDate) : null;

    const event = await Event.create({
      familyId,
      title,
      description: description || null,
      type,
      date: normalizedDate,
      endDate: normalizedEndDate,
      isAllDay: isAllDay !== undefined ? isAllDay : true,
      location: parsedLocation,
      relatedMemberId: relatedMemberId || null,
      recurrence: parsedRecurrence,
      notifications: parsedNotifications,
      createdBy: req.user.id
    });

    const stats = family.stats || {};
    await family.update({
      stats: {
        ...stats,
        totalEvents: (stats.totalEvents || 0) + 1
      }
    });

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'event_created',
      action: 'created a new event',
      description: event.title,
      metadata: { eventId: event.id }
    });

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events for a family
exports.getFamilyEvents = async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { type, startDate, endDate } = req.query;

    const query = { familyId };
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date[Op.gte] = new Date(startDate);
      if (endDate) query.date[Op.lte] = new Date(endDate);
    }

    const events = await Event.findAll({
      where: query,
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming events across all user's families
exports.getUpcomingEvents = async (req, res, next) => {
  try {
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
    const familyIds = [...new Set([...memberFamilyIds, ...ownedFamilyIds])];

    const events = await Event.findAll({
      where: {
        familyId: { [Op.in]: familyIds },
        date: { [Op.gte]: new Date() }
      },
      order: [['date', 'ASC']],
      limit: 10
    });

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const family = await Family.findByPk(event.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: event.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check authorization
    const membership = await FamilyMembership.findOne({
      where: { familyId: event.familyId, userId: req.user.id }
    });

    if (event.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this event'
      });
    }

    const updatedEvent = await event.update(req.body);

    await recordActivity({
      familyId: event.familyId,
      userId: req.user.id,
      type: 'event_updated',
      action: 'updated an event',
      description: updatedEvent.title,
      metadata: { eventId: updatedEvent.id }
    });

    res.json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check authorization
    const membership = await FamilyMembership.findOne({
      where: { familyId: event.familyId, userId: req.user.id }
    });

    if (event.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this event'
      });
    }

    await event.destroy();

    const family = await Family.findByPk(event.familyId);
    if (family) {
      const stats = family.stats || {};
      await family.update({
        stats: {
          ...stats,
          totalEvents: Math.max((stats.totalEvents || 1) - 1, 0)
        }
      });
    }

    await recordActivity({
      familyId: event.familyId,
      userId: req.user.id,
      type: 'event_deleted',
      action: 'deleted an event',
      description: event.title,
      metadata: { eventId: event.id }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    RSVP to event
exports.rsvpEvent = async (req, res, next) => {
  try {
    const { status } = req.body; // 'going', 'maybe', 'not_going'

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid RSVP status'
      });
    }

    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Remove existing RSVP
    const family = await Family.findByPk(event.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: event.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    const filtered = attendees.filter(a => a.userId !== req.user.id);
    filtered.push({
      userId: req.user.id,
      status,
      respondedAt: new Date().toISOString()
    });

    await event.update({ attendees: filtered });

    res.json({
      success: true,
      message: 'RSVP updated successfully',
      status
    });
  } catch (error) {
    next(error);
  }
};
