const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public catalog with authentication
router.use(authenticate);
router.get('/', roleController.getPermissionsCatalog);

module.exports = router;
