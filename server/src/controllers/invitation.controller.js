const invitationService = require('../services/invitation.service');
const { setAuthCookie } = require('../utils/cookie');

/**
 * Create a new employee invitation
 * POST /api/organizations/:organizationId/invitations
 */
const createInvitation = async (req, res, next) => {
  try {
    const { email, roleKey } = req.body;
    const invitation = await invitationService.createInvitation({
      organizationId: req.organization._id,
      email,
      roleKey,
      inviterUser: req.user,
      userRole: req.userRole,
    });

    res.status(201).json({
      success: true,
      data: {
        invitation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List invitations for an organization
 * GET /api/organizations/:organizationId/invitations
 */
const getOrganizationInvitations = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await invitationService.getOrganizationInvitations({
      organizationId: req.organization._id,
      status,
      page,
      limit,
      userRole: req.userRole,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend an invitation
 * POST /api/organizations/:organizationId/invitations/:invitationId/resend
 */
const resendInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const invitation = await invitationService.resendInvitation({
      organizationId: req.organization._id,
      invitationId,
      inviterUser: req.user,
      userRole: req.userRole,
    });

    res.status(200).json({
      success: true,
      data: {
        invitation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke an invitation
 * DELETE /api/organizations/:organizationId/invitations/:invitationId
 */
const revokeInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const result = await invitationService.revokeInvitation({
      organizationId: req.organization._id,
      invitationId,
      userRole: req.userRole,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inspect invitation by token
 * GET /api/invitations/:token
 */
const getInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const data = await invitationService.getInvitationByToken(token);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept invitation and authenticate
 * POST /api/invitations/:token/accept
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await invitationService.acceptInvitation({
      rawToken: token,
      registrationData: req.body,
      currentUser: req.user || null,
      ipAddress,
      userAgent,
    });

    if (result.token) {
      setAuthCookie(res, result.token);
    }

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        organization: result.organization,
      },
    });
  } catch (error) {
    next(error);
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
