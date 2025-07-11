const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const userSchema = new mongoose.Schema({
  // Facebook account information
  facebookId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Masked Facebook ID for display (last 4 digits)
  maskedFacebookId: {
    type: String,
    required: true
  },
  
  // Facebook email (optional)
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Facebook display name
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Facebook profile picture URL
  profilePicture: {
    type: String
  },
  
  // Facebook session cookies (encrypted)
  sessionCookies: {
    type: String, // Encrypted JSON string
    required: true
  },
  
  // Session expiry
  sessionExpiry: {
    type: Date,
    required: true,
    index: true
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Last login timestamp
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Account creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Last action timestamp
  lastAction: {
    type: Date
  },
  
  // Action statistics
  stats: {
    totalActions: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    follows: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    }
  },
  
  // Account preferences
  preferences: {
    autoCleanup: {
      type: Boolean,
      default: true
    },
    actionDelay: {
      type: Number,
      default: 5000 // 5 seconds
    },
    maxActionsPerDay: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ 'sessionExpiry': 1, 'isActive': 1 });
userSchema.index({ 'lastAction': -1 });
userSchema.index({ 'stats.totalActions': -1 });

// Virtual for session status
userSchema.virtual('isSessionValid').get(function() {
  return this.sessionExpiry > new Date() && this.isActive;
});

// Virtual for days since last action
userSchema.virtual('daysSinceLastAction').get(function() {
  if (!this.lastAction) return null;
  return moment().diff(moment(this.lastAction), 'days');
});

// Pre-save middleware to encrypt session cookies
userSchema.pre('save', async function(next) {
  if (this.isModified('sessionCookies')) {
    try {
      // In a real application, you'd use a proper encryption library
      // For demo purposes, we'll use a simple base64 encoding
      // In production, use crypto module with proper encryption
      this.sessionCookies = Buffer.from(this.sessionCookies).toString('base64');
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to decrypt session cookies
userSchema.methods.getDecryptedCookies = function() {
  try {
    return JSON.parse(Buffer.from(this.sessionCookies, 'base64').toString());
  } catch (error) {
    console.error('Error decrypting session cookies:', error);
    return null;
  }
};

// Method to set encrypted session cookies
userSchema.methods.setSessionCookies = function(cookies, expiryHours = 24) {
  this.sessionCookies = JSON.stringify(cookies);
  this.sessionExpiry = new Date(Date.now() + (expiryHours * 60 * 60 * 1000));
  this.lastLogin = new Date();
};

// Method to update action statistics
userSchema.methods.updateStats = function(actionType) {
  this.stats.totalActions += 1;
  this.lastAction = new Date();
  
  switch (actionType) {
    case 'like':
      this.stats.likes += 1;
      break;
    case 'comment':
      this.stats.comments += 1;
      break;
    case 'follow':
      this.stats.follows += 1;
      break;
    case 'reaction':
      this.stats.reactions += 1;
      break;
  }
};

// Method to check if user can perform actions
userSchema.methods.canPerformAction = function() {
  if (!this.isSessionValid) return false;
  
  // Check daily action limit
  const today = moment().startOf('day');
  const lastActionToday = this.lastAction ? moment(this.lastAction).isAfter(today) : false;
  
  // For demo purposes, we'll allow actions if session is valid
  // In production, implement proper rate limiting
  return true;
};

// Static method to clean up expired sessions
userSchema.statics.cleanupExpiredSessions = async function() {
  try {
    const result = await this.updateMany(
      { 
        sessionExpiry: { $lt: new Date() },
        isActive: true 
      },
      { 
        $set: { isActive: false },
        $unset: { sessionCookies: 1 }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} expired sessions`);
    }
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
};

// Static method to get active users
userSchema.statics.getActiveUsers = function() {
  return this.find({
    isActive: true,
    sessionExpiry: { $gt: new Date() }
  }).select('-sessionCookies');
};

// Static method to get user by Facebook ID
userSchema.statics.findByFacebookId = function(facebookId) {
  return this.findOne({ facebookId, isActive: true });
};

// Static method to create masked Facebook ID
userSchema.statics.createMaskedId = function(facebookId) {
  if (!facebookId || facebookId.length < 4) return '****';
  return facebookId.slice(-4).padStart(facebookId.length, '*');
};

module.exports = mongoose.model('User', userSchema);