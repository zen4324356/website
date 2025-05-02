const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get admin dashboard summary
router.get('/dashboard', adminController.getDashboardSummary);

// Get admin logs
router.get('/logs', adminController.getAdminLogs);

// Get admin account info
router.get('/account', adminController.getAdminAccount);

// Add an admin log
router.post(
  '/logs',
  [
    body('action').notEmpty().withMessage('Action is required'),
    body('details').optional(),
    validateRequest
  ],
  adminController.addAdminLog
);

module.exports = router; 