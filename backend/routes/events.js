const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, checkFamilyAccess } = require('../middleware/auth');

// @route   POST /api/events
// @desc    Create an event
// @access  Private
router.post('/', protect, eventController.createEvent);

// @route   GET /api/events/family/:familyId
// @desc    Get all events for a family
// @access  Private
router.get('/family/:familyId', protect, checkFamilyAccess('viewer'), eventController.getFamilyEvents);

// @route   GET /api/events/upcoming
// @desc    Get upcoming events
// @access  Private
router.get('/upcoming', protect, eventController.getUpcomingEvents);

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', protect, eventController.getEvent);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', protect, eventController.updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', protect, eventController.deleteEvent);

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to event
// @access  Private
router.post('/:id/rsvp', protect, eventController.rsvpEvent);

module.exports = router;
