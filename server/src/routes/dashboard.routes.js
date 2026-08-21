const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');

const router = express.Router();

router.use(authenticate);
router.use(requireOrganizationMembership);

router.get('/summary', dashboardController.getSummary);
router.get('/activity', dashboardController.getActivity);

module.exports = router;
