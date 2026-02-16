const { Memory, Family, FamilyMembership, User } = require('../models');
const { recordActivity } = require('../utils/activity');
const { uploadBuffer, deleteByPublicId } = require('../utils/cloudinary');

const getMediaTypeFromMime = (mime) => {
  if (!mime) return 'document';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
};

const getCloudinaryResourceType = (mediaType) => {
  if (mediaType === 'video' || mediaType === 'audio') return 'video';
  if (mediaType === 'document') return 'raw';
  return 'image';
};

// @desc    Create memory with file uploads
exports.createMemory = async (req, res, next) => {
  try {
    const { title, description, type, date, location, taggedMembers, familyId, tags, privacy } = req.body;

    if (!familyId || !title || !type) {
      return res.status(400).json({
        success: false,
        error: 'familyId, title, and type are required'
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

    const media = req.files?.length
      ? await Promise.all(req.files.map(async (file) => {
          const uploadResult = await uploadBuffer(file.buffer, {
            folder: `familytree/memories/${familyId}`,
            use_filename: true,
            unique_filename: true
          });

          const mediaType = getMediaTypeFromMime(file.mimetype);

          return {
            url: uploadResult.secure_url,
            type: mediaType,
            thumbnail: null,
            filename: file.originalname,
            size: file.size,
            cloudinaryId: uploadResult.public_id,
            cloudinaryResourceType: uploadResult.resource_type
          };
        }))
      : [];

    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location || null;
    const parsedTagged = typeof taggedMembers === 'string' ? JSON.parse(taggedMembers) : taggedMembers || [];
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

    const memory = await Memory.create({
      familyId,
      title,
      description: description || null,
      type,
      date: date || new Date(),
      location: parsedLocation,
      media,
      taggedMembers: parsedTagged,
      tags: parsedTags,
      privacy: privacy || 'family',
      createdBy: req.user.id
    });

    const stats = family.stats || {};
    await family.update({
      stats: {
        ...stats,
        totalMemories: (stats.totalMemories || 0) + 1
      }
    });

    if (media.length > 0) {
      const totalSize = media.reduce((sum, m) => sum + (m.size || 0), 0);
      await User.update(
        { storageUsed: (req.user.storageUsed || 0) + totalSize },
        { where: { id: req.user.id } }
      );
    }

    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'memory_uploaded',
      action: 'uploaded new memories',
      description: memory.title,
      metadata: { memoryId: memory.id, type: memory.type }
    });

    res.status(201).json({
      success: true,
      memory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all memories for a family
exports.getFamilyMemories = async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { type, sort = '-date', page = 1, limit = 20 } = req.query;

    const query = { familyId };
    if (type) query.type = type;

    const order = sort.startsWith('-')
      ? [[sort.slice(1), 'DESC']]
      : [[sort, 'ASC']];

    const memories = await Memory.findAll({
      where: query,
      order,
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
    });

    const total = await Memory.count({ where: query });

    res.json({
      success: true,
      count: memories.length,
      total,
      pages: Math.ceil(total / limit),
      memories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single memory
exports.getMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findByPk(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    const family = await Family.findByPk(memory.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      memory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update memory
exports.updateMemory = async (req, res, next) => {
  try {
    const { title, description, date, location, taggedMembers } = req.body;
    
    const memory = await Memory.findByPk(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    // Check if user is creator or family admin
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (memory.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this memory'
      });
    }

    const updatedMemory = await memory.update({
      title: title || memory.title,
      description: description !== undefined ? description : memory.description,
      date: date !== undefined ? date : memory.date,
      location: location !== undefined ? location : memory.location,
      taggedMembers: taggedMembers !== undefined ? taggedMembers : memory.taggedMembers
    });

    await recordActivity({
      familyId: memory.familyId,
      userId: req.user.id,
      type: 'memory_updated',
      action: 'updated a memory',
      description: updatedMemory.title,
      metadata: { memoryId: updatedMemory.id }
    });

    res.json({
      success: true,
      memory: updatedMemory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete memory
exports.deleteMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findByPk(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    // Check authorization
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (memory.createdBy !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this memory'
      });
    }

    if (memory.media?.length) {
      const totalSize = memory.media.reduce((sum, m) => sum + (m.size || 0), 0);
      const creator = await User.findByPk(memory.createdBy);
      if (creator) {
        await creator.update({
          storageUsed: Math.max((creator.storageUsed || 0) - totalSize, 0)
        });
      }

      await Promise.all(memory.media.map((item) => {
        const resourceType = item.cloudinaryResourceType || getCloudinaryResourceType(item.type);
        return deleteByPublicId(item.cloudinaryId, resourceType);
      }));
    }

    const family = await Family.findByPk(memory.familyId);
    if (family) {
      const stats = family.stats || {};
      await family.update({
        stats: {
          ...stats,
          totalMemories: Math.max((stats.totalMemories || 1) - 1, 0)
        }
      });
    }

    await memory.destroy();

    await recordActivity({
      familyId: memory.familyId,
      userId: req.user.id,
      type: 'memory_deleted',
      action: 'deleted a memory',
      description: memory.title,
      metadata: { memoryId: memory.id }
    });

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a memory
exports.likeMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findByPk(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    // Check if already liked
    const family = await Family.findByPk(memory.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const likes = Array.isArray(memory.likes) ? memory.likes : [];
    const alreadyLiked = likes.some(like => like.userId === req.user.id);

    const updatedLikes = alreadyLiked
      ? likes.filter(like => like.userId !== req.user.id)
      : [...likes, { userId: req.user.id, createdAt: new Date().toISOString() }];

    await memory.update({ likes: updatedLikes });

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: memory.likes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to memory
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    const memory = await Memory.findByPk(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    const family = await Family.findByPk(memory.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const comments = Array.isArray(memory.comments) ? memory.comments : [];
    const newComment = {
      id: `${Date.now()}_${req.user.id}`,
      userId: req.user.id,
      text,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...comments, newComment];
    await memory.update({ comments: updatedComments });

    await recordActivity({
      familyId: memory.familyId,
      userId: req.user.id,
      type: 'comment_added',
      action: 'commented on a memory',
      description: memory.title,
      metadata: { memoryId: memory.id }
    });

    res.status(201).json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const memory = await Memory.findByPk(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    const family = await Family.findByPk(memory.familyId);
    const membership = await FamilyMembership.findOne({
      where: { familyId: memory.familyId, userId: req.user.id }
    });

    if (!family || (family.createdBy !== req.user.id && !membership)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const comments = Array.isArray(memory.comments) ? memory.comments : [];
    const comment = comments.find(item => item.id === commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (comment.userId !== req.user.id && membership?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    const updatedComments = comments.filter(item => item.id !== commentId);
    await memory.update({ comments: updatedComments });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
