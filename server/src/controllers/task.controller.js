const taskService = require('../services/task.service');

/**
 * Creates and assigns a new task
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, assigneeId, priority, dueDate, sourceWorkflowId, sourceRequestId } = req.body;
    const organizationId = req.organization._id;

    const task = await taskService.createTask({
      organizationId,
      assignedBy: req.user._id,
      assigneeId,
      title,
      description,
      priority,
      dueDate,
      sourceWorkflowId,
      sourceRequestId,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Queries organization tasks with filters
 */
const getTasks = async (req, res, next) => {
  try {
    const { scope, status, priority, search, page, limit } = req.query;
    const organizationId = req.organization._id;

    const isOwner =
      req.membership.role === 'owner' ||
      (req.organization.ownerId && req.user._id.toString() === req.organization.ownerId.toString());

    const result = await taskService.getTasks({
      organizationId,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      scope,
      status,
      priority,
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
 * Gets single task details with full timeline and delegation chain
 */
const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const organizationId = req.organization._id;

    const result = await taskService.getTaskById({
      organizationId,
      taskId,
    });

    res.status(200).json({
      success: true,
      data: result.task,
      activities: result.activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks task as completed
 */
const completeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const organizationId = req.organization._id;

    const isOwner =
      req.membership.role === 'owner' ||
      (req.organization.ownerId && req.user._id.toString() === req.organization.ownerId.toString());

    const task = await taskService.completeTask({
      organizationId,
      taskId,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      user: req.user,
      notes,
    });

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delegates task to another employee
 */
const delegateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { toUserId, reason } = req.body;
    const organizationId = req.organization._id;

    const isOwner =
      req.membership.role === 'owner' ||
      (req.organization.ownerId && req.user._id.toString() === req.organization.ownerId.toString());

    const task = await taskService.delegateTask({
      organizationId,
      taskId,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      user: req.user,
      toUserId,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Task delegated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancels a task
 */
const cancelTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;
    const organizationId = req.organization._id;

    const isOwner =
      req.membership.role === 'owner' ||
      (req.organization.ownerId && req.user._id.toString() === req.organization.ownerId.toString());

    const task = await taskService.cancelTask({
      organizationId,
      taskId,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      user: req.user,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Task cancelled successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns eligible assignees / delegates
 */
const getEligibleAssignees = async (req, res, next) => {
  try {
    const organizationId = req.organization._id;
    const { taskId } = req.query;

    const users = await taskService.getEligibleAssignees({
      organizationId,
      taskId,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns dashboard task metrics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const organizationId = req.organization._id;

    const isOwner =
      req.membership.role === 'owner' ||
      (req.organization.ownerId && req.user._id.toString() === req.organization.ownerId.toString());

    const stats = await taskService.getTaskDashboardStats({
      organizationId,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  completeTask,
  delegateTask,
  cancelTask,
  getEligibleAssignees,
  getDashboardStats,
};
