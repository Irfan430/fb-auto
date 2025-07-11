const User = require('../models/User');
const moment = require('moment');

class DashboardController {
  // Render dashboard page
  async renderDashboard(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.redirect('/auth/login');
      }

      const user = await User.findById(userId).select('-sessionCookies');
      
      if (!user) {
        req.session.destroy();
        return res.redirect('/auth/login');
      }

      // Get active users count
      const activeUsers = await User.getActiveUsers();
      const activeUsersCount = activeUsers.length;

      // Calculate session expiry
      const sessionExpiry = moment(user.sessionExpiry);
      const isSessionValid = user.isSessionValid;
      const daysUntilExpiry = sessionExpiry.diff(moment(), 'days');

      // Format last action
      const lastActionFormatted = user.lastAction 
        ? moment(user.lastAction).format('MMMM Do YYYY, h:mm a')
        : 'No actions yet';

      // Calculate days since last action
      const daysSinceLastAction = user.lastAction 
        ? moment().diff(moment(user.lastAction), 'days')
        : null;

      res.render('dashboard', {
        user: {
          id: user._id,
          facebookId: user.maskedFacebookId,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          stats: user.stats,
          isSessionValid,
          sessionExpiry: sessionExpiry.format('MMMM Do YYYY, h:mm a'),
          daysUntilExpiry,
          lastAction: lastActionFormatted,
          daysSinceLastAction,
          preferences: user.preferences
        },
        activeUsersCount,
        pageTitle: 'Facebook Auto Actions Dashboard'
      });

    } catch (error) {
      console.error('❌ Dashboard render error:', error);
      res.status(500).render('error', {
        message: 'Failed to load dashboard',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // Get dashboard data (API endpoint)
  async getDashboardData(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await User.findById(userId).select('-sessionCookies');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get active users count
      const activeUsers = await User.getActiveUsers();
      const activeUsersCount = activeUsers.length;

      // Calculate session expiry
      const sessionExpiry = moment(user.sessionExpiry);
      const isSessionValid = user.isSessionValid;
      const daysUntilExpiry = sessionExpiry.diff(moment(), 'days');

      // Format last action
      const lastActionFormatted = user.lastAction 
        ? moment(user.lastAction).format('MMMM Do YYYY, h:mm a')
        : 'No actions yet';

      // Calculate days since last action
      const daysSinceLastAction = user.lastAction 
        ? moment().diff(moment(user.lastAction), 'days')
        : null;

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            facebookId: user.maskedFacebookId,
            displayName: user.displayName,
            profilePicture: user.profilePicture,
            stats: user.stats,
            isSessionValid,
            sessionExpiry: sessionExpiry.format('MMMM Do YYYY, h:mm a'),
            daysUntilExpiry,
            lastAction: lastActionFormatted,
            daysSinceLastAction,
            preferences: user.preferences
          },
          activeUsersCount,
          systemInfo: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
          }
        }
      });

    } catch (error) {
      console.error('❌ Get dashboard data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get active users (admin function)
  async getActiveUsers(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const activeUsers = await User.getActiveUsers();
      
      const formattedUsers = activeUsers.map(user => ({
        id: user._id,
        facebookId: user.maskedFacebookId,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        stats: user.stats,
        isSessionValid: user.isSessionValid,
        lastAction: user.lastAction ? moment(user.lastAction).format('MMMM Do YYYY, h:mm a') : 'No actions',
        daysSinceLastAction: user.lastAction ? moment().diff(moment(user.lastAction), 'days') : null,
        sessionExpiry: moment(user.sessionExpiry).format('MMMM Do YYYY, h:mm a'),
        daysUntilExpiry: moment(user.sessionExpiry).diff(moment(), 'days')
      }));

      res.json({
        success: true,
        users: formattedUsers,
        total: formattedUsers.length
      });

    } catch (error) {
      console.error('❌ Get active users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const userId = req.session.userId;
      const { autoCleanup, actionDelay, maxActionsPerDay } = req.body;

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

      // Update preferences
      if (typeof autoCleanup === 'boolean') {
        user.preferences.autoCleanup = autoCleanup;
      }

      if (typeof actionDelay === 'number' && actionDelay >= 1000 && actionDelay <= 30000) {
        user.preferences.actionDelay = actionDelay;
      }

      if (typeof maxActionsPerDay === 'number' && maxActionsPerDay >= 1 && maxActionsPerDay <= 1000) {
        user.preferences.maxActionsPerDay = maxActionsPerDay;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: user.preferences
      });

    } catch (error) {
      console.error('❌ Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get system statistics
  async getSystemStats(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get various statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ 
        isActive: true, 
        sessionExpiry: { $gt: new Date() } 
      });
      const expiredSessions = await User.countDocuments({ 
        sessionExpiry: { $lt: new Date() } 
      });

      // Get top users by actions
      const topUsers = await User.find({ isActive: true })
        .sort({ 'stats.totalActions': -1 })
        .limit(5)
        .select('maskedFacebookId displayName stats.totalActions');

      // Calculate total actions across all users
      const totalActions = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$stats.totalActions' } } }
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          expiredSessions,
          totalActions: totalActions[0]?.total || 0,
          topUsers,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh user session
  async refreshSession(req, res) {
    try {
      const userId = req.session.userId;

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

      // Extend session expiry by 24 hours
      user.sessionExpiry = moment().add(24, 'hours').toDate();
      await user.save();

      res.json({
        success: true,
        message: 'Session refreshed successfully',
        newExpiry: moment(user.sessionExpiry).format('MMMM Do YYYY, h:mm a')
      });

    } catch (error) {
      console.error('❌ Refresh session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const userId = req.session.userId;

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

      // Delete user
      await User.findByIdAndDelete(userId);

      // Destroy session
      req.session.destroy();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new DashboardController();