const platformRoleService = require('../services/platformRole.service');
const platformAdminService = require('../services/platformAdmin.service');

/**
 * Get current platform user's role and permissions
 * GET /api/admin/me/permissions
 */
const getMyPlatformPermissions = async (req, res, next) => {
  try {
    const data = await platformRoleService.getCurrentUserPlatformPermissions(req.user._id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all platform roles with catalog
 * GET /api/admin/roles
 */
const getPlatformRoles = async (req, res, next) => {
  try {
    const result = await platformRoleService.getPlatformRoles();
    res.status(200).json({
      success: true,
      data: result.roles,
      catalog: result.catalog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single platform role by ID
 * GET /api/admin/roles/:roleId
 */
const getPlatformRoleById = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const role = await platformRoleService.getPlatformRoleById(roleId);
    res.status(200).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update platform role permissions
 * PATCH /api/admin/roles/:roleId
 */
const updatePlatformRole = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const role = await platformRoleService.updatePlatformRole({
      roleId,
      updateData: req.body,
      currentPlatformUser: req.user,
    });

    res.status(200).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all platform users
 * GET /api/admin/users
 */
const getPlatformUsers = async (req, res, next) => {
  try {
    const users = await platformRoleService.getPlatformUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign platform role to a user
 * PATCH /api/admin/users/:userId/role
 */
const assignUserPlatformRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await platformRoleService.assignUserPlatformRole({
      targetUserId: userId,
      roleId,
      currentPlatformUser: req.user,
    });

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PLATFORM DASHBOARD & ORGANIZATIONS CONTROL
// ==========================================

/**
 * GET /api/admin/dashboard
 */
const getPlatformDashboard = async (req, res, next) => {
  try {
    const stats = await platformAdminService.getPlatformDashboardStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/organizations
 */
const getAllOrganizations = async (req, res, next) => {
  try {
    const { search, plan, status, page, limit } = req.query;
    const result = await platformAdminService.getAllOrganizations({
      search,
      plan,
      status,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/organizations/:orgId
 */
const updateOrganizationPlatformControl = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const updated = await platformAdminService.updateOrganizationPlatformControl({
      orgId,
      updateData: req.body,
      actorUser: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRICING PLANS & SUBSCRIPTIONS
// ==========================================

/**
 * GET /api/admin/pricing
 */
const getPricingPlans = async (req, res, next) => {
  try {
    const result = await platformAdminService.getPricingPlans();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/pricing/:planKey
 */
const updatePricingPlan = async (req, res, next) => {
  try {
    const { planKey } = req.params;
    const updated = await platformAdminService.updatePricingPlan({
      planKey,
      data: req.body,
      actorUser: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Pricing plan updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/subscriptions
 */
const getSubscriptions = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await platformAdminService.getSubscriptions({
      search,
      status,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUPPORT TICKETS
// ==========================================

/**
 * GET /api/admin/tickets
 */
const getTickets = async (req, res, next) => {
  try {
    const { status, priority, category, search, page, limit } = req.query;
    const result = await platformAdminService.getTickets({
      status,
      priority,
      category,
      search,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/tickets/:ticketId
 */
const getTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticket = await platformAdminService.getTicketById(ticketId);
    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tickets/:ticketId
 */
const updateTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, assignedTo } = req.body;
    const ticket = await platformAdminService.updateTicket({
      ticketId,
      status,
      priority,
      assignedTo,
      actorUser: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/tickets/:ticketId/reply
 */
const replyTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;
    const ticket = await platformAdminService.replyTicket({
      ticketId,
      text,
      actorUser: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: ticket,
      message: 'Reply posted to ticket thread',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AUDIT LOGS & SETTINGS
// ==========================================

/**
 * GET /api/admin/audit
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, search, page, limit } = req.query;
    const result = await platformAdminService.getAuditLogs({
      action,
      search,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/settings
 */
const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await platformAdminService.getPlatformSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/settings
 */
const updatePlatformSettings = async (req, res, next) => {
  try {
    const settings = await platformAdminService.updatePlatformSettings({
      data: req.body,
      actorUser: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Platform settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPlatformPermissions,
  getPlatformRoles,
  getPlatformRoleById,
  updatePlatformRole,
  getPlatformUsers,
  assignUserPlatformRole,
  getPlatformDashboard,
  getAllOrganizations,
  updateOrganizationPlatformControl,
  getPricingPlans,
  updatePricingPlan,
  getSubscriptions,
  getTickets,
  getTicketById,
  updateTicket,
  replyTicket,
  getAuditLogs,
  getPlatformSettings,
  updatePlatformSettings,
};
