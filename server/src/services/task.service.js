const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const { sendTaskNotificationEmail } = require('./emailService');

const MAX_DELEGATION_DEPTH = 10;

/**
 * Creates and assigns a new task
 */
const createTask = async ({
  organizationId,
  assignedBy,
  assigneeId,
  title,
  description = '',
  priority = 'medium',
  dueDate = null,
  sourceWorkflowId = null,
  sourceRequestId = null,
  user,
}) => {
  if (!title || !title.trim()) {
    const error = new Error('Task title is required');
    error.statusCode = 400;
    error.code = 'MISSING_TITLE';
    throw error;
  }

  if (!assigneeId) {
    const error = new Error('Assignee is required');
    error.statusCode = 400;
    error.code = 'MISSING_ASSIGNEE';
    throw error;
  }

  // Validate assignee is active member in the same organization
  const membership = await OrganizationMember.findOne({
    organizationId,
    userId: assigneeId,
    status: 'active',
  }).populate('userId', 'firstName lastName email');

  if (!membership || !membership.userId) {
    const error = new Error('Selected employee is not an active member of this organization');
    error.statusCode = 400;
    error.code = 'INVALID_ASSIGNEE';
    throw error;
  }

  const assigneeUser = membership.userId;

  const task = await Task.create({
    organizationId,
    title: title.trim(),
    description: (description || '').trim(),
    assignedBy,
    originalAssignee: assigneeId,
    currentAssignee: assigneeId,
    status: 'pending',
    priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    delegationDepth: 0,
    delegationHistory: [],
    sourceWorkflowId,
    sourceRequestId,
  });

  // Log Activity Event
  await TaskActivity.create({
    taskId: task._id,
    organizationId,
    type: 'created',
    actorId: assignedBy,
    actorName: `${user.firstName} ${user.lastName}`,
    actorEmail: user.email,
    details: `${user.firstName} assigned task to ${assigneeUser.firstName} ${assigneeUser.lastName}`,
    metadata: {
      assignedToId: assigneeId,
      assignedToName: `${assigneeUser.firstName} ${assigneeUser.lastName}`,
      priority: task.priority,
      dueDate: task.dueDate,
    },
  });

  // Asynchronous Notification
  sendTaskNotificationEmail({
    to: assigneeUser.email,
    recipientName: `${assigneeUser.firstName} ${assigneeUser.lastName}`,
    taskTitle: task.title,
    type: 'assigned',
    actorName: `${user.firstName} ${user.lastName}`,
  }).catch((err) => console.error('[TASK NOTIF ERROR]', err.message));

  // Populate references for immediate response
  return await Task.findById(task._id)
    .populate('assignedBy', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email')
    .populate('currentAssignee', 'firstName lastName email');
};

/**
 * Lists tasks scoped by organization and user role/filter
 */
const getTasks = async ({
  organizationId,
  userId,
  userRole,
  isOwner,
  scope = 'my',
  status,
  priority,
  search = '',
  page = 1,
  limit = 20,
}) => {
  const query = { organizationId };

  // Filter based on scope
  if (scope === 'my') {
    query.currentAssignee = userId;
  } else if (scope === 'assigned_by_me') {
    query.assignedBy = userId;
  } else if (scope === 'delegated') {
    query.$or = [
      { 'delegationHistory.from': userId },
      { 'delegationHistory.to': userId },
      { originalAssignee: userId, currentAssignee: { $ne: userId } },
    ];
  } else if (scope === 'all') {
    // If not admin or owner, limit 'all' to tasks involving the user
    if (!isOwner && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager') {
      query.$or = [
        { currentAssignee: userId },
        { assignedBy: userId },
        { 'delegationHistory.from': userId },
        { 'delegationHistory.to': userId },
      ];
    }
  }

  if (status && ['pending', 'in_progress', 'completed', 'cancelled', 'delegated'].includes(status)) {
    query.status = status;
  }

  if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
    query.priority = priority;
  }

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: [{ title: searchRegex }, { description: searchRegex }] }];
      delete query.$or;
    } else {
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('assignedBy', 'firstName lastName email')
      .populate('originalAssignee', 'firstName lastName email')
      .populate('currentAssignee', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email'),
    Task.countDocuments(query),
  ]);

  return {
    data: tasks,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Gets detailed task record with full delegation chain and activity timeline
 */
const getTaskById = async ({ organizationId, taskId }) => {
  const task = await Task.findOne({ _id: taskId, organizationId })
    .populate('assignedBy', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email')
    .populate('currentAssignee', 'firstName lastName email')
    .populate('completedBy', 'firstName lastName email')
    .populate('cancelledBy', 'firstName lastName email')
    .populate('delegationHistory.from', 'firstName lastName email')
    .populate('delegationHistory.to', 'firstName lastName email')
    .populate('delegationHistory.delegatedBy', 'firstName lastName email');

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }

  const activities = await TaskActivity.find({ taskId, organizationId }).sort({ createdAt: 1 });

  return {
    task,
    activities,
  };
};

/**
 * Completes a task
 */
const completeTask = async ({ organizationId, taskId, userId, userRole, isOwner, user, notes = '' }) => {
  const task = await Task.findOne({ _id: taskId, organizationId })
    .populate('currentAssignee', 'firstName lastName email')
    .populate('assignedBy', 'firstName lastName email');

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }

  if (task.status === 'completed') {
    const error = new Error('Task is already completed');
    error.statusCode = 400;
    error.code = 'ALREADY_COMPLETED';
    throw error;
  }

  if (task.status === 'cancelled') {
    const error = new Error('Cannot complete a cancelled task');
    error.statusCode = 400;
    error.code = 'TASK_CANCELLED';
    throw error;
  }

  // Verification: only currentAssignee (or admin/owner/manager override) can complete
  const isCurrentOwner = task.currentAssignee._id.toString() === userId.toString();
  const canOverride = isOwner || userRole === 'owner' || userRole === 'admin' || userRole === 'manager';

  if (!isCurrentOwner && !canOverride) {
    const currentOwnerName = `${task.currentAssignee.firstName} ${task.currentAssignee.lastName}`;
    const error = new Error(`Only the current assignee (${currentOwnerName}) can complete this task.`);
    error.statusCode = 403;
    error.code = 'FORBIDDEN_COMPLETION';
    throw error;
  }

  task.status = 'completed';
  task.completedAt = new Date();
  task.completedBy = userId;
  task.completionNotes = (notes || '').trim();
  await task.save();

  // Log Activity
  await TaskActivity.create({
    taskId: task._id,
    organizationId,
    type: 'completed',
    actorId: userId,
    actorName: `${user.firstName} ${user.lastName}`,
    actorEmail: user.email,
    details: `${user.firstName} marked task as completed${notes ? ` ("${notes}")` : ''}`,
    metadata: {
      completionNotes: notes,
      completedAt: task.completedAt,
    },
  });

  // Notify original assigner
  if (task.assignedBy && task.assignedBy.email) {
    sendTaskNotificationEmail({
      to: task.assignedBy.email,
      recipientName: `${task.assignedBy.firstName} ${task.assignedBy.lastName}`,
      taskTitle: task.title,
      type: 'completed',
      actorName: `${user.firstName} ${user.lastName}`,
    }).catch((err) => console.error('[TASK NOTIF ERROR]', err.message));
  }

  return await Task.findById(task._id)
    .populate('assignedBy', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email')
    .populate('currentAssignee', 'firstName lastName email')
    .populate('completedBy', 'firstName lastName email');
};

/**
 * Delegates a task from current assignee to another eligible employee
 */
const delegateTask = async ({ organizationId, taskId, userId, userRole, isOwner, user, toUserId, reason = '' }) => {
  if (!toUserId) {
    const error = new Error('Target delegate employee is required');
    error.statusCode = 400;
    error.code = 'MISSING_DELEGATE';
    throw error;
  }

  if (!reason || !reason.trim()) {
    const error = new Error('Delegation reason is required');
    error.statusCode = 400;
    error.code = 'MISSING_REASON';
    throw error;
  }

  const task = await Task.findOne({ _id: taskId, organizationId })
    .populate('currentAssignee', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email');

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }

  if (task.status === 'completed') {
    const error = new Error('Cannot delegate a completed task');
    error.statusCode = 400;
    error.code = 'ALREADY_COMPLETED';
    throw error;
  }

  if (task.status === 'cancelled') {
    const error = new Error('Cannot delegate a cancelled task');
    error.statusCode = 400;
    error.code = 'TASK_CANCELLED';
    throw error;
  }

  // Verification: only currentAssignee (or admin/owner/manager override) can delegate
  const isCurrentOwner = task.currentAssignee._id.toString() === userId.toString();
  const canOverride = isOwner || userRole === 'owner' || userRole === 'admin' || userRole === 'manager';

  if (!isCurrentOwner && !canOverride) {
    const currentOwnerName = `${task.currentAssignee.firstName} ${task.currentAssignee.lastName}`;
    const error = new Error(`Only the current assignee (${currentOwnerName}) can delegate this task.`);
    error.statusCode = 403;
    error.code = 'FORBIDDEN_DELEGATION';
    throw error;
  }

  // Cannot delegate to current assignee
  if (task.currentAssignee._id.toString() === toUserId.toString()) {
    const error = new Error('Cannot delegate task to the current assignee');
    error.statusCode = 400;
    error.code = 'SELF_DELEGATION';
    throw error;
  }

  // Maximum Delegation Depth Check
  if ((task.delegationDepth || 0) >= MAX_DELEGATION_DEPTH) {
    const error = new Error(`Maximum delegation depth (${MAX_DELEGATION_DEPTH}) reached. Cannot delegate further.`);
    error.statusCode = 400;
    error.code = 'MAX_DELEGATION_DEPTH_REACHED';
    throw error;
  }

  // Validate Target Employee is an active member in organization
  const targetMember = await OrganizationMember.findOne({
    organizationId,
    userId: toUserId,
    status: 'active',
  }).populate('userId', 'firstName lastName email');

  if (!targetMember || !targetMember.userId) {
    const error = new Error('Selected delegate is not an active employee of this organization');
    error.statusCode = 400;
    error.code = 'INVALID_DELEGATE';
    throw error;
  }

  const targetUser = targetMember.userId;

  // Cycle & Loop Detection: Ensure toUserId hasn't already received or initiated this task in this chain
  const previousAssigneeIds = [
    task.originalAssignee._id.toString(),
    ...task.delegationHistory.map((d) => d.from.toString()),
    ...task.delegationHistory.map((d) => d.to.toString()),
  ];

  if (previousAssigneeIds.includes(toUserId.toString())) {
    const error = new Error(
      `Delegation loop detected: ${targetUser.firstName} ${targetUser.lastName} has already handled this task in the delegation chain.`
    );
    error.statusCode = 400;
    error.code = 'DELEGATION_LOOP_DETECTED';
    throw error;
  }

  const fromUserId = task.currentAssignee._id;
  const fromUserName = `${task.currentAssignee.firstName} ${task.currentAssignee.lastName}`;

  // Record Delegation History
  task.delegationHistory.push({
    from: fromUserId,
    to: toUserId,
    delegatedBy: userId,
    delegatedAt: new Date(),
    reason: reason.trim(),
  });

  task.currentAssignee = toUserId;
  task.delegationDepth = (task.delegationDepth || 0) + 1;
  task.status = 'in_progress';
  await task.save();

  // Log Activity
  await TaskActivity.create({
    taskId: task._id,
    organizationId,
    type: 'delegated',
    actorId: userId,
    actorName: `${user.firstName} ${user.lastName}`,
    actorEmail: user.email,
    details: `${fromUserName} delegated task to ${targetUser.firstName} ${targetUser.lastName} (Reason: "${reason.trim()}")`,
    metadata: {
      fromId: fromUserId,
      fromName: fromUserName,
      toId: toUserId,
      toName: `${targetUser.firstName} ${targetUser.lastName}`,
      reason: reason.trim(),
      delegationDepth: task.delegationDepth,
    },
  });

  // Notify newly delegated employee
  sendTaskNotificationEmail({
    to: targetUser.email,
    recipientName: `${targetUser.firstName} ${targetUser.lastName}`,
    taskTitle: task.title,
    type: 'delegated',
    actorName: `${user.firstName} ${user.lastName}`,
    reason: reason.trim(),
  }).catch((err) => console.error('[TASK NOTIF ERROR]', err.message));

  return await Task.findById(task._id)
    .populate('assignedBy', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email')
    .populate('currentAssignee', 'firstName lastName email')
    .populate('delegationHistory.from', 'firstName lastName email')
    .populate('delegationHistory.to', 'firstName lastName email')
    .populate('delegationHistory.delegatedBy', 'firstName lastName email');
};

/**
 * Cancels a task
 */
const cancelTask = async ({ organizationId, taskId, userId, userRole, isOwner, user, reason = '' }) => {
  const task = await Task.findOne({ _id: taskId, organizationId }).populate('currentAssignee', 'firstName lastName email');

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }

  if (task.status === 'completed') {
    const error = new Error('Cannot cancel a completed task');
    error.statusCode = 400;
    error.code = 'ALREADY_COMPLETED';
    throw error;
  }

  if (task.status === 'cancelled') {
    const error = new Error('Task is already cancelled');
    error.statusCode = 400;
    error.code = 'ALREADY_CANCELLED';
    throw error;
  }

  // Authorization: Assigner or admin/owner/manager
  const isAssigner = task.assignedBy.toString() === userId.toString();
  const canOverride = isOwner || userRole === 'owner' || userRole === 'admin' || userRole === 'manager';

  if (!isAssigner && !canOverride) {
    const error = new Error('Only the task creator or an administrator can cancel this task');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_CANCELLATION';
    throw error;
  }

  task.status = 'cancelled';
  task.cancelledAt = new Date();
  task.cancelledBy = userId;
  task.cancellationReason = (reason || '').trim();
  await task.save();

  // Log Activity
  await TaskActivity.create({
    taskId: task._id,
    organizationId,
    type: 'cancelled',
    actorId: userId,
    actorName: `${user.firstName} ${user.lastName}`,
    actorEmail: user.email,
    details: `${user.firstName} cancelled task${reason ? ` (Reason: "${reason}")` : ''}`,
    metadata: {
      cancellationReason: reason,
      cancelledAt: task.cancelledAt,
    },
  });

  // Notify current assignee
  if (task.currentAssignee && task.currentAssignee.email) {
    sendTaskNotificationEmail({
      to: task.currentAssignee.email,
      recipientName: `${task.currentAssignee.firstName} ${task.currentAssignee.lastName}`,
      taskTitle: task.title,
      type: 'cancelled',
      actorName: `${user.firstName} ${user.lastName}`,
      reason: reason.trim(),
    }).catch((err) => console.error('[TASK NOTIF ERROR]', err.message));
  }

  return await Task.findById(task._id)
    .populate('assignedBy', 'firstName lastName email')
    .populate('originalAssignee', 'firstName lastName email')
    .populate('currentAssignee', 'firstName lastName email')
    .populate('cancelledBy', 'firstName lastName email');
};

/**
 * Gets eligible employees in organization for assignment or delegation
 */
const getEligibleAssignees = async ({ organizationId, taskId = null }) => {
  const members = await OrganizationMember.find({
    organizationId,
    status: 'active',
  }).populate('userId', 'firstName lastName email');

  let activeUsers = members
    .filter((m) => m.userId)
    .map((m) => ({
      userId: m.userId._id,
      firstName: m.userId.firstName,
      lastName: m.userId.lastName,
      email: m.userId.email,
      role: m.role,
    }));

  // If taskId provided, exclude users already involved to prevent delegation cycles
  if (taskId) {
    const task = await Task.findOne({ _id: taskId, organizationId });
    if (task) {
      const excludedIds = new Set([
        task.currentAssignee.toString(),
        task.originalAssignee.toString(),
        ...task.delegationHistory.map((d) => d.from.toString()),
        ...task.delegationHistory.map((d) => d.to.toString()),
      ]);

      activeUsers = activeUsers.filter((u) => !excludedIds.has(u.userId.toString()));
    }
  }

  return activeUsers;
};

/**
 * Returns task aggregate statistics for dashboards
 */
const getTaskDashboardStats = async ({ organizationId, userId, userRole, isOwner }) => {
  const [
    myPending,
    myInProgress,
    myCompleted,
    assignedPending,
    assignedInProgress,
    assignedCompleted,
    totalDelegated,
    allPending,
    allInProgress,
    allCompleted,
  ] = await Promise.all([
    Task.countDocuments({ organizationId, currentAssignee: userId, status: 'pending' }),
    Task.countDocuments({ organizationId, currentAssignee: userId, status: 'in_progress' }),
    Task.countDocuments({ organizationId, currentAssignee: userId, status: 'completed' }),
    Task.countDocuments({ organizationId, assignedBy: userId, status: 'pending' }),
    Task.countDocuments({ organizationId, assignedBy: userId, status: 'in_progress' }),
    Task.countDocuments({ organizationId, assignedBy: userId, status: 'completed' }),
    Task.countDocuments({
      organizationId,
      delegationDepth: { $gt: 0 },
      $or: [
        { 'delegationHistory.from': userId },
        { 'delegationHistory.to': userId },
        { originalAssignee: userId, currentAssignee: { $ne: userId } },
      ],
    }),
    Task.countDocuments({ organizationId, status: 'pending' }),
    Task.countDocuments({ organizationId, status: 'in_progress' }),
    Task.countDocuments({ organizationId, status: 'completed' }),
  ]);

  return {
    myTasks: {
      pending: myPending,
      inProgress: myInProgress,
      completed: myCompleted,
      total: myPending + myInProgress + myCompleted,
    },
    assignedTasks: {
      pending: assignedPending,
      inProgress: assignedInProgress,
      completed: assignedCompleted,
      total: assignedPending + assignedInProgress + assignedCompleted,
    },
    allTasks: {
      pending: allPending,
      inProgress: allInProgress,
      completed: allCompleted,
      total: allPending + allInProgress + allCompleted,
    },
    totalDelegated,
  };
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  completeTask,
  delegateTask,
  cancelTask,
  getEligibleAssignees,
  getTaskDashboardStats,
  MAX_DELEGATION_DEPTH,
};
