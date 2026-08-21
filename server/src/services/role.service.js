const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const {
  SYSTEM_PERMISSIONS,
  VALID_PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
} = require('../config/permissions');

/**
 * Seeds or synchronizes the system permission catalog
 */
const seedSystemPermissions = async () => {
  const operations = SYSTEM_PERMISSIONS.map((perm) => ({
    updateOne: {
      filter: { key: perm.key },
      update: { $set: perm },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await Permission.bulkWrite(operations);
  }
};

/**
 * Returns permissions catalog grouped by module
 */
const getPermissionsCatalog = async () => {
  const count = await Permission.countDocuments();
  if (count === 0) {
    await seedSystemPermissions();
  }

  const permissions = await Permission.find().sort({ module: 1, action: 1 });
  return permissions.map((p) => p.toJSON());
};

/**
 * Initializes default system roles (Owner, Admin, Member) for a newly created organization
 */
const initializeOrganizationRoles = async (organizationId, session = null) => {
  const existingRoles = await Role.find({ organizationId }).session(session || null);
  if (existingRoles.length > 0) {
    return {
      ownerRole: existingRoles.find((r) => r.key === 'owner'),
      adminRole: existingRoles.find((r) => r.key === 'admin'),
      memberRole: existingRoles.find((r) => r.key === 'member'),
    };
  }

  const defaultRolesData = [
    {
      name: 'Owner',
      key: 'owner',
      description: 'Full organization access with all permissions and administrative privileges',
      organizationId,
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Admin',
      key: 'admin',
      description: 'Broad operational, employee, and workspace management permissions',
      organizationId,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Member',
      key: 'member',
      description: 'Standard employee access with view and self-service creation rights',
      organizationId,
      permissions: DEFAULT_ROLE_PERMISSIONS.member,
      isSystem: true,
      isDefault: true,
    },
  ];

  const createdRoles = await Role.create(defaultRolesData, session ? { session } : {});

  return {
    ownerRole: createdRoles.find((r) => r.key === 'owner'),
    adminRole: createdRoles.find((r) => r.key === 'admin'),
    memberRole: createdRoles.find((r) => r.key === 'member'),
  };
};

/**
 * Lists all roles for an organization
 */
const getOrganizationRoles = async (organizationId) => {
  let roles = await Role.find({ organizationId }).sort({ isSystem: -1, createdAt: 1 });

  if (roles.length === 0) {
    const initialized = await initializeOrganizationRoles(organizationId);
    roles = [initialized.ownerRole, initialized.adminRole, initialized.memberRole].filter(Boolean);
  }

  return roles.map((r) => r.toJSON());
};

/**
 * Retrieves a single role by ID
 */
const getRoleById = async ({ organizationId, roleId }) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ROLE_ID';
    throw error;
  }

  const role = await Role.findOne({ _id: roleId, organizationId });
  if (!role) {
    const error = new Error('Role not found in this organization');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  return role.toJSON();
};

/**
 * Creates a custom organization role
 */
const createRole = async ({ organizationId, name, key, description, permissions }) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Role name is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const roleKey = (key || name).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  if (!roleKey) {
    const error = new Error('Valid role key is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Prevent creating custom roles with reserved system keys
  if (['owner', 'admin', 'member'].includes(roleKey)) {
    const error = new Error(`Role key '${roleKey}' is reserved for system roles`);
    error.statusCode = 400;
    error.code = 'RESERVED_ROLE_KEY';
    throw error;
  }

  // Check duplicate key in organization
  const existing = await Role.findOne({ organizationId, key: roleKey });
  if (existing) {
    const error = new Error(`A role with key '${roleKey}' already exists in this organization`);
    error.statusCode = 409;
    error.code = 'ROLE_EXISTS';
    throw error;
  }

  // Validate permissions
  const cleanedPermissions = Array.isArray(permissions) ? permissions : [];
  for (const perm of cleanedPermissions) {
    if (perm !== '*' && !VALID_PERMISSION_KEYS.has(perm)) {
      const error = new Error(`Unknown permission key: '${perm}'`);
      error.statusCode = 400;
      error.code = 'UNKNOWN_PERMISSION';
      throw error;
    }
  }

  const role = await Role.create({
    name: name.trim(),
    key: roleKey,
    description: description ? description.trim() : '',
    organizationId,
    permissions: cleanedPermissions,
    isSystem: false,
    isDefault: false,
  });

  return role.toJSON();
};

/**
 * Updates an organization role
 */
const updateRole = async ({ organizationId, roleId, updateData }) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ROLE_ID';
    throw error;
  }

  const role = await Role.findOne({ _id: roleId, organizationId });
  if (!role) {
    const error = new Error('Role not found in this organization');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  const { name, description, permissions } = updateData;

  // Protect Owner system role from modification of permissions or core identity
  if (role.key === 'owner') {
    if (permissions !== undefined) {
      const error = new Error('Owner permissions cannot be customized');
      error.statusCode = 403;
      error.code = 'CANNOT_MODIFY_OWNER_ROLE';
      throw error;
    }
  }

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

  if (permissions !== undefined && role.key !== 'owner') {
    const cleanedPermissions = Array.isArray(permissions) ? permissions : [];
    for (const perm of cleanedPermissions) {
      if (perm !== '*' && !VALID_PERMISSION_KEYS.has(perm)) {
        const error = new Error(`Unknown permission key: '${perm}'`);
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
 * Deletes a custom role (blocks deletion of system roles)
 */
const deleteRole = async ({ organizationId, roleId }) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ROLE_ID';
    throw error;
  }

  const role = await Role.findOne({ _id: roleId, organizationId });
  if (!role) {
    const error = new Error('Role not found in this organization');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  if (role.isSystem || ['owner', 'admin', 'member'].includes(role.key)) {
    const error = new Error('System roles cannot be deleted');
    error.statusCode = 403;
    error.code = 'CANNOT_DELETE_SYSTEM_ROLE';
    throw error;
  }

  // Reassign any members using this role to the default member role
  const defaultMemberRole = await Role.findOne({
    organizationId,
    key: 'member',
  });

  if (defaultMemberRole) {
    await OrganizationMember.updateMany(
      { organizationId, roleId: role._id },
      { roleId: defaultMemberRole._id, role: 'member' }
    );
  }

  await Role.deleteOne({ _id: role._id });

  return {
    message: 'Role deleted successfully',
  };
};

/**
 * Assigns a role to an organization member with owner protection & tenant safety
 */
const assignMemberRole = async ({ organizationId, memberId, roleId }) => {
  if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(roleId)) {
    const error = new Error('Invalid member ID or role ID');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const [member, role, organization] = await Promise.all([
    OrganizationMember.findOne({ _id: memberId, organizationId }),
    Role.findOne({ _id: roleId, organizationId }),
    Organization.findById(organizationId),
  ]);

  if (!member) {
    const error = new Error('Organization member not found');
    error.statusCode = 404;
    error.code = 'MEMBER_NOT_FOUND';
    throw error;
  }

  if (!role) {
    const error = new Error('Role not found in this organization');
    error.statusCode = 404;
    error.code = 'ROLE_NOT_FOUND';
    throw error;
  }

  // Owner Protection: The organization owner cannot be modified or demoted
  if (
    organization &&
    (member.userId.toString() === organization.ownerId.toString() || member.role === 'owner')
  ) {
    if (role.key !== 'owner') {
      const error = new Error("The organization owner's role cannot be modified or demoted");
      error.statusCode = 403;
      error.code = 'CANNOT_MODIFY_OWNER_ROLE';
      throw error;
    }
  }

  member.roleId = role._id;
  member.role = role.key;
  await member.save();

  return {
    id: member.id || member._id.toString(),
    userId: member.userId,
    organizationId: member.organizationId,
    roleId: role.toJSON(),
    role: member.role,
    status: member.status,
  };
};

/**
 * Retrieves members of an organization with populated role information
 */
const getOrganizationMembersWithRoles = async (organizationId) => {
  const members = await OrganizationMember.find({
    organizationId,
    status: { $ne: 'removed' },
  })
    .populate('userId', 'firstName lastName email status')
    .populate('roleId', 'name key permissions isSystem isDefault')
    .sort({ createdAt: 1 });

  return members.map((m) => ({
    id: m.id || m._id.toString(),
    user: m.userId,
    role: m.roleId || { key: m.role, name: m.role },
    roleKey: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
  }));
};

module.exports = {
  seedSystemPermissions,
  getPermissionsCatalog,
  initializeOrganizationRoles,
  getOrganizationRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignMemberRole,
  getOrganizationMembersWithRoles,
};
