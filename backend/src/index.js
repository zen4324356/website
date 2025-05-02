require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const emailRoutes = require('./routes/email.routes');
const tokenRoutes = require('./routes/token.routes');
const oauthRoutes = require('./routes/oauth.routes');
const settingsRoutes = require('./routes/settings.routes');

// Import services
const { syncEmails } = require('./services/gmail.service');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Admin-User Dashboard API is running' });
});

// Schedule Gmail sync every 3 seconds
cron.schedule('*/3 * * * * *', async () => {
  try {
    await syncEmails();
  } catch (error) {
    console.error('Error syncing emails:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 