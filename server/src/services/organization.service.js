const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const { generateUniqueSlug } = require('../utils/slug');
const { initializeOrganizationRoles } = require('./role.service');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/permissions');

/**
 * Creates a new Organization and establishes creator as 'owner'
 */
const createOrganization = async ({ name, description, ownerId }) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Organization name is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const trimmedName = name.trim();
  const slug = await generateUniqueSlug(trimmedName, Organization);

  const organization = await Organization.create({
    name: trimmedName,
    slug,
    description: description ? description.trim() : '',
    ownerId,
    status: 'active',
  });

  // Initialize standard system roles (Owner, Admin, Member)
  const { ownerRole } = await initializeOrganizationRoles(organization._id);

  const member = await OrganizationMember.create({
    userId: ownerId,
    organizationId: organization._id,
    roleId: ownerRole?._id,
    role: 'owner',
    status: 'active',
    joinedAt: new Date(),
  });

  return {
    ...organization.toJSON(),
    role: member.role,
    permissions: ['*'],
  };
};

/**
 * Retrieves all active organizations the user is a member of
 */
const getUserOrganizations = async (userId) => {
  const memberships = await OrganizationMember.find({
    userId,
    status: 'active',
  })
    .populate('organizationId')
    .populate('roleId');

  const Role = require('../models/Role');

  const userOrgs = await Promise.all(
    memberships
      .filter((m) => m.organizationId && m.organizationId.status !== 'deleted')
      .map(async (m) => {
        const org = m.organizationId.toJSON ? m.organizationId.toJSON() : m.organizationId;
        const isOwner = m.role === 'owner' || (org.ownerId && org.ownerId.toString() === userId.toString());
        const effectiveRole = isOwner ? 'owner' : (m.role || 'member');

        let permissions = [];
        if (isOwner) {
          permissions = ['*'];
        } else if (m.roleId?.permissions && Array.isArray(m.roleId.permissions)) {
          permissions = m.roleId.permissions;
        } else {
          const roleDoc = await Role.findOne({ organizationId: org.id || org._id, key: effectiveRole });
          if (roleDoc && Array.isArray(roleDoc.permissions)) {
            permissions = roleDoc.permissions;
          } else {
            permissions = DEFAULT_ROLE_PERMISSIONS[effectiveRole] || DEFAULT_ROLE_PERMISSIONS.member;
          }
        }

        return {
          id: org.id || org._id.toString(),
          name: org.name,
          slug: org.slug,
          description: org.description,
          logo: org.logo,
          ownerId: org.ownerId,
          role: effectiveRole,
          permissions,
          status: org.status,
          settings: org.settings,
          plan: org.plan,
          createdAt: org.createdAt,
        };
      })
  );

  return userOrgs;
};

/**
 * Retrieves organization details with user membership role and permissions
 */
const getOrganizationById = async ({ organization, membership, userRole }) => {
  const Role = require('../models/Role');
  const orgId = organization._id || organization.id;
  const isOwner =
    membership.role === 'owner' ||
    (organization.ownerId && membership.userId.toString() === organization.ownerId.toString());

  let permissions = [];
  if (isOwner) {
    permissions = ['*'];
  } else if (membership.roleId?.permissions && Array.isArray(membership.roleId.permissions)) {
    permissions = membership.roleId.permissions;
  } else {
    const roleDoc = await Role.findOne({ organizationId: orgId, key: membership.role });
    if (roleDoc && Array.isArray(roleDoc.permissions)) {
      permissions = roleDoc.permissions;
    } else {
      permissions = DEFAULT_ROLE_PERMISSIONS[membership.role] || DEFAULT_ROLE_PERMISSIONS.member;
    }
  }

  return {
    ...organization.toJSON(),
    role: isOwner ? 'owner' : membership.role,
    permissions,
  };
};

/**
 * Updates organization profile and settings
 */
