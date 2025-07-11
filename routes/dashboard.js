const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Render dashboard page
router.get('/', requireAuth, async (req, res) => {
  try {
    await dashboardController.renderDashboard(req, res);
  } catch (error) {
    console.error('❌ Dashboard route error:', error);
    res.status(500).render('error', {
      message: 'Failed to load dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Get dashboard data (API endpoint)
router.get('/data', requireAuth, async (req, res) => {
  try {
    await dashboardController.getDashboardData(req, res);
  } catch (error) {
    console.error('❌ Get dashboard data route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active users (admin function)
router.get('/users', requireAuth, async (req, res) => {
  try {
    await dashboardController.getActiveUsers(req, res);
  } catch (error) {
    console.error('❌ Get active users route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    await dashboardController.updatePreferences(req, res);
  } catch (error) {
    console.error('❌ Update preferences route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get system statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    await dashboardController.getSystemStats(req, res);
  } catch (error) {
    console.error('❌ Get system stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh user session
router.post('/refresh-session', requireAuth, async (req, res) => {
  try {
    await dashboardController.refreshSession(req, res);
  } catch (error) {
    console.error('❌ Refresh session route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user account
router.delete('/account', requireAuth, async (req, res) => {
  try {
    await dashboardController.deleteAccount(req, res);
  } catch (error) {
    console.error('❌ Delete account route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check for dashboard service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;