const User = require('../models/User');
const fbService = require('../services/fbService');
const moment = require('moment');

class ActionController {
  // Perform Facebook action
  async performAction(req, res) {
    try {
      const { targetUrl, actionType, commentText } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!targetUrl || !actionType) {
        return res.status(400).json({
          success: false,
          message: 'Target URL and action type are required'
        });
      }

      // Validate action type
      const validActions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'follow', 'comment'];
      if (!validActions.includes(actionType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action type'
        });
      }

      // Validate URL
      try {
        await fbService.validateUrl(targetUrl);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Facebook URL'
        });
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user can perform actions
      if (!user.canPerformAction()) {
        return res.status(403).json({
          success: false,
          message: 'Session expired or user not active'
        });
      }

      // Login with user's cookies
      const cookies = user.getDecryptedCookies();
      if (!cookies) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session cookies'
        });
      }

      await fbService.loginWithCookies(cookies);

      let result = false;
      let actionPerformed = actionType;

      // Perform the action
      switch (actionType) {
        case 'like':
          result = await fbService.likePost(targetUrl);
          break;

        case 'love':
        case 'haha':
        case 'wow':
        case 'sad':
        case 'angry':
          result = await fbService.reactToPost(targetUrl, actionType);
          break;

        case 'comment':
          if (!commentText || commentText.trim().length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Comment text is required for comment action'
            });
          }
          result = await fbService.commentOnPost(targetUrl, commentText);
          break;

        case 'follow':
          const userIdFromUrl = await fbService.extractUserIdFromUrl(targetUrl);
          if (!userIdFromUrl) {
            return res.status(400).json({
              success: false,
              message: 'Could not extract user ID from URL'
            });
          }
          result = await fbService.followUser(userIdFromUrl);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported action type'
          });
      }

      if (result) {
        // Update user statistics
        user.updateStats(actionType === 'comment' ? 'comment' : 
                        actionType === 'follow' ? 'follow' : 
                        actionType === 'like' ? 'like' : 'reaction');

        await user.save();

        // Log the action
        this.logAction(user, actionType, targetUrl, commentText);

        res.json({
          success: true,
          message: `${actionType} action performed successfully`,
          action: {
            type: actionType,
            target: targetUrl,
            timestamp: new Date(),
            comment: commentText || null
          },
          user: {
            facebookId: user.maskedFacebookId,
            stats: user.stats
          }
        });
      } else {
        throw new Error(`Failed to perform ${actionType} action`);
      }

    } catch (error) {
      console.error('❌ Action performance error:', error);
      
      let message = 'Failed to perform action';
      if (error.message.includes('Login failed')) {
        message = 'Session expired. Please login again.';
      } else if (error.message.includes('not found')) {
        message = 'Target element not found. The post or user might not be accessible.';
      } else if (error.message.includes('timeout')) {
        message = 'Action timed out. Please try again.';
      }

      res.status(500).json({
        success: false,
        message
      });
    }
  }

  // Bulk actions
  async performBulkActions(req, res) {
    try {
      const { actions } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Actions array is required'
        });
      }

      // Limit bulk actions
      if (actions.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 actions allowed per bulk request'
        });
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user can perform actions
      if (!user.canPerformAction()) {
        return res.status(403).json({
          success: false,
          message: 'Session expired or user not active'
        });
      }

      // Login with user's cookies
      const cookies = user.getDecryptedCookies();
      if (!cookies) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session cookies'
        });
      }

      await fbService.loginWithCookies(cookies);

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      // Process each action
      for (const action of actions) {
        try {
          const { targetUrl, actionType, commentText } = action;

          if (!targetUrl || !actionType) {
            results.push({
              targetUrl,
              actionType,
              success: false,
              message: 'Missing target URL or action type'
            });
            failureCount++;
            continue;
          }

          // Validate action type
          const validActions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'follow', 'comment'];
          if (!validActions.includes(actionType)) {
            results.push({
              targetUrl,
              actionType,
              success: false,
              message: 'Invalid action type'
            });
            failureCount++;
            continue;
          }

          let result = false;

          // Perform the action
          switch (actionType) {
            case 'like':
              result = await fbService.likePost(targetUrl);
              break;

            case 'love':
            case 'haha':
            case 'wow':
            case 'sad':
            case 'angry':
              result = await fbService.reactToPost(targetUrl, actionType);
              break;

            case 'comment':
              if (!commentText || commentText.trim().length === 0) {
                results.push({
                  targetUrl,
                  actionType,
                  success: false,
                  message: 'Comment text is required for comment action'
                });
                failureCount++;
                continue;
              }
              result = await fbService.commentOnPost(targetUrl, commentText);
              break;

            case 'follow':
              const userIdFromUrl = await fbService.extractUserIdFromUrl(targetUrl);
              if (!userIdFromUrl) {
                results.push({
                  targetUrl,
                  actionType,
                  success: false,
                  message: 'Could not extract user ID from URL'
                });
                failureCount++;
                continue;
              }
              result = await fbService.followUser(userIdFromUrl);
              break;
          }

          if (result) {
            // Update user statistics
            user.updateStats(actionType === 'comment' ? 'comment' : 
                            actionType === 'follow' ? 'follow' : 
                            actionType === 'like' ? 'like' : 'reaction');

            // Log the action
            this.logAction(user, actionType, targetUrl, commentText);

            results.push({
              targetUrl,
              actionType,
              success: true,
              message: `${actionType} action performed successfully`,
              comment: commentText || null
            });
            successCount++;
          } else {
            results.push({
              targetUrl,
              actionType,
              success: false,
              message: `Failed to perform ${actionType} action`
            });
            failureCount++;
          }

          // Add delay between actions
          await new Promise(resolve => setTimeout(resolve, user.preferences.actionDelay || 5000));

        } catch (error) {
          console.error('❌ Bulk action error:', error);
          results.push({
            targetUrl: action.targetUrl,
            actionType: action.actionType,
            success: false,
            message: error.message || 'Action failed'
          });
          failureCount++;
        }
      }

      // Save user with updated stats
      await user.save();

      res.json({
        success: true,
        message: `Bulk actions completed. ${successCount} successful, ${failureCount} failed.`,
        summary: {
          total: actions.length,
          successful: successCount,
          failed: failureCount
        },
        results,
        user: {
          facebookId: user.maskedFacebookId,
          stats: user.stats
        }
      });

    } catch (error) {
      console.error('❌ Bulk actions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk actions'
      });
    }
  }

  // Get action history
  async getActionHistory(req, res) {
    try {
      const userId = req.session.userId;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // In a real application, you'd have a separate Action model
      // For now, we'll return basic stats
      res.json({
        success: true,
        history: {
          totalActions: user.stats.totalActions,
          likes: user.stats.likes,
          comments: user.stats.comments,
          follows: user.stats.follows,
          reactions: user.stats.reactions,
          lastAction: user.lastAction
        }
      });

    } catch (error) {
      console.error('❌ Get action history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Log action to console and database
  logAction(user, actionType, targetUrl, commentText = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${user.maskedFacebookId} performed ${actionType} on ${targetUrl}${commentText ? ` with comment: "${commentText}"` : ''}`;
    
    console.log(`📝 ${logMessage}`);
    
    // In a real application, you'd save this to a database
    // For now, we'll just log to console
  }

  // Validate action parameters
  validateActionParams(targetUrl, actionType, commentText = null) {
    const errors = [];

    if (!targetUrl) {
      errors.push('Target URL is required');
    }

    if (!actionType) {
      errors.push('Action type is required');
    }

    const validActions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'follow', 'comment'];
    if (actionType && !validActions.includes(actionType)) {
      errors.push('Invalid action type');
    }

    if (actionType === 'comment' && (!commentText || commentText.trim().length === 0)) {
      errors.push('Comment text is required for comment action');
    }

    return errors;
  }
}

module.exports = new ActionController();