const express = require('express');
const { body, param } = require('express-validator');
const tokenController = require('../controllers/token.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all access tokens
router.get('/', tokenController.getAllTokens);

// Create a new access token
router.post(
  '/',
  [
    body('token')
      .optional()
      .isLength({ min: 10 })
      .withMessage('Token must be at least 10 characters long'),
    validateRequest
  ],
  tokenController.createToken
);

// Get token by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid token ID'),
    validateRequest
  ],
  tokenController.getTokenById
);

// Update token status (block/unblock)
router.put(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Invalid token ID'),
    body('status')
      .isIn(['active', 'blocked'])
      .withMessage('Status must be either active or blocked'),
    validateRequest
  ],
  tokenController.updateTokenStatus
);

// Delete token
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid token ID'),
    validateRequest
  ],
  tokenController.deleteToken
);

module.exports = router; 