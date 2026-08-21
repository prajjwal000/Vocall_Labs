const mongoose = require('mongoose');
const PlatformRole = require('../models/PlatformRole');
const User = require('../models/User');
const {
  PLATFORM_PERMISSIONS,
  PLATFORM_VALID_PERMISSION_KEYS,
  DEFAULT_PLATFORM_ROLES,
} = require('../config/platformPermissions');

/**
 * Idempotent seeder for Platform RBAC roles & permissions
 */
const seedPlatformRBAC = async () => {
  const operations = DEFAULT_PLATFORM_ROLES.map((roleData) => ({
    updateOne: {
      filter: { key: roleData.key },
      update: {
        $setOnInsert: {
          key: roleData.key,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          isSystem: roleData.isSystem,
          isLocked: roleData.isLocked,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await PlatformRole.bulkWrite(operations);
  }

  // Handle optional bootstrap platform admin assignment
  const bootstrapEmail = process.env.PLATFORM_BOOTSTRAP_EMAIL;
  if (bootstrapEmail) {
    const normalizedEmail = bootstrapEmail.toLowerCase().trim();
    const adminRole = await PlatformRole.findOne({ key: 'platform_admin' });
    if (adminRole) {
      await User.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            isPlatformUser: true,
            platformStatus: 'active',
            platformRoleId: adminRole._id,
            isBootstrapAdmin: true,
          },
        }
      );
    }
  }
};

/**
 * Returns all platform roles with permission catalog
 */
const getPlatformRoles = async () => {
  const count = await PlatformRole.countDocuments();
  if (count === 0) {
    await seedPlatformRBAC();
  }

  const roles = await PlatformRole.find().sort({ isLocked: -1, createdAt: 1 });

  return {
    roles: roles.map((r) => r.toJSON()),
    catalog: PLATFORM_PERMISSIONS,
  };
};

/**
 * Returns single platform role details
 */
const getPlatformRoleById = async (roleId) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid platform role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const role = await PlatformRole.findById(roleId);
  if (!role) {
    const error = new Error('Platform role not found');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  return role.toJSON();
};

/**
 * Updates a platform role's permissions or description
 */
const updatePlatformRole = async ({ roleId, updateData, currentPlatformUser }) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid platform role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const role = await PlatformRole.findById(roleId);
  if (!role) {
    const error = new Error('Platform role not found');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  // 1. Platform Admin Lock: The platform_admin role is permanently locked
  if (role.key === 'platform_admin' || role.isLocked === true) {
    const error = new Error('Platform Admin permissions are locked and cannot be modified');
    error.statusCode = 403;
    error.code = 'PLATFORM_ADMIN_LOCKED';
    throw error;
  }

  // 2. Prevent Self-Escalation: User cannot grant permissions to their own role that they don't possess
  if (
    currentPlatformUser?.platformRoleId &&
    currentPlatformUser.platformRoleId.toString() === roleId.toString()
  ) {
    const userRole = await PlatformRole.findById(currentPlatformUser.platformRoleId);
    if (userRole && userRole.key !== 'platform_admin') {
      const error = new Error('Platform users cannot modify their own assigned role');
      error.statusCode = 403;
      error.code = 'SELF_ESCALATION_BLOCKED';
      throw error;
    }
  }

  const { name, description, permissions } = updateData;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      const error = new Error('Role name cannot be empty');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    role.name = name.trim();
  }

  if (description !== undefined) {
    role.description = typeof description === 'string' ? description.trim() : '';
  }

  if (permissions !== undefined) {
    const cleanedPermissions = Array.isArray(permissions) ? permissions : [];
    for (const perm of cleanedPermissions) {
      if (perm !== '*' && !PLATFORM_VALID_PERMISSION_KEYS.has(perm)) {
        const error = new Error(`Unknown platform permission key: '${perm}'`);
        error.statusCode = 400;
        error.code = 'UNKNOWN_PERMISSION';
        throw error;
      }
    }
    role.permissions = cleanedPermissions;
  }

  await role.save();
  return role.toJSON();
};

/**
 * Returns current authenticated user's platform role & permissions
 */
const getCurrentUserPlatformPermissions = async (userId) => {
  let user = await User.findById(userId).populate('platformRoleId');

  if (!user) {
    return { isPlatformUser: false, role: null, permissions: [] };
  }

  // If user is not yet marked as platform user, check if they should be auto-assigned platform_admin
  if (!user.isPlatformUser || !user.platformRoleId) {
    const bootstrapEmail = (process.env.PLATFORM_BOOTSTRAP_EMAIL || 'platform.admin@nexus.com').toLowerCase().trim();
    if (user.email.toLowerCase().trim() === bootstrapEmail) {
      await seedPlatformRBAC();
      const adminRole = await PlatformRole.findOne({ key: 'platform_admin' });
      if (adminRole) {
        user.isPlatformUser = true;
        user.platformStatus = 'active';
        user.platformRoleId = adminRole._id;
        user.isBootstrapAdmin = true;
        await user.save();
        user = await User.findById(userId).populate('platformRoleId');
      }
    }
  }

  if (!user.isPlatformUser || user.platformStatus !== 'active' || !user.platformRoleId) {
    return {
      isPlatformUser: false,
      role: null,
      permissions: [],
    };
  }

  const role = user.platformRoleId;
  const isSuperAdmin = role.key === 'platform_admin' || role.permissions.includes('*');

  return {
    isPlatformUser: true,
    role: {
      id: role.id || role._id.toString(),
      key: role.key,
      name: role.name,
      isLocked: role.isLocked,
    },
    permissions: isSuperAdmin ? ['*'] : role.permissions,
  };
};

/**
 * Lists all platform users
 */
const getPlatformUsers = async () => {
  const users = await User.find({ isPlatformUser: true })
    .populate('platformRoleId', 'name key permissions isLocked')
    .sort({ createdAt: 1 });

  return users.map((u) => ({
    id: u.id || u._id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    platformStatus: u.platformStatus,
    platformRole: u.platformRoleId,
    isBootstrapAdmin: u.isBootstrapAdmin || false,
    createdAt: u.createdAt,
  }));
};

/**
 * Assigns a platform role to a user
 */
const assignUserPlatformRole = async ({ targetUserId, roleId }) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid user ID or role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const [user, role] = await Promise.all([
    User.findById(targetUserId),
    PlatformRole.findById(roleId),
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (!role) {
    const error = new Error('Platform role not found');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  // Bootstrap admin protection
  if (user.isBootstrapAdmin && role.key !== 'platform_admin') {
    const error = new Error('The bootstrap Platform Admin cannot be demoted or modified');
    error.statusCode = 403;
    error.code = 'CANNOT_DEMOTE_BOOTSTRAP_ADMIN';
    throw error;
  }

  user.isPlatformUser = true;
  user.platformStatus = 'active';
  user.platformRoleId = role._id;
  await user.save();

  return {
    id: user.id || user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    platformStatus: user.platformStatus,
    platformRole: role.toJSON(),
  };
};

module.exports = {
  seedPlatformRBAC,
  getPlatformRoles,
  getPlatformRoleById,
  updatePlatformRole,
  getCurrentUserPlatformPermissions,
  getPlatformUsers,
  assignUserPlatformRole,
};
