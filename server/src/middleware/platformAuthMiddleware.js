const PlatformRole = require('../models/PlatformRole');

/**
 * Middleware ensuring the authenticated user is an active Platform user
 */
const requirePlatformUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    if (
      !req.user.isPlatformUser ||
      req.user.platformStatus !== 'active' ||
      !req.user.platformRoleId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to Nexus platform administration',
        code: 'NOT_PLATFORM_USER',
      });
    }

    // Resolve platform role if not populated
    let role = req.user.platformRoleId;
    if (!role.permissions) {
      role = await PlatformRole.findById(req.user.platformRoleId);
      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Assigned platform role is no longer valid',
          code: 'INVALID_PLATFORM_ROLE',
        });
      }
    }

    req.platformRole = role;
    req.platformPermissions = role.permissions || [];

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory enforcing specific platform permissions
 * @param {string|string[]} requiredPermission - Permission key or array of keys
 */
const requirePlatformPermission = (requiredPermission) => {
  const permList = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  return async (req, res, next) => {
    try {
      if (!req.platformRole || !req.platformPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Platform authorization context not found',
          code: 'FORBIDDEN',
        });
      }

      // Platform Admin Superuser Override
      const isSuperAdmin =
        req.platformRole.key === 'platform_admin' ||
        req.platformPermissions.includes('*');

      if (isSuperAdmin) {
        return next();
      }

      const hasAll = permList.every((p) => req.platformPermissions.includes(p));

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this platform action',
          code: 'MISSING_PLATFORM_PERMISSION',
          requiredPermissions: permList,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requirePlatformUser,
  requirePlatformPermission,
};
