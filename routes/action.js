const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');

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

// Perform single Facebook action
router.post('/perform', requireAuth, async (req, res) => {
  try {
    await actionController.performAction(req, res);
  } catch (error) {
    console.error('❌ Perform action route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Perform bulk Facebook actions
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    await actionController.performBulkActions(req, res);
  } catch (error) {
    console.error('❌ Bulk actions route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get action history
router.get('/history', requireAuth, async (req, res) => {
  try {
    await actionController.getActionHistory(req, res);
  } catch (error) {
    console.error('❌ Get action history route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate action parameters
router.post('/validate', requireAuth, (req, res) => {
  try {
    const { targetUrl, actionType, commentText } = req.body;
    const errors = actionController.validateActionParams(targetUrl, actionType, commentText);
    
    res.json({
      success: errors.length === 0,
      errors,
      isValid: errors.length === 0
    });
  } catch (error) {
    console.error('❌ Validate action route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available action types
router.get('/types', (req, res) => {
  try {
    const actionTypes = [
      {
        value: 'like',
        label: '👍 Like',
        description: 'Like a Facebook post',
        requiresComment: false
      },
      {
        value: 'love',
        label: '❤️ Love',
        description: 'React with love to a Facebook post',
        requiresComment: false
      },
      {
        value: 'haha',
        label: '😂 Haha',
        description: 'React with haha to a Facebook post',
        requiresComment: false
      },
      {
        value: 'wow',
        label: '😲 Wow',
        description: 'React with wow to a Facebook post',
        requiresComment: false
      },
      {
        value: 'sad',
        label: '😢 Sad',
        description: 'React with sad to a Facebook post',
        requiresComment: false
      },
      {
        value: 'angry',
        label: '😡 Angry',
        description: 'React with angry to a Facebook post',
        requiresComment: false
      },
      {
        value: 'follow',
        label: '✅ Follow',
        description: 'Follow a Facebook user',
        requiresComment: false
      },
      {
        value: 'comment',
        label: '💬 Comment',
        description: 'Comment on a Facebook post',
        requiresComment: true
      }
    ];

    res.json({
      success: true,
      actionTypes
    });
  } catch (error) {
    console.error('❌ Get action types route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check for action service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Action service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;