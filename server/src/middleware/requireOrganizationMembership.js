const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const Role = require('../models/Role');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/permissions');

/**
 * Middleware ensuring the authenticated user has active membership
 * in the requested organization, and that the organization is active.
 */
const requireOrganizationMembership = async (req, res, next) => {
  try {
    const organizationId =
      req.params.organizationId ||
      req.query?.organizationId ||
      req.headers['x-organization-id'] ||
      req.body?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
        code: 'MISSING_ORGANIZATION_ID',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
        code: 'FORBIDDEN',
      });
    }

    // Look up active membership for authenticated user with populated roleId
    let membership = await OrganizationMember.findOne({
      organizationId,
      userId: req.user._id,
      status: 'active',
    }).populate('roleId');

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
        code: 'FORBIDDEN',
      });
    }

    // Look up organization and ensure it is not deleted
    const organization = await Organization.findOne({
      _id: organizationId,
      status: { $ne: 'deleted' },
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
        code: 'FORBIDDEN',
      });
    }

    // Resolve authoritative permissions
    let userPermissions = new Set();
    const isOwner =
      membership.role === 'owner' ||
      (organization.ownerId && req.user._id.toString() === organization.ownerId.toString());

    if (isOwner) {
      userPermissions.add('*');
    } else {
      // If member has an assigned role, use the exact role permissions
      let roleDoc = membership.roleId;
      if (!roleDoc && membership.role) {
        roleDoc = await Role.findOne({ organizationId, key: membership.role });
      }

      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        roleDoc.permissions.forEach((p) => userPermissions.add(p));
      } else {
        // Fallback to static defaults only if no role record exists
        const defaultRolePerms =
          DEFAULT_ROLE_PERMISSIONS[membership.role] || DEFAULT_ROLE_PERMISSIONS.member || [];
        defaultRolePerms.forEach((p) => userPermissions.add(p));
      }
    }

    // Attach to request
    req.organization = organization;
    req.membership = membership;
    req.userRole = isOwner ? 'owner' : (membership.role || 'member');
    req.userPermissions = Array.from(userPermissions);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireOrganizationMembership,
};
