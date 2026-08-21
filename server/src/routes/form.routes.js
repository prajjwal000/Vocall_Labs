const express = require('express');
const router = express.Router({ mergeParams: true });
const formController = require('../controllers/form.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

router.use(authenticate);
router.use(requireOrganizationMembership);

// List Forms
router.get('/', requirePermission('forms.read'), formController.getForms);

// Create Form & v1 Version
router.post('/', requirePermission('forms.create'), formController.createForm);

// Compare Form Versions
router.get('/:formId/compare', requirePermission('forms.read'), formController.compareFormVersions);

// Get All Form Versions (History)
router.get('/:formId/versions', requirePermission('forms.read'), formController.getFormVersions);

// Fork New Draft Version
router.post('/:formId/fork', requirePermission('forms.create'), formController.createFormDraft);

// Update Draft Version (Protected by backend immutability guard)
router.patch('/:formId/versions/:versionId', requirePermission('forms.update'), formController.updateFormDraft);

// Publish Draft Version
router.post('/:formId/versions/:versionId/publish', requirePermission('forms.update'), formController.publishFormVersion);

// Discard Draft Version
router.delete('/:formId/versions/:versionId', requirePermission('forms.delete'), formController.discardFormDraft);

// Get Single Form with active or requested version
router.get('/:formId', requirePermission('forms.read'), formController.getFormById);

module.exports = router;
