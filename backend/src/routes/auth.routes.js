const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login route
router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  authController.adminLogin
);

// User login with access token
router.post(
  '/token/login',
  [
    body('token').notEmpty().withMessage('Access token is required'),
    validateRequest
  ],
  authController.tokenLogin
);

// Admin password update
router.put(
  '/admin/password',
  authenticateAdmin,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validateRequest
  ],
  authController.updateAdminPassword
);

// Admin email update
router.put(
  '/admin/email',
  authenticateAdmin,
  [
    body('password').notEmpty().withMessage('Password is required'),
    body('newEmail').isEmail().withMessage('Please enter a valid email'),
    validateRequest
  ],
  authController.updateAdminEmail
);

// Check admin authentication status
router.get('/admin/status', authenticateAdmin, authController.getAdminStatus);

module.exports = router; 