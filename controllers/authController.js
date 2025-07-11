const User = require('../models/User');
const fbService = require('../services/fbService');
const moment = require('moment');

class AuthController {
  // Login with Facebook ID and password
  async loginWithCredentials(req, res) {
    try {
      const { facebookId, password } = req.body;

      if (!facebookId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Facebook ID and password are required'
        });
      }

      // Check if user exists
      let user = await User.findByFacebookId(facebookId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.'
        });
      }

      // Validate session
      if (!user.isSessionValid) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }

      // Set session
      req.session.userId = user._id;
      req.session.facebookId = user.facebookId;

      console.log(`✅ User logged in: ${user.maskedFacebookId}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          facebookId: user.maskedFacebookId,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          stats: user.stats
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Login with cookie string
  async loginWithCookies(req, res) {
    try {
      const { cookieString } = req.body;

      if (!cookieString) {
        return res.status(400).json({
          success: false,
          message: 'Cookie string is required'
        });
      }

      // Parse cookie string
      const cookies = this.parseCookieString(cookieString);
      
      if (!cookies || cookies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cookie string format'
        });
      }

      // Test login with Facebook service
      await fbService.loginWithCookies(cookies);
      
      // Get user info from Facebook
      const userInfo = await fbService.getUserInfo();
      
      // Extract Facebook ID from cookies
      const facebookId = this.extractFacebookIdFromCookies(cookies);
      
      if (!facebookId) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract Facebook ID from cookies'
        });
      }

      // Check if user exists
      let user = await User.findByFacebookId(facebookId);
      const maskedId = User.createMaskedId(facebookId);

      if (!user) {
        // Create new user
        user = new User({
          facebookId,
          maskedFacebookId: maskedId,
          displayName: userInfo.name,
          profilePicture: userInfo.profilePicture,
          sessionCookies: JSON.stringify(cookies),
          sessionExpiry: moment().add(24, 'hours').toDate()
        });
      } else {
        // Update existing user
        user.setSessionCookies(cookies, 24);
        user.displayName = userInfo.name;
        user.profilePicture = userInfo.profilePicture;
        user.isActive = true;
      }

      await user.save();

      // Set session
      req.session.userId = user._id;
      req.session.facebookId = user.facebookId;

      console.log(`✅ User logged in with cookies: ${user.maskedFacebookId}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          facebookId: user.maskedFacebookId,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          stats: user.stats
        }
      });

    } catch (error) {
      console.error('❌ Cookie login error:', error);
      
      if (error.message.includes('Login failed')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired cookies. Please provide valid Facebook cookies.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Register new user
  async register(req, res) {
    try {
      const { facebookId, cookieString } = req.body;

      if (!facebookId || !cookieString) {
        return res.status(400).json({
          success: false,
          message: 'Facebook ID and cookie string are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByFacebookId(facebookId);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Parse cookie string
      const cookies = this.parseCookieString(cookieString);
      
      if (!cookies || cookies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cookie string format'
        });
      }

      // Test login with Facebook service
      await fbService.loginWithCookies(cookies);
      
      // Get user info from Facebook
      const userInfo = await fbService.getUserInfo();
      
      const maskedId = User.createMaskedId(facebookId);

      // Create new user
      const user = new User({
        facebookId,
        maskedFacebookId: maskedId,
        displayName: userInfo.name,
        profilePicture: userInfo.profilePicture,
        sessionCookies: JSON.stringify(cookies),
        sessionExpiry: moment().add(24, 'hours').toDate()
      });

      await user.save();

      // Set session
      req.session.userId = user._id;
      req.session.facebookId = user.facebookId;

      console.log(`✅ New user registered: ${user.maskedFacebookId}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user._id,
          facebookId: user.maskedFacebookId,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          stats: user.stats
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.message.includes('Login failed')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid cookies. Please provide valid Facebook cookies.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ Session destruction error:', err);
          return res.status(500).json({
            success: false,
            message: 'Logout failed'
          });
        }

        console.log('✅ User logged out');
        res.json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const user = await User.findById(req.session.userId).select('-sessionCookies');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          facebookId: user.maskedFacebookId,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          stats: user.stats,
          isSessionValid: user.isSessionValid,
          lastAction: user.lastAction,
          preferences: user.preferences
        }
      });

    } catch (error) {
      console.error('❌ Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cleanup expired sessions (admin function)
  async cleanupExpiredSessions(req, res) {
    try {
      const cleanedCount = await User.cleanupExpiredSessions();
      
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired sessions`,
        cleanedCount
      });

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Helper method to parse cookie string
  parseCookieString(cookieString) {
    try {
      const cookies = [];
      const cookiePairs = cookieString.split(';');
      
      for (const pair of cookiePairs) {
        const [name, value] = pair.trim().split('=');
        if (name && value) {
          cookies.push({
            name: name.trim(),
            value: value.trim(),
            domain: '.facebook.com',
            path: '/'
          });
        }
      }
      
      return cookies;
    } catch (error) {
      console.error('❌ Cookie parsing error:', error);
      return null;
    }
  }

  // Helper method to extract Facebook ID from cookies
  extractFacebookIdFromCookies(cookies) {
    try {
      const cUserCookie = cookies.find(cookie => cookie.name === 'c_user');
      return cUserCookie ? cUserCookie.value : null;
    } catch (error) {
      console.error('❌ Facebook ID extraction error:', error);
      return null;
    }
  }
}

module.exports = new AuthController();