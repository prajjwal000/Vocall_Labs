const crypto = require('crypto');
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const OrganizationInvitation = require('../models/OrganizationInvitation');
const User = require('../models/User');
const Role = require('../models/Role');
const Session = require('../models/Session');
const { validatePassword, hashPassword } = require('../utils/passwordPolicy');
const { signToken } = require('../utils/jwt');
const { sendOrganizationInvitationEmail } = require('./emailService');

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Creates a new organization employee invitation
 */
const createInvitation = async ({ organizationId, email, inviterUser, userRole }) => {
  if (userRole !== 'owner' && userRole !== 'admin') {
    const error = new Error('Only organization owners and admins can invite members');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  const organization = await Organization.findById(organizationId);
  if (!organization || organization.status === 'deleted') {
    const error = new Error('Organization not found');
    error.statusCode = 404;
    error.code = 'ORGANIZATION_NOT_FOUND';
    throw error;
  }

  // Domain restriction validation
  if (organization.settings?.domainRestrictionEnabled) {
    const emailDomain = normalizedEmail.split('@')[1].toLowerCase().trim();
    const allowedDomains = (organization.settings.allowedEmailDomains || []).map((d) =>
      d.toLowerCase().trim()
    );

    if (!allowedDomains.includes(emailDomain)) {
      const error = new Error('This email domain is not allowed for this organization');
      error.statusCode = 403;
      error.code = 'EMAIL_DOMAIN_NOT_ALLOWED';
      throw error;
    }
  }

  // Check if user is already an active member of this organization
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const existingMember = await OrganizationMember.findOne({
      organizationId,
      userId: existingUser._id,
      status: 'active',
    });

    if (existingMember) {
      const error = new Error('This user is already a member of the organization');
      error.statusCode = 409;
      error.code = 'ALREADY_MEMBER';
      throw error;
    }
  }

  // Check if an active pending invitation already exists for this email
  const existingInvitation = await OrganizationInvitation.findOne({
    organizationId,
    email: normalizedEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });

  if (existingInvitation) {
    const error = new Error('An active invitation has already been sent to this email address');
    error.statusCode = 409;
    error.code = 'INVITATION_ALREADY_EXISTS';
    throw error;
  }

  // Generate cryptographically secure token and SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const ttlDays = parseInt(process.env.ORG_INVITATION_TTL_DAYS || '7', 10);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const invitation = await OrganizationInvitation.create({
    organizationId,
    email: normalizedEmail,
    invitedBy: inviterUser._id,
    tokenHash,
    status: 'pending',
    expiresAt,
  });

  // Send invitation email asynchronously
  try {
    await sendOrganizationInvitationEmail({
      to: normalizedEmail,
      organizationName: organization.name,
      inviterName: `${inviterUser.firstName} ${inviterUser.lastName}`,
      rawToken,
      expiresAt,
    });
  } catch (err) {
    console.error('Error sending invitation email:', err);
  }

  return {
    ...invitation.toJSON(),
    rawToken, // provided only on creation for testing / preview
  };
};

/**
 * Lists invitations for an organization with pagination and status filtering
 */