const updateOrganization = async ({ organization, userRole, updateData }) => {
  if (userRole !== 'owner' && userRole !== 'admin') {
    const error = new Error('You do not have permission to update organization settings');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const {
    name,
    description,
    logo,
    timezone,
    dateFormat,
    currency,
    language,
    domainRestrictionEnabled,
    allowedEmailDomains,
    aiConfig,
    storageConfig,
    smtpConfig,
  } = updateData;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      const error = new Error('Organization name cannot be empty');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    organization.name = name.trim();
  }

  if (description !== undefined) {
    organization.description = typeof description === 'string' ? description.trim() : '';
  }

  if (logo !== undefined) {
    organization.logo = logo;
  }

  // Update nested settings
  const currentSettings = organization.settings || {};
  if (timezone !== undefined) currentSettings.timezone = timezone;
  if (dateFormat !== undefined) currentSettings.dateFormat = dateFormat;
  if (currency !== undefined) currentSettings.currency = currency;
  if (language !== undefined) currentSettings.language = language;
  if (domainRestrictionEnabled !== undefined) {
    currentSettings.domainRestrictionEnabled = Boolean(domainRestrictionEnabled);
  }
  if (allowedEmailDomains !== undefined) {
    currentSettings.allowedEmailDomains = Array.isArray(allowedEmailDomains)
      ? allowedEmailDomains.map((d) => d.toLowerCase().trim()).filter(Boolean)
      : [];
  }
  if (aiConfig !== undefined) {
    currentSettings.aiConfig = {
      provider: aiConfig.provider || 'gemini',
      apiKey: aiConfig.apiKey ? aiConfig.apiKey.trim() : '',
      model: aiConfig.model || 'gemini-2.5-flash-lite',
      isConfigured: Boolean(aiConfig.apiKey && aiConfig.apiKey.trim() && aiConfig.provider !== 'none'),
    };
  }
  if (storageConfig !== undefined) {
    const isS3Configured = Boolean(
      storageConfig.provider === 's3' &&
      storageConfig.s3?.bucket &&
      storageConfig.s3?.accessKeyId &&
      storageConfig.s3?.secretAccessKey
    );
    const isAzureConfigured = Boolean(
      storageConfig.provider === 'azure' &&
      storageConfig.azure?.accountName &&
      storageConfig.azure?.containerName
    );
    const isLocalConfigured = storageConfig.provider === 'local';

    currentSettings.storageConfig = {
      provider: storageConfig.provider || 'none',
      s3: {
        bucket: storageConfig.s3?.bucket ? storageConfig.s3.bucket.trim() : '',
        region: storageConfig.s3?.region || 'us-east-1',
        accessKeyId: storageConfig.s3?.accessKeyId ? storageConfig.s3.accessKeyId.trim() : '',
        secretAccessKey: storageConfig.s3?.secretAccessKey ? storageConfig.s3.secretAccessKey.trim() : '',
        endpoint: storageConfig.s3?.endpoint ? storageConfig.s3.endpoint.trim() : '',
      },
      azure: {
        accountName: storageConfig.azure?.accountName ? storageConfig.azure.accountName.trim() : '',
        accountKey: storageConfig.azure?.accountKey ? storageConfig.azure.accountKey.trim() : '',
        containerName: storageConfig.azure?.containerName ? storageConfig.azure.containerName.trim() : '',
      },
      isConfigured: Boolean(storageConfig.isConfigured || isS3Configured || isAzureConfigured || isLocalConfigured),
    };
  }
  if (smtpConfig !== undefined) {
    currentSettings.smtpConfig = {
      host: smtpConfig.host ? smtpConfig.host.trim() : '',
      port: parseInt(smtpConfig.port, 10) || 587,
      username: smtpConfig.username ? smtpConfig.username.trim() : '',
      password: smtpConfig.password ? smtpConfig.password.trim() : '',
      encryption: ['tls', 'ssl', 'none'].includes(smtpConfig.encryption) ? smtpConfig.encryption : 'tls',
      fromEmail: smtpConfig.fromEmail ? smtpConfig.fromEmail.trim() : '',
      fromName: smtpConfig.fromName ? smtpConfig.fromName.trim() : '',
      isConfigured: Boolean(
        smtpConfig.isConfigured &&
        smtpConfig.host &&
        smtpConfig.host.trim() &&
        smtpConfig.fromEmail &&
        smtpConfig.fromEmail.trim()
      ),
    };
  }
  organization.settings = currentSettings;
  organization.markModified('settings');

  await organization.save();

  return {
    ...organization.toJSON(),
    role: userRole,
  };
};

/**
 * Soft deletes an organization (owner only)
 */
const deleteOrganization = async ({ organization, userRole }) => {
  if (userRole !== 'owner') {
    const error = new Error('Only the organization owner can delete this organization');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  organization.status = 'deleted';
  await organization.save();

  return {
    message: 'Organization deleted successfully',
  };
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};
