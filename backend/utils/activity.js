const { Activity } = require('../models');

const recordActivity = async ({
  familyId,
  userId,
  type,
  action,
  description,
  metadata = {}
}) => {
  if (!familyId || !userId || !type || !action) {
    return null;
  }

  return Activity.create({
    familyId,
    userId,
    type,
    action,
    description: description || null,
    metadata
  });
};

module.exports = { recordActivity };
