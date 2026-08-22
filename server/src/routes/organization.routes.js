const express = require('express');
const organizationController = require('../controllers/organization.controller');
const roleController = require('../controllers/role.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router();

// All organization routes require global authentication
router.use(authenticate);

// Collection routes
router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getUserOrganizations);

// Document routes with organization membership validation
router.get('/:organizationId', requireOrganizationMembership, organizationController.getOrganizationById);
router.patch('/:organizationId', requireOrganizationMembership, organizationController.updateOrganization);
router.delete('/:organizationId', requireOrganizationMembership, organizationController.deleteOrganization);
router.post('/:organizationId/ai/test', requireOrganizationMembership, organizationController.testAiConnection);
router.post('/:organizationId/storage/test', requireOrganizationMembership, organizationController.testStorageConnection);
router.post('/:organizationId/smtp/test', requireOrganizationMembership, organizationController.testSmtp);

// Organization Invitation Sub-routes
const { orgInvitationRouter } = require('./invitation.routes');
router.use('/:organizationId/invitations', orgInvitationRouter);

// Organization Roles Sub-routes
const roleRouter = require('./role.routes');
router.use('/:organizationId/roles', roleRouter);

// Organization Departments Sub-routes
const departmentRouter = require('./department.routes');
router.use('/:organizationId/departments', departmentRouter);

// Organization Employees Sub-routes
const employeeRouter = require('./employee.routes');
router.use('/:organizationId/employees', employeeRouter);

// Organization Members & Role Assignment routes
router.get('/:organizationId/members', requireOrganizationMembership, requirePermission('roles.read'), roleController.getOrganizationMembers);
router.patch('/:organizationId/members/:memberId/role', requireOrganizationMembership, requirePermission('roles.update'), roleController.assignMemberRole);

module.exports = router;
