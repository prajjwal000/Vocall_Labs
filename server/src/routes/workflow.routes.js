const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission, requireAnyPermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

// AI Generation
router.post('/generate-ai', requireAnyPermission(['workflows.create', 'forms.create']), workflowController.generateAiWorkflow);

// Workflow Definitions & Versioning
router.get('/', requireAnyPermission(['workflows.read', 'forms.read']), workflowController.getWorkflows);
router.post('/', requireAnyPermission(['workflows.create', 'forms.create']), workflowController.createWorkflow);

// Compare Workflow Versions
router.get('/:workflowId/compare', requireAnyPermission(['workflows.read', 'forms.read']), workflowController.compareWorkflowVersions);

// Get All Workflow Versions (History)
router.get('/:workflowId/versions', requireAnyPermission(['workflows.read', 'forms.read']), workflowController.getWorkflowVersions);

// Fork New Draft Version
router.post('/:workflowId/fork', requireAnyPermission(['workflows.create', 'forms.create']), workflowController.createWorkflowDraft);

// Update Draft Version (Protected by backend immutability guard)
router.patch('/:workflowId/versions/:versionId', requireAnyPermission(['workflows.update', 'forms.update']), workflowController.updateWorkflowDraft);

// Publish Draft Version
router.post('/:workflowId/versions/:versionId/publish', requireAnyPermission(['workflows.update', 'forms.update']), workflowController.publishWorkflowVersion);

// Discard Draft Version
router.delete('/:workflowId/versions/:versionId', requireAnyPermission(['workflows.delete', 'forms.delete']), workflowController.discardWorkflowDraft);

// Single Workflow (with active or requested version)
router.get('/:workflowId', requireAnyPermission(['workflows.read', 'forms.read']), workflowController.getWorkflowById);
router.patch('/:workflowId', requireAnyPermission(['workflows.update', 'forms.update']), workflowController.updateWorkflow);
router.delete('/:workflowId', requireAnyPermission(['workflows.delete', 'forms.delete']), workflowController.deleteWorkflow);

// Submissions & Requests
router.post('/:workflowId/submit', requireAnyPermission(['requests.create', 'forms.read', 'forms.create', 'workflows.read']), workflowController.submitRequest);

module.exports = router;
