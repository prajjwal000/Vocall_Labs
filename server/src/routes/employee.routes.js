const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrganizationMembership);

router.get('/', requirePermission('employees.read'), employeeController.getEmployees);
router.get('/:employeeId', requirePermission('employees.read'), employeeController.getEmployeeById);
router.patch('/:employeeId', requirePermission('employees.update'), employeeController.updateEmployee);

module.exports = router;
