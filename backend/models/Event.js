const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['birthday', 'anniversary', 'reunion', 'memorial', 'celebration', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endDate: Date,
  isAllDay: {
    type: Boolean,
    default: true
  },
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  relatedMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  },
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['yearly', 'monthly', 'weekly', 'daily'],
      default: 'yearly'
    },
    endDate: Date
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: [Number],
      default: [7, 1] // Remind 7 days before and 1 day before
    },
    lastSent: Date
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going', 'invited'],
      default: 'invited'
    },
    respondedAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ family: 1, date: 1 });
eventSchema.index({ relatedMember: 1 });
eventSchema.index({ type: 1 });

module.exports = mongoose.model('Event', eventSchema);