const getOrganizationInvitations = async ({
  organizationId,
  status,
  page = 1,
  limit = 20,
  userRole,
}) => {
  if (userRole !== 'owner' && userRole !== 'admin') {
    const error = new Error('Only organization owners and admins can view invitations');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const query = { organizationId };
  if (status && ['pending', 'accepted', 'expired', 'revoked'].includes(status)) {
    query.status = status;
  }

  // Auto-mark expired invitations in background
  await OrganizationInvitation.updateMany(
    {
      organizationId,
      status: 'pending',
      expiresAt: { $lt: new Date() },
    },
    { status: 'expired' }
  );

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [invitations, total] = await Promise.all([
    OrganizationInvitation.find(query)
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    OrganizationInvitation.countDocuments(query),
  ]);

  return {
    data: invitations.map((inv) => ({
      id: inv.id || inv._id.toString(),
      email: inv.email,
      status: inv.status,
      invitedBy: inv.invitedBy,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      revokedAt: inv.revokedAt,
      createdAt: inv.createdAt,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Resends an invitation with a fresh token and reset expiration
 */
const resendInvitation = async ({ organizationId, invitationId, inviterUser, userRole }) => {
  if (userRole !== 'owner' && userRole !== 'admin') {
    const error = new Error('Only organization owners and admins can resend invitations');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const invitation = await OrganizationInvitation.findOne({
    _id: invitationId,
    organizationId,
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    error.code = 'INVITATION_NOT_FOUND';
    throw error;
  }

  if (invitation.status === 'accepted' || invitation.status === 'revoked') {
    const error = new Error(`Cannot resend an invitation that is already ${invitation.status}`);
    error.statusCode = 400;
    error.code = 'CANNOT_RESEND';
    throw error;
  }

  const organization = await Organization.findById(organizationId);

  // Generate new token & hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const ttlDays = parseInt(process.env.ORG_INVITATION_TTL_DAYS || '7', 10);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  invitation.tokenHash = tokenHash;
  invitation.status = 'pending';
  invitation.expiresAt = expiresAt;
  invitation.invitedBy = inviterUser._id;
  await invitation.save();

  try {
    await sendOrganizationInvitationEmail({
      to: invitation.email,
      organizationName: organization.name,
      inviterName: `${inviterUser.firstName} ${inviterUser.lastName}`,
      rawToken,
      expiresAt,
    });
  } catch (err) {
    console.error('Error resending invitation email:', err);
  }

  return {
    ...invitation.toJSON(),
    rawToken,
  };
};

/**
 * Revokes a pending invitation
 */
const revokeInvitation = async ({ organizationId, invitationId, userRole }) => {
  if (userRole !== 'owner' && userRole !== 'admin') {
    const error = new Error('Only organization owners and admins can revoke invitations');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const invitation = await OrganizationInvitation.findOne({
    _id: invitationId,
    organizationId,
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    error.code = 'INVITATION_NOT_FOUND';
    throw error;
  }

  invitation.status = 'revoked';
  invitation.revokedAt = new Date();
  await invitation.save();

  return {
    message: 'Invitation revoked successfully',
  };
};

/**
 * Retrieves safe invitation details by unhashed token
 */
const getInvitationByToken = async (rawToken) => {
  if (!rawToken) {
    const error = new Error('Invitation token is required');
    error.statusCode = 400;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const invitation = await OrganizationInvitation.findOne({ tokenHash }).select(
    '+tokenHash'
  );

  if (!invitation) {
    const error = new Error('Invalid invitation link');
    error.statusCode = 400;
    error.code = 'INVALID_INVITATION';
    throw error;
  }

  if (invitation.status === 'accepted') {
    const error = new Error('This invitation has already been accepted');
    error.statusCode = 410;
    error.code = 'INVITATION_ALREADY_ACCEPTED';
    throw error;
  }

  if (invitation.status === 'revoked') {
    const error = new Error('This invitation has been revoked by the organization admin');
    error.statusCode = 410;
    error.code = 'INVITATION_REVOKED';
    throw error;
  }

  if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();

    const error = new Error('This invitation has expired. Please ask the organization admin to resend it.');
    error.statusCode = 410;
    error.code = 'INVITATION_EXPIRED';
    throw error;
  }

  const organization = await Organization.findOne({
    _id: invitation.organizationId,
    status: { $ne: 'deleted' },
  });

  if (!organization) {
    const error = new Error('The organization for this invitation no longer exists');
    error.statusCode = 410;
    error.code = 'ORGANIZATION_DELETED';
    throw error;
  }

  const existingUser = await User.findOne({ email: invitation.email });

  return {
    organizationId: organization._id.toString(),
    organizationName: organization.name,
    organizationSlug: organization.slug,
    email: invitation.email,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    requiresRegistration: !existingUser,
    existingUser: Boolean(existingUser),
  };
};

/**
 * Accepts an invitation atomically for a new or existing user
 */
const acceptInvitation = async ({
  rawToken,
  registrationData = {},
  currentUser = null,
  ipAddress,
  userAgent,
}) => {
  if (!rawToken) {
    const error = new Error('Invitation token is required');
    error.statusCode = 400;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const invitation = await OrganizationInvitation.findOne({
    tokenHash,
  }).select('+tokenHash');

  if (!invitation) {
    const error = new Error('Invalid invitation token');
    error.statusCode = 400;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  if (invitation.status === 'accepted') {
    const error = new Error('This invitation has already been accepted');
    error.statusCode = 410;
    error.code = 'INVITATION_ALREADY_ACCEPTED';
    throw error;
  }

  if (invitation.status === 'revoked') {
    const error = new Error('This invitation has been revoked by the organization admin');
    error.statusCode = 410;
    error.code = 'INVITATION_REVOKED';
    throw error;
  }

  if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    const error = new Error('This invitation has expired. Please ask the organization admin to resend it.');
    error.statusCode = 410;
    error.code = 'INVITATION_EXPIRED';
    throw error;
  }

  const organization = await Organization.findOne({
    _id: invitation.organizationId,
    status: { $ne: 'deleted' },
  });

  if (!organization) {
    const error = new Error('The organization no longer exists');
    error.statusCode = 410;
    error.code = 'ORGANIZATION_DELETED';
    throw error;
  }

  let user = currentUser;

  if (!user) {
    user = await User.findOne({ email: invitation.email });
  }

  // Handle transaction where supported (Replica Sets / Atlas / Sharded)
  let session = null;
  const topologyType = mongoose.connection?.client?.topology?.description?.type;
  const isReplicaSet = typeof topologyType === 'string' && (
    topologyType.includes('ReplicaSet') ||
    topologyType.includes('Sharded') ||
    topologyType.includes('LoadBalanced')
  );

  if (isReplicaSet) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  try {
    if (!user) {
      // New user registration flow
      const { firstName, lastName, password } = registrationData;

      if (!firstName || !lastName || !password) {
        const error = new Error('First name, last name, and password are required');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = new Error(passwordValidation.message);
        error.statusCode = 400;
        error.code = 'PASSWORD_POLICY_FAILED';
        throw error;
      }

      const passwordHash = await hashPassword(password);

      const [newUser] = await User.create(
        [
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: invitation.email,
            passwordHash,
            status: 'active',
            emailVerified: true,
          },
        ],
        session ? { session } : {}
      );

      user = newUser;
    }

    // Look up default member role for the organization
    const defaultMemberRole = await Role.findOne({
      organizationId: organization._id,
      key: 'member',
    }).session(session || null);

    // Create or activate organization membership
    const memberFilter = {
      organizationId: organization._id,
      userId: user._id,
    };

    const existingMember = await OrganizationMember.findOne(memberFilter).session(
      session || null
    );

    if (existingMember) {
      existingMember.status = 'active';
      existingMember.role = 'member';
      if (defaultMemberRole) existingMember.roleId = defaultMemberRole._id;
      await existingMember.save(session ? { session } : {});
    } else {
      await OrganizationMember.create(
        [
          {
            organizationId: organization._id,
            userId: user._id,
            roleId: defaultMemberRole?._id,
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
          },
        ],
        session ? { session } : {}
      );
    }

    // Mark invitation accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save(session ? { session } : {});

    // Create session for user
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await Session.create(
      [
        {
          userId: user._id,
          sessionId,
          expiresAt,
          ipAddress,
          userAgent,
        },
      ],
      session ? { session } : {}
    );

    const token = signToken({
      userId: user._id.toString(),
      sessionId,
    });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      user: user.toJSON(),
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        role: 'member',
      },
      token,
    };
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw err;
  }
};

module.exports = {
  createInvitation,
  getOrganizationInvitations,
  resendInvitation,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
};
