const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission, requireAnyPermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

router.get('/', requireAnyPermission(['requests.read', 'forms.read', 'workflows.read']), workflowController.getRequests);
router.get('/:requestId', requireAnyPermission(['requests.read', 'forms.read', 'workflows.read']), workflowController.getRequestById);
router.post('/:requestId/cancel', requirePermission('requests.cancel'), workflowController.cancelRequest);

module.exports = router;
