const express = require('express');
const { query } = require('express-validator');
const emailController = require('../controllers/email.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// User route - Get email by recipient
router.get(
  '/search',
  authenticateToken,
  [
    query('recipient').isEmail().withMessage('Please provide a valid email address'),
    validateRequest
  ],
  emailController.getEmailByRecipient
);

// Admin routes - require admin authentication
router.get('/stats', authenticateAdmin, emailController.getEmailStats);

router.get(
  '/list',
  authenticateAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest
  ],
  emailController.listEmails
);

module.exports = router; 