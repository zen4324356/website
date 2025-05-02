const express = require('express');
const { body } = require('express-validator');
const oauthController = require('../controllers/oauth.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get OAuth credentials
router.get('/credentials', oauthController.getOAuthCredentials);

// Save OAuth credentials
router.post(
  '/credentials',
  [
    body('client_id').notEmpty().withMessage('Client ID is required'),
    body('client_secret').notEmpty().withMessage('Client Secret is required'),
    body('redirect_uri').notEmpty().withMessage('Redirect URI is required'),
    validateRequest
  ],
  oauthController.saveOAuthCredentials
);

// Generate OAuth URL
router.get('/url', oauthController.generateOAuthUrl);

// OAuth callback
router.get('/callback', oauthController.handleOAuthCallback);

// Delete OAuth credentials
router.delete('/credentials', oauthController.deleteOAuthCredentials);

// Refresh OAuth token
router.post('/refresh', oauthController.refreshOAuthToken);

module.exports = router; 