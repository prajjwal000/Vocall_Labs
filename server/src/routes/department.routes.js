const express = require('express');
const departmentController = require('../controllers/department.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

// Department Tree & Organization Hierarchy
router.get('/tree', requirePermission('departments.read'), departmentController.getDepartmentTree);

// Standard Department CRUD
router.get('/', requirePermission('departments.read'), departmentController.getDepartments);
router.post('/', requirePermission('departments.create'), departmentController.createDepartment);
router.get('/:departmentId', requirePermission('departments.read'), departmentController.getDepartmentById);
router.patch('/:departmentId', requirePermission('departments.update'), departmentController.updateDepartment);
router.delete('/:departmentId', requirePermission('departments.delete'), departmentController.deleteDepartment);

// Department Membership Management
router.post('/:departmentId/members', requirePermission('departments.update'), departmentController.assignMembers);
router.delete('/:departmentId/members/:memberId', requirePermission('departments.update'), departmentController.removeMember);

module.exports = router;
