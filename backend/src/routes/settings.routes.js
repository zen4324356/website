const express = require('express');
const { body } = require('express-validator');
const settingsController = require('../controllers/settings.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticateAdmin, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public route to get site settings
router.get('/public', settingsController.getPublicSettings);

// Routes below require authentication
// Get all settings (admin only)
router.get('/', authenticateAdmin, settingsController.getAllSettings);

// Update website name
router.put(
  '/name',
  authenticateAdmin,
  [
    body('website_name').notEmpty().withMessage('Website name is required'),
    validateRequest
  ],
  settingsController.updateWebsiteName
);

// Update logo URL
router.put(
  '/logo',
  authenticateAdmin,
  [
    body('logo_url').notEmpty().withMessage('Logo URL is required'),
    validateRequest
  ],
  settingsController.updateLogoUrl
);

// Update video URL
router.put(
  '/video',
  authenticateAdmin,
  [
    body('video_url').notEmpty().withMessage('Video URL is required'),
    validateRequest
  ],
  settingsController.updateVideoUrl
);

// Update Supabase configuration
router.put(
  '/supabase',
  authenticateAdmin,
  [
    body('project_url').notEmpty().withMessage('Supabase project URL is required'),
    body('anon_key').notEmpty().withMessage('Supabase anon key is required'),
    body('service_key').optional(),
    validateRequest
  ],
  settingsController.updateSupabaseConfig
);

module.exports = router; 