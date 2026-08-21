const OrganizationMember = require('../models/OrganizationMember');
const OrganizationInvitation = require('../models/OrganizationInvitation');
const Organization = require('../models/Organization');
const Workflow = require('../models/Workflow');
const WorkflowRequest = require('../models/WorkflowRequest');
const WorkflowApproval = require('../models/WorkflowApproval');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');

/**
 * Aggregates real organization metrics for the dashboard summary
 */
const getDashboardSummary = async ({ organizationId, userPermissions = [], isOwner = false }) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parallel real data queries
  const [
    totalEmployees,
    newThisMonth,
    pendingInvitations,
    activeWorkflows,
    totalWorkflows,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    pendingApprovals,
    approvedToday,
    rejectedToday,
    pendingTasks,
    completedTasks,
    totalTasks,
    organization,
  ] = await Promise.all([
    OrganizationMember.countDocuments({ organizationId, status: 'active' }),
    OrganizationMember.countDocuments({
      organizationId,
      status: 'active',
      joinedAt: { $gte: startOfMonth },
    }),
    OrganizationInvitation.countDocuments({
      organizationId,
      status: 'pending',
      expiresAt: { $gt: now },
    }),
    Workflow.countDocuments({ organizationId, status: 'active' }),
    Workflow.countDocuments({ organizationId, status: { $ne: 'archived' } }),
    WorkflowRequest.countDocuments({ organizationId, status: { $in: ['pending', 'in_progress'] } }),
    WorkflowRequest.countDocuments({ organizationId, status: 'approved' }),
    WorkflowRequest.countDocuments({ organizationId, status: 'rejected' }),
    WorkflowApproval.countDocuments({ organizationId, status: 'pending' }),
    WorkflowApproval.countDocuments({ organizationId, status: 'approved', decidedAt: { $gte: startOfDay } }),
    WorkflowApproval.countDocuments({ organizationId, status: 'rejected', decidedAt: { $gte: startOfDay } }),
    Task.countDocuments({ organizationId, status: { $in: ['pending', 'in_progress'] } }),
    Task.countDocuments({ organizationId, status: 'completed' }),
    Task.countDocuments({ organizationId, status: { $ne: 'cancelled' } }),
    Organization.findById(organizationId).select('name slug plan settings createdAt'),
  ]);

  const permSet = new Set(
    Array.isArray(userPermissions)
      ? userPermissions
      : userPermissions instanceof Set
      ? Array.from(userPermissions)
      : []
  );

  const canReadEmployees = isOwner || permSet.has('*') || permSet.has('employees.read');
  const canReadRequests = isOwner || permSet.has('*') || permSet.has('requests.read');
  const canReadApprovals = isOwner || permSet.has('*') || permSet.has('approvals.read');
  const canReadWorkflows = isOwner || permSet.has('*') || permSet.has('workflows.read');
  const canReadTasks = isOwner || permSet.has('*') || permSet.has('tasks.read');

  const summary = {
    organization: {
      id: organization?._id.toString(),
      name: organization?.name,
      slug: organization?.slug,
      plan: organization?.plan || 'Free Plan',
      createdAt: organization?.createdAt,
    },
    // Employees module metrics
    employees: canReadEmployees
      ? {
          total: totalEmployees,
          newThisMonth,
          pendingInvitations,
          isAvailable: true,
        }
      : { isAvailable: false },

    // Requests module metrics
    requests: canReadRequests
      ? {
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          total: pendingRequests + approvedRequests + rejectedRequests,
          isAvailable: true,
        }
      : { isAvailable: false },

    // Approvals module metrics
    approvals: canReadApprovals
      ? {
          pending: pendingApprovals,
          approvedToday,
          rejectedToday,
          isAvailable: true,
        }
      : { isAvailable: false },

    // Workflows module metrics
    workflows: canReadWorkflows
      ? {
          active: activeWorkflows,
          draft: Math.max(totalWorkflows - activeWorkflows, 0),
          total: totalWorkflows,
          isAvailable: true,
        }
      : { isAvailable: false },

    // Tasks & Delegations module metrics
    tasks: canReadTasks
      ? {
          active: pendingTasks,
          completed: completedTasks,
          total: totalTasks,
          isAvailable: true,
        }
      : { isAvailable: false },

    // Plan & Resource usage
    usage: {
      planName: organization?.plan === 'growth' ? 'Growth Plan' : organization?.plan === 'enterprise' ? 'Enterprise Tier' : 'Starter Workspace',
      membersUsed: totalEmployees,
      membersLimit: organization?.plan === 'growth' ? 100 : 50,
      workflowsUsed: activeWorkflows,
      workflowsLimit: organization?.plan === 'growth' ? 50 : 20,
      tasksUsed: totalTasks,
      storageUsedMb: 0,
      storageLimitMb: 5000,
    },
  };

  return summary;
};

