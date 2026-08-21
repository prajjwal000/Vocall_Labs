const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

// Role CRUD endpoints
router.get('/', requirePermission('roles.read'), roleController.getOrganizationRoles);
router.post('/', requirePermission('roles.create'), roleController.createRole);
router.get('/:roleId', requirePermission('roles.read'), roleController.getRoleById);
router.patch('/:roleId', requirePermission('roles.update'), roleController.updateRole);
router.delete('/:roleId', requirePermission('roles.delete'), roleController.deleteRole);

module.exports = router;
