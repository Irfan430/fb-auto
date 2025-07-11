const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

// Render login page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { 
    pageTitle: 'Login - Facebook Auto Actions',
    error: null 
  });
});

// Render register page
router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register', { 
    pageTitle: 'Register - Facebook Auto Actions',
    error: null 
  });
});

// Login with Facebook ID and password
router.post('/login/credentials', async (req, res) => {
  try {
    await authController.loginWithCredentials(req, res);
  } catch (error) {
    console.error('❌ Login route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login with cookie string
router.post('/login/cookies', async (req, res) => {
  try {
    await authController.loginWithCookies(req, res);
  } catch (error) {
    console.error('❌ Cookie login route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    await authController.register(req, res);
  } catch (error) {
    console.error('❌ Register route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await authController.logout(req, res);
  } catch (error) {
    console.error('❌ Logout route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    await authController.getCurrentUser(req, res);
  } catch (error) {
    console.error('❌ Get current user route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cleanup expired sessions (admin function)
router.post('/cleanup-sessions', requireAuth, async (req, res) => {
  try {
    await authController.cleanupExpiredSessions(req, res);
  } catch (error) {
    console.error('❌ Cleanup sessions route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check for authentication service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;