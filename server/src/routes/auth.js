const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public / auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected endpoints
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
