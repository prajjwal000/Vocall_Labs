const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const WorkflowRequest = require('../models/WorkflowRequest');
const Task = require('../models/Task');
const SupportTicket = require('../models/SupportTicket');
const PlatformAuditLog = require('../models/PlatformAuditLog');
const PlatformSetting = require('../models/PlatformSetting');

/**
 * Ensures global platform settings exist
 */
const getOrCreatePlatformSettings = async () => {
  let settings = await PlatformSetting.findOne({ key: 'global_config' });
  if (!settings) {
    settings = await PlatformSetting.create({ key: 'global_config' });
  }
  return settings;
};

/**
 * Log platform administrative action to audit trail
 */
const recordAuditLog = async ({
  action,
  actorUser,
  targetType,
  targetId,
  targetName,
  details = {},
  ipAddress = '127.0.0.1',
  userAgent = '',
}) => {
  try {
    await PlatformAuditLog.create({
      action,
      actorId: actorUser?._id || actorUser?.id,
      actorName: actorUser ? `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() : 'System',
      actorEmail: actorUser?.email || 'system@nexus.internal',
      targetType,
      targetId: targetId ? targetId.toString() : '',
      targetName: targetName || '',
      details,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('Failed to record platform audit log:', err);
  }
};

/**
 * Aggregates high-level Platform KPIs and Overview Statistics
 */
const getPlatformDashboardStats = async () => {
  const [
    totalOrgs,
    activeOrgs,
    suspendedOrgs,
    starterOrgs,
    growthOrgs,
    enterpriseOrgs,
    totalUsers,
    platformUsers,
    totalWorkflows,
    totalRequests,
    completedTasks,
    openTickets,
    recentOrgs,
  ] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: 'active' }),
    Organization.countDocuments({ status: 'suspended' }),
    Organization.countDocuments({ plan: 'starter' }),
    Organization.countDocuments({ plan: 'growth' }),
    Organization.countDocuments({ plan: 'enterprise' }),
    User.countDocuments(),
    User.countDocuments({ isPlatformUser: true, platformStatus: 'active' }),
    Workflow.countDocuments({ status: { $ne: 'archived' } }),
    WorkflowRequest.countDocuments(),
    Task.countDocuments({ status: 'completed' }),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Organization.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('ownerId', 'firstName lastName email'),
  ]);

  // Estimate Monthly Recurring Revenue
  const mrr = growthOrgs * 49 + enterpriseOrgs * 199;

  return {
    overview: {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      suspendedOrganizations: suspendedOrgs,
      totalUsers,
      platformStaffCount: platformUsers,
      totalWorkflows,
      totalRequests,
      completedTasks,
      openTickets,
      monthlyRecurringRevenue: mrr,
    },
    planDistribution: {
      starter: starterOrgs,
      growth: growthOrgs,
      enterprise: enterpriseOrgs,
    },
    recentOrganizations: recentOrgs.map((o) => ({
      id: o.id || o._id.toString(),
      name: o.name,
      slug: o.slug,
      plan: o.plan,
      status: o.status,
      owner: o.ownerId ? `${o.ownerId.firstName || ''} ${o.ownerId.lastName || ''}`.trim() : 'Unknown',
      ownerEmail: o.ownerId?.email || '',
      createdAt: o.createdAt,
    })),
  };
};

/**
 * Lists all customer organizations with stats & usage metrics
 */
const getAllOrganizations = async ({ search = '', plan, status, page = 1, limit = 20 }) => {
  const query = {};

  if (status && ['active', 'suspended', 'archived'].includes(status)) {
    query.status = status;
  }

  if (plan && ['starter', 'growth', 'enterprise'].includes(plan)) {
    query.plan = plan;
  }

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: searchRegex }, { slug: searchRegex }];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [orgs, total] = await Promise.all([
    Organization.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('ownerId', 'firstName lastName email'),
    Organization.countDocuments(query),
  ]);

  // Aggregate usage counts per organization
  const orgIds = orgs.map((o) => o._id);
  const [memberCounts, workflowCounts, requestCounts] = await Promise.all([
    OrganizationMember.aggregate([
      { $match: { organizationId: { $in: orgIds }, status: 'active' } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Workflow.aggregate([
      { $match: { organizationId: { $in: orgIds }, status: { $ne: 'archived' } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    WorkflowRequest.aggregate([
      { $match: { organizationId: { $in: orgIds } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
  ]);

  const memberMap = new Map(memberCounts.map((m) => [m._id.toString(), m.count]));
  const workflowMap = new Map(workflowCounts.map((w) => [w._id.toString(), w.count]));
  const requestMap = new Map(requestCounts.map((r) => [r._id.toString(), r.count]));

  const enrichedOrgs = orgs.map((org) => {
    const id = org.id || org._id.toString();
    return {
      id,
      name: org.name,
      slug: org.slug,
      plan: org.plan || 'starter',
      status: org.status || 'active',
      owner: org.ownerId ? {
        id: org.ownerId._id.toString(),
        name: `${org.ownerId.firstName || ''} ${org.ownerId.lastName || ''}`.trim(),
        email: org.ownerId.email,
      } : null,
      stats: {
        activeMembers: memberMap.get(id) || 1,
        activeWorkflows: workflowMap.get(id) || 0,
        totalRequests: requestMap.get(id) || 0,
        storageUsedMb: 0,
      },
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  });

  return {
    data: enrichedOrgs,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Updates an organization's plan, status, or configuration
 */
const updateOrganizationPlatformControl = async ({
  orgId,
  updateData,
  actorUser,
  ipAddress = '127.0.0.1',
  userAgent = '',
}) => {
  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    const error = new Error('Invalid organization ID');
    error.statusCode = 400;
    throw error;
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    const error = new Error('Organization not found');
    error.statusCode = 404;
    throw error;
  }

  const { plan, status, name, settings } = updateData;
  const changes = {};

  if (plan && ['starter', 'growth', 'enterprise'].includes(plan)) {
    changes.plan = { from: org.plan, to: plan };
    org.plan = plan;
  }

  if (status && ['active', 'suspended', 'archived'].includes(status)) {
    changes.status = { from: org.status, to: status };
    org.status = status;
  }

  if (name && typeof name === 'string' && name.trim()) {
    changes.name = { from: org.name, to: name.trim() };
    org.name = name.trim();
  }

  if (settings && typeof settings === 'object') {
    org.settings = {
      ...(org.settings?.toObject ? org.settings.toObject() : org.settings || {}),
      ...settings,
    };
  }

  await org.save();

  // Record audit log
  await recordAuditLog({
    action: status === 'suspended' ? 'organization.suspended' : 'organization.updated',
    actorUser,
    targetType: 'Organization',
    targetId: org._id,
    targetName: org.name,
    details: changes,
    ipAddress,
    userAgent,
  });

  return org.toJSON();
};

/**
 * Returns Platform Pricing Tiers & Configuration
 */
const getPricingPlans = async () => {
  const settings = await getOrCreatePlatformSettings();
  return {
    plans: [
      {
        key: 'starter',
        name: 'Starter Plan',
        priceMonthly: settings.planLimits?.starter?.priceMonthly ?? 0,
        description: 'Free tier for small teams starting operational automation',
        limits: settings.planLimits?.starter || {
          membersLimit: 5,
          workflowsLimit: 5,
          tasksLimit: 20,
          storageLimitMb: 500,
        },
        features: [
          'Up to 5 Team Members',
          '5 Automated Workflows',
          'Standard Approval Routing',
          '500 MB Storage',
          'Community Support',
        ],
      },
      {
        key: 'growth',
        name: 'Growth Plan',
        priceMonthly: settings.planLimits?.growth?.priceMonthly ?? 49,
        description: 'Growing organizations needing multi-stage approvals and AI pipelines',
        limits: settings.planLimits?.growth || {
          membersLimit: 100,
          workflowsLimit: 50,
          tasksLimit: 500,
          storageLimitMb: 5000,
        },
        features: [
          'Up to 100 Team Members',
          '50 Automated Workflows',
          'AI Workflow Synthesis',
          'Custom RBAC Matrix',
          '5 GB Cloud Storage',
          'Priority Support',
        ],
      },
      {
        key: 'enterprise',
        name: 'Enterprise Tier',
        priceMonthly: settings.planLimits?.enterprise?.priceMonthly ?? 199,
        description: 'Dedicated enterprise clusters with unlimited scale and custom SLAs',
        limits: settings.planLimits?.enterprise || {
          membersLimit: 1000,
          workflowsLimit: 500,
          tasksLimit: 10000,
          storageLimitMb: 50000,
        },
        features: [
          'Up to 1,000 Team Members',
          '500 Automated Workflows',
          'Dedicated Support SLA',
          'S3 & Azure Storage Connectors',
          '50 GB Storage',
          'Custom Auditing & Compliance',
        ],
      },
    ],
  };
};

/**
 * Updates a Pricing Plan Tier
 */
const updatePricingPlan = async ({
  planKey,
  data,
  actorUser,
  ipAddress = '127.0.0.1',
  userAgent = '',
}) => {
  const settings = await getOrCreatePlatformSettings();
  if (!settings.planLimits[planKey]) {
    const error = new Error(`Unknown plan tier: ${planKey}`);
    error.statusCode = 400;
    throw error;
  }

  const current = settings.planLimits[planKey];
  if (data.priceMonthly !== undefined) current.priceMonthly = Number(data.priceMonthly);
  if (data.membersLimit !== undefined) current.membersLimit = Number(data.membersLimit);
  if (data.workflowsLimit !== undefined) current.workflowsLimit = Number(data.workflowsLimit);
  if (data.tasksLimit !== undefined) current.tasksLimit = Number(data.tasksLimit);
  if (data.storageLimitMb !== undefined) current.storageLimitMb = Number(data.storageLimitMb);

  settings.updatedBy = actorUser?._id;
  await settings.save();

  await recordAuditLog({
    action: 'pricing.updated',
    actorUser,
    targetType: 'PricingPlan',
    targetId: planKey,
    targetName: planKey.toUpperCase(),
    details: data,
    ipAddress,
    userAgent,
  });

  return settings.planLimits[planKey];
};

/**
 * Lists tenant subscriptions & billing metrics
 */
const getSubscriptions = async ({ search = '', status, page = 1, limit = 20 }) => {
  const query = {};
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: searchRegex }, { slug: searchRegex }];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [orgs, total] = await Promise.all([
    Organization.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('ownerId', 'firstName lastName email'),
    Organization.countDocuments(query),
  ]);

  const planPrices = { starter: 0, growth: 49, enterprise: 199 };

  const subscriptions = orgs.map((org) => ({
    id: org.id || org._id.toString(),
    organization: {
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      ownerEmail: org.ownerId?.email || '',
    },
    plan: org.plan || 'starter',
    priceMonthly: planPrices[org.plan] || 0,
    billingStatus: org.status === 'suspended' ? 'suspended' : 'active',
    billingCycle: 'monthly',
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: org.createdAt,
  }));

  return {
    data: subscriptions,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Sequential Support Ticket Code Generator (e.g., TCK-1001)
 */
const generateTicketCode = async () => {
  const latest = await SupportTicket.findOne().sort({ createdAt: -1 }).select('ticketCode');
  if (!latest || !latest.ticketCode) {
    return 'TCK-1001';
  }
  const match = latest.ticketCode.match(/TCK-(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10) + 1;
    return `TCK-${num.toString().padStart(4, '0')}`;
  }
  return `TCK-${Date.now().toString().slice(-4)}`;
};

/**
 * Creates a support ticket from customer app
 */
const createSupportTicket = async ({ organizationId, userId, user, subject, description, category, priority }) => {
  if (!subject || !description) {
    const error = new Error('Subject and description are required');
    error.statusCode = 400;
    throw error;
  }

  const ticketCode = await generateTicketCode();

  const ticket = await SupportTicket.create({
    ticketCode,
    organizationId,
    userId,
    subject: subject.trim(),
    description: description.trim(),
    category: category || 'general',
    priority: priority || 'medium',
    status: 'open',
    messages: [
      {
        senderId: userId,
        senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        senderType: 'user',
        text: description.trim(),
        createdAt: new Date(),
      },
    ],
  });

  return ticket;
};

/**
 * Lists Platform Support Tickets
 */
const getTickets = async ({ status, priority, category, search = '', page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ ticketCode: searchRegex }, { subject: searchRegex }, { description: searchRegex }];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('organizationId', 'name slug')
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email'),
    SupportTicket.countDocuments(query),
  ]);

  return {
    data: tickets,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Gets single support ticket detail
 */
const getTicketById = async (ticketId) => {
  const ticket = await SupportTicket.findById(ticketId)
    .populate('organizationId', 'name slug')
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');

  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }
  return ticket;
};

/**
 * Updates Support Ticket Status or Assignment
 */
const updateTicket = async ({ ticketId, status, priority, assignedTo, actorUser, ipAddress = '127.0.0.1', userAgent = '' }) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

  await ticket.save();

  await recordAuditLog({
    action: 'ticket.updated',
    actorUser,
    targetType: 'SupportTicket',
    targetId: ticket._id,
    targetName: ticket.ticketCode,
    details: { status, priority, assignedTo },
    ipAddress,
    userAgent,
  });

  return ticket;
};

/**
 * Replies to a support ticket thread
 */
const replyTicket = async ({ ticketId, text, actorUser, ipAddress = '127.0.0.1', userAgent = '' }) => {
  if (!text || !text.trim()) {
    const error = new Error('Reply text cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  ticket.messages.push({
    senderId: actorUser._id,
    senderName: `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() || 'Platform Support',
    senderType: 'admin',
    text: text.trim(),
    createdAt: new Date(),
  });

  if (ticket.status === 'open') {
    ticket.status = 'in_progress';
  }

  await ticket.save();

  await recordAuditLog({
    action: 'ticket.replied',
    actorUser,
    targetType: 'SupportTicket',
    targetId: ticket._id,
    targetName: ticket.ticketCode,
    details: { textLength: text.length },
    ipAddress,
    userAgent,
  });

  return ticket;
};

/**
 * Returns Platform Audit Logs
 */
const getAuditLogs = async ({ action, search = '', page = 1, limit = 50 }) => {
  const query = {};
  if (action) query.action = action;
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ action: searchRegex }, { actorName: searchRegex }, { actorEmail: searchRegex }, { targetName: searchRegex }];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  const [logs, total] = await Promise.all([
    PlatformAuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    PlatformAuditLog.countDocuments(query),
  ]);

  return {
    data: logs,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Returns Global Platform Settings
 */
const getPlatformSettings = async () => {
  return await getOrCreatePlatformSettings();
};

/**
 * Updates Global Platform Settings
 */
const updatePlatformSettings = async ({ data, actorUser, ipAddress = '127.0.0.1', userAgent = '' }) => {
  const settings = await getOrCreatePlatformSettings();
  const { platformName, maintenanceMode, registrationAllowed, defaultStorageProvider, aiConfig } = data;

  if (platformName !== undefined) settings.platformName = platformName.trim();
  if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
  if (registrationAllowed !== undefined) settings.registrationAllowed = Boolean(registrationAllowed);
  if (defaultStorageProvider !== undefined) settings.defaultStorageProvider = defaultStorageProvider;
  if (aiConfig !== undefined) {
    settings.aiConfig = {
      ...(settings.aiConfig?.toObject ? settings.aiConfig.toObject() : settings.aiConfig || {}),
      ...aiConfig,
    };
  }

  settings.updatedBy = actorUser?._id;
  await settings.save();

  await recordAuditLog({
    action: 'settings.updated',
    actorUser,
    targetType: 'PlatformSetting',
    targetId: 'global_config',
    targetName: 'Platform Configuration',
    details: data,
    ipAddress,
    userAgent,
  });

  return settings;
};

module.exports = {
  recordAuditLog,
  getPlatformDashboardStats,
  getAllOrganizations,
  updateOrganizationPlatformControl,
  getPricingPlans,
  updatePricingPlan,
  getSubscriptions,
  createSupportTicket,
  getTickets,
  getTicketById,
  updateTicket,
  replyTicket,
  getAuditLogs,
  getPlatformSettings,
  updatePlatformSettings,
};
