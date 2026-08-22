const express = require('express');
const invitationController = require('../controllers/invitation.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

// Public / Token routes
const publicRouter = express.Router();

publicRouter.get('/:token', invitationController.getInvitationByToken);
publicRouter.post('/:token/accept', optionalAuthenticate, invitationController.acceptInvitation);

// Organization Admin Invitation routes (merged params)
const orgInvitationRouter = express.Router({ mergeParams: true });

orgInvitationRouter.use(authenticate);
orgInvitationRouter.use(requireOrganizationMembership);

orgInvitationRouter.post('/', requirePermission('invitations.create'), invitationController.createInvitation);
orgInvitationRouter.get('/', invitationController.getOrganizationInvitations);
orgInvitationRouter.post('/:invitationId/resend', requirePermission('invitations.manage'), invitationController.resendInvitation);
orgInvitationRouter.delete('/:invitationId', requirePermission('invitations.manage'), invitationController.revokeInvitation);

module.exports = {
  publicRouter,
  orgInvitationRouter,
};
