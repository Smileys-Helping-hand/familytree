const jwt = require('jsonwebtoken');
const { User, Family, FamilyMembership } = require('../models/index');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Check if user is admin
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user has access to a family
exports.checkFamilyAccess = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const familyId = req.params.familyId || req.params.id || req.body.familyId || req.body.family;

      if (!familyId) {
        return res.status(400).json({
          success: false,
          error: 'Family ID is required'
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

      if (!membership && family.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to this family'
        });
      }

      const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
      const userRole = membership ? membership.role : 'admin';

      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return res.status(403).json({
          success: false,
          error: `You need ${requiredRole} access to perform this action`
        });
      }

      req.family = family;
      req.userFamilyRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check storage limit
exports.checkStorageLimit = (fileSize) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      const currentUsage = user.storageUsed || 0;
      const limit = parseInt(process.env.DEFAULT_STORAGE_LIMIT || '1073741824', 10);

      if (currentUsage + fileSize > limit) {
        return res.status(413).json({
          success: false,
          error: 'Storage limit exceeded. Please upgrade your plan.',
          currentUsage,
          limit
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check feature access based on subscription
exports.checkFeatureAccess = (feature) => {
  const featureAccess = {
    pdf_export: ['premium', 'premium_plus'],
    custom_themes: ['premium', 'premium_plus'],
    dna_integration: ['premium_plus'],
    advanced_reports: ['premium_plus'],
    unlimited_members: ['premium', 'premium_plus']
  };
  
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      const allowedTiers = featureAccess[feature];

      if (!allowedTiers || !allowedTiers.includes(user.subscription)) {
        return res.status(403).json({
          success: false,
          error: `This feature requires a ${allowedTiers.join(' or ')} subscription`,
          feature,
          currentTier: user.subscription
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
