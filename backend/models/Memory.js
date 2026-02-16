const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['photo', 'video', 'story', 'document', 'audio'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    name: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document']
    },
    thumbnail: String,
    filename: String,
    size: Number, // in bytes
    cloudinaryId: String
  }],
  taggedMembers: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember'
    },
    position: {
      x: Number, // percentage for photo tagging
      y: Number
    }
  }],
  tags: [String],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'family', 'private'],
    default: 'family'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
memorySchema.index({ family: 1, date: -1 });
memorySchema.index({ 'taggedMembers.member': 1 });
memorySchema.index({ createdBy: 1 });
memorySchema.index({ tags: 1 });

module.exports = mongoose.model('Memory', memorySchema);
