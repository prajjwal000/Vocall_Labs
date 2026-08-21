const express = require('express');
const platformRoleController = require('../controllers/platformRole.controller');
const { authenticate } = require('../middleware/authMiddleware');
const {
  requirePlatformUser,
  requirePlatformPermission,
} = require('../middleware/platformAuthMiddleware');

const router = express.Router();

// All platform routes require global authentication + active platform user status
router.use(authenticate);
router.use(requirePlatformUser);

// Platform User Permissions
router.get('/me/permissions', platformRoleController.getMyPlatformPermissions);

// Platform Dashboard (Any platform user can view)
router.get('/dashboard', platformRoleController.getPlatformDashboard);

// Platform Organizations Control
router.get('/organizations', requirePlatformPermission('organizations.view'), platformRoleController.getAllOrganizations);
router.patch('/organizations/:orgId', requirePlatformPermission('organizations.update'), platformRoleController.updateOrganizationPlatformControl);

// Platform Role Management
router.get('/roles', requirePlatformPermission('roles.view'), platformRoleController.getPlatformRoles);
router.get('/roles/:roleId', requirePlatformPermission('roles.view'), platformRoleController.getPlatformRoleById);
router.patch('/roles/:roleId', requirePlatformPermission('roles.update'), platformRoleController.updatePlatformRole);

// Platform Team & Users Management
router.get('/users', requirePlatformPermission('users.view'), platformRoleController.getPlatformUsers);
router.patch('/users/:userId/role', requirePlatformPermission('users.update'), platformRoleController.assignUserPlatformRole);

// Pricing Plans
router.get('/pricing', requirePlatformPermission('pricing.view'), platformRoleController.getPricingPlans);
router.patch('/pricing/:planKey', requirePlatformPermission('pricing.update'), platformRoleController.updatePricingPlan);

// Subscriptions
router.get('/subscriptions', requirePlatformPermission('subscriptions.view'), platformRoleController.getSubscriptions);

// Support Tickets
router.get('/tickets', requirePlatformPermission('tickets.view'), platformRoleController.getTickets);
router.get('/tickets/:ticketId', requirePlatformPermission('tickets.view'), platformRoleController.getTicketById);
router.patch('/tickets/:ticketId', requirePlatformPermission('tickets.update'), platformRoleController.updateTicket);
router.post('/tickets/:ticketId/reply', requirePlatformPermission('tickets.update'), platformRoleController.replyTicket);

// Audit Logs
router.get('/audit', requirePlatformPermission('audit.view'), platformRoleController.getAuditLogs);

// Global Platform Settings
router.get('/settings', requirePlatformPermission('settings.view'), platformRoleController.getPlatformSettings);
router.patch('/settings', requirePlatformPermission('settings.update'), platformRoleController.updatePlatformSettings);

module.exports = router;
