const express = require('express');
const invitationController = require('../controllers/invitation.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');

// Public / Token routes
const publicRouter = express.Router();

publicRouter.get('/:token', invitationController.getInvitationByToken);
publicRouter.post('/:token/accept', optionalAuthenticate, invitationController.acceptInvitation);

// Organization Admin Invitation routes (merged params)
const orgInvitationRouter = express.Router({ mergeParams: true });

orgInvitationRouter.use(authenticate);
orgInvitationRouter.use(requireOrganizationMembership);

orgInvitationRouter.post('/', invitationController.createInvitation);
orgInvitationRouter.get('/', invitationController.getOrganizationInvitations);
orgInvitationRouter.post('/:invitationId/resend', invitationController.resendInvitation);
orgInvitationRouter.delete('/:invitationId', invitationController.revokeInvitation);

module.exports = {
  publicRouter,
  orgInvitationRouter,
};
