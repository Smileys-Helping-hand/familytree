const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  subscription: {
    type: DataTypes.ENUM('free', 'premium', 'premium_plus'),
    defaultValue: 'free'
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  profilePhoto: {
    type: DataTypes.STRING
  },
  stripeCustomerId: {
    type: DataTypes.STRING
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING
  },
  refreshToken: {
    type: DataTypes.STRING
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
  passwordResetExpires: {
    type: DataTypes.DATE
  },
  emailVerificationToken: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  coverPhoto: {
    type: DataTypes.STRING
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalMembers: 0,
      totalMemories: 0,
      totalEvents: 0
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      privacy: 'family_only',
      allowMemberInvites: false,
      requireApproval: true
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'families'
});

const FamilyMembership = sequelize.define('FamilyMembership', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'family_memberships',
  indexes: [
    { unique: true, fields: ['familyId', 'userId'] }
  ]
});

const FamilyInvite = sequelize.define('FamilyInvite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'family_invites'
});

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('birthday', 'anniversary', 'reunion', 'memorial', 'celebration', 'other'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE
  },
  isAllDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  relatedMemberId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'family_members',
      key: 'id'
    }
  },
  recurrence: {
    type: DataTypes.JSONB,
    defaultValue: {
      enabled: false,
      frequency: 'yearly',
      endDate: null
    }
  },
  notifications: {
    type: DataTypes.JSONB,
    defaultValue: {
      enabled: true,
      reminderDays: [7, 1],
      lastSent: null
    }
  },
  attendees: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'events'
});

const Memory = sequelize.define('Memory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('photo', 'video', 'story', 'document', 'audio'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  media: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  taggedMembers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  likes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  comments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  privacy: {
    type: DataTypes.ENUM('public', 'family', 'private'),
    defaultValue: 'family'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'memories'
});

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'activities'
});

const FamilyMember = sequelize.define('FamilyMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    references: {
      model: 'families',
      key: 'id'
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    defaultValue: 'other'
  },
  birthDate: {
    type: DataTypes.DATE
  },
  deathDate: {
    type: DataTypes.DATE
  },
  isLiving: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  photo: {
    type: DataTypes.STRING
  },
  biography: {
    type: DataTypes.TEXT
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  relationships: {
    type: DataTypes.JSON,
    defaultValue: {
      parents: [],
      children: [],
      spouse: [],
      siblings: []
    }
  },
  treePosition: {
    type: DataTypes.JSON,
    defaultValue: null
  }
}, {
  timestamps: true,
  tableName: 'family_members'
});

// Define associations after all models are defined
Family.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Family, { foreignKey: 'createdBy', as: 'families' });

FamilyMember.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
Family.hasMany(FamilyMember, { foreignKey: 'familyId', as: 'members' });

FamilyMembership.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
FamilyMembership.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Family.hasMany(FamilyMembership, { foreignKey: 'familyId', as: 'memberships' });
User.hasMany(FamilyMembership, { foreignKey: 'userId', as: 'memberships' });

FamilyInvite.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
FamilyInvite.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });
Family.hasMany(FamilyInvite, { foreignKey: 'familyId', as: 'invites' });
User.hasMany(FamilyInvite, { foreignKey: 'invitedBy', as: 'sentInvites' });

Event.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Event.belongsTo(FamilyMember, { foreignKey: 'relatedMemberId', as: 'relatedMember' });
Family.hasMany(Event, { foreignKey: 'familyId', as: 'events' });
User.hasMany(Event, { foreignKey: 'createdBy', as: 'events' });

Memory.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
Memory.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Family.hasMany(Memory, { foreignKey: 'familyId', as: 'memories' });
User.hasMany(Memory, { foreignKey: 'createdBy', as: 'memories' });

Activity.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Family.hasMany(Activity, { foreignKey: 'familyId', as: 'activities' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });

// Initialize database tables
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('📊 Database tables synchronized');
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    throw error;
  }
};

module.exports = {
  User,
  Family,
  FamilyMember,
  FamilyMembership,
  FamilyInvite,
  Event,
  Memory,
  Activity,
  syncDatabase
};
