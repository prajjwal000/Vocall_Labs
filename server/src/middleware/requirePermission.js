const Role = require('../models/Role');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/permissions');

/**
 * Middleware factory to enforce granular permissions within the active organization
 * @param {string|string[]} requiredPermissions - A permission key or array of keys (must satisfy all)
 */
const requirePermission = (requiredPermissions) => {
  const permList = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
          code: 'UNAUTHORIZED',
        });
      }

      if (!req.organization || !req.membership) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this organization',
          code: 'FORBIDDEN',
        });
      }

      // 1. Owner Override: The organization owner has unconditional access
      const isOwner =
        req.membership.role === 'owner' ||
        (req.organization.ownerId &&
          req.user._id.toString() === req.organization.ownerId.toString());

      if (isOwner) {
        return next();
      }

      // 2. Resolve authoritative permissions for the membership
      let userPermissions = new Set();

      let roleDoc = req.membership.roleId;
      if (!roleDoc && req.membership.role) {
        roleDoc = await Role.findOne({
          organizationId: req.organization._id,
          key: req.membership.role,
        });
      }

      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        roleDoc.permissions.forEach((p) => userPermissions.add(p));
      } else {
        const defaultRolePerms =
          DEFAULT_ROLE_PERMISSIONS[req.membership.role] || DEFAULT_ROLE_PERMISSIONS.member || [];
        defaultRolePerms.forEach((p) => userPermissions.add(p));
      }

      // 3. Evaluate required permissions
      if (userPermissions.has('*')) {
        return next();
      }

      const hasAllPermissions = permList.every((p) => userPermissions.has(p));

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
          code: 'FORBIDDEN',
          requiredPermissions: permList,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireAnyPermission = (permList) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
          code: 'UNAUTHORIZED',
        });
      }

      if (!req.organization || !req.membership) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this organization',
          code: 'FORBIDDEN',
        });
      }

      const isOwner =
        req.membership.role === 'owner' ||
        (req.organization.ownerId &&
          req.user._id.toString() === req.organization.ownerId.toString());

      if (isOwner) {
        return next();
      }

      let userPermissions = new Set();
      let roleDoc = req.membership.roleId;
      if (!roleDoc && req.membership.role) {
        roleDoc = await Role.findOne({
          organizationId: req.organization._id,
          key: req.membership.role,
        });
      }

      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        roleDoc.permissions.forEach((p) => userPermissions.add(p));
      } else {
        const defaultRolePerms =
          DEFAULT_ROLE_PERMISSIONS[req.membership.role] || DEFAULT_ROLE_PERMISSIONS.member || [];
        defaultRolePerms.forEach((p) => userPermissions.add(p));
      }

      if (userPermissions.has('*')) {
        return next();
      }

      const hasAnyPermission = permList.some((p) => userPermissions.has(p));

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
          code: 'FORBIDDEN',
          requiredPermissions: permList,
          operator: 'OR'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
};