/**
 * Returns real organization events chronologically sorted
 */
const getDashboardActivity = async ({ organizationId, limit = 10, page = 1 }) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

  // Fetch recent members, invitations, requests, and task activities in parallel
  const [recentMembers, recentInvitations, recentRequests, recentTaskActivities] = await Promise.all([
    OrganizationMember.find({ organizationId, status: 'active' })
      .sort({ joinedAt: -1, createdAt: -1 })
      .limit(parsedLimit)
      .populate('userId', 'firstName lastName email')
      .populate('roleId', 'name key'),
    OrganizationInvitation.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate('invitedBy', 'firstName lastName email'),
    WorkflowRequest.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate('requesterId', 'firstName lastName email')
      .populate('workflowId', 'name icon'),
    TaskActivity.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(parsedLimit),
  ]);

  const activities = [];

  // 1. Process recent member joins
  recentMembers.forEach((member) => {
    if (member.userId) {
      activities.push({
        id: `member-${member._id}`,
        type: 'member_joined',
        title: `${member.userId.firstName} ${member.userId.lastName} joined the workspace`,
        actor: {
          name: `${member.userId.firstName} ${member.userId.lastName}`,
          email: member.userId.email,
        },
        roleName: member.roleId?.name || member.role || 'Member',
        timestamp: member.joinedAt || member.createdAt,
      });
    }
  });

  // 2. Process invitations
  recentInvitations.forEach((inv) => {
    if (inv.status === 'accepted' && inv.acceptedAt) {
      activities.push({
        id: `inv-accepted-${inv._id}`,
        type: 'invitation_accepted',
        title: `${inv.email} accepted invitation`,
        actor: {
          name: inv.email,
          email: inv.email,
        },
        timestamp: inv.acceptedAt,
      });
    } else if (inv.status === 'pending') {
      const actorName = inv.invitedBy
        ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}`
        : 'Workspace Admin';
      activities.push({
        id: `inv-created-${inv._id}`,
        type: 'invitation_sent',
        title: `${actorName} invited ${inv.email}`,
        actor: {
          name: actorName,
          email: inv.invitedBy?.email || '',
        },
        timestamp: inv.createdAt,
      });
    }
  });

  // 3. Process requests
  recentRequests.forEach((req) => {
    const actorName = req.requesterId
      ? `${req.requesterId.firstName} ${req.requesterId.lastName}`
      : 'Employee';
    activities.push({
      id: `req-${req._id}`,
      type: 'request_created',
      title: `${actorName} submitted "${req.title}"`,
      actor: {
        name: actorName,
        email: req.requesterId?.email || '',
      },
      status: req.status,
      timestamp: req.createdAt,
    });
  });

  // 4. Process task actions & delegations
  recentTaskActivities.forEach((taskAct) => {
    activities.push({
      id: `task-${taskAct._id}`,
      type: `task_${taskAct.type}`,
      title: taskAct.details,
      actor: {
        name: taskAct.actorName,
        email: taskAct.actorEmail,
      },
      status: taskAct.type,
      timestamp: taskAct.createdAt,
    });
  });

  // Sort all activities descending by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = activities.length;
  const startIndex = (parsedPage - 1) * parsedLimit;
  const paginatedData = activities.slice(startIndex, startIndex + parsedLimit);

  return {
    data: paginatedData,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      hasMore: startIndex + parsedLimit < total,
    },
  };
};

module.exports = {
  getDashboardSummary,
  getDashboardActivity,
};
