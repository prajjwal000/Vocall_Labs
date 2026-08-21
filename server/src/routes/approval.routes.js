const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

router.get('/', requirePermission('approvals.read'), workflowController.getApprovals);
router.post('/:approvalId/decide', workflowController.decideApproval);

module.exports = router;
