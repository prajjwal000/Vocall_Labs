const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

// Enforce authentication & organization membership across all task endpoints
router.use(authenticate);
router.use(requireOrganizationMembership);

// Task Dashboard Stats
router.get('/dashboard-stats', taskController.getDashboardStats);

// Eligible Assignees & Delegates
router.get('/eligible-assignees', taskController.getEligibleAssignees);

// List Tasks
router.get('/', requirePermission('tasks.read'), taskController.getTasks);

// Create / Assign Task
router.post('/', requirePermission('tasks.create'), taskController.createTask);

// Single Task Details
router.get('/:taskId', requirePermission('tasks.read'), taskController.getTaskById);

// Complete Task
router.post('/:taskId/complete', requirePermission('tasks.complete'), taskController.completeTask);

// Delegate Task
router.post('/:taskId/delegate', requirePermission('tasks.delegate'), taskController.delegateTask);

// Cancel Task
router.post('/:taskId/cancel', requirePermission('tasks.cancel'), taskController.cancelTask);

module.exports = router;
