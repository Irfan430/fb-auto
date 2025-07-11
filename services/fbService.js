const puppeteer = require('puppeteer');
const moment = require('moment');

class FacebookService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const puppeteerArgs = process.env.PUPPETEER_ARGS 
        ? process.env.PUPPETEER_ARGS.split(',')
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ];

      this.browser = await puppeteer.launch({
        headless: true,
        args: puppeteerArgs,
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        timeout: 30000
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      this.isInitialized = true;
      console.log('✅ Facebook service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Facebook service:', error);
      throw error;
    }
  }

  async loginWithCookies(cookies) {
    try {
      await this.initialize();
      
      // Set cookies
      await this.page.setCookie(...cookies);
      
      // Navigate to Facebook
      await this.page.goto('https://www.facebook.com/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check if login was successful
      const isLoggedIn = await this.checkLoginStatus();
      
      if (!isLoggedIn) {
        throw new Error('Login failed - invalid or expired cookies');
      }

      console.log('✅ Successfully logged in with cookies');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async checkLoginStatus() {
    try {
      // Wait for page to load
      await this.page.waitForTimeout(3000);
      
      // Check for login indicators
      const loginIndicators = [
        'a[data-testid="blue_bar_profile_link"]',
        '[data-testid="blue_bar_profile_link"]',
        'a[aria-label="Your profile"]',
        '[aria-label="Your profile"]'
      ];

      for (const selector of loginIndicators) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Check if we're redirected to login page
      const currentUrl = this.page.url();
      if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  async likePost(postUrl) {
    try {
      await this.page.goto(postUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Try different like button selectors
      const likeSelectors = [
        '[aria-label="Like"]',
        '[aria-label="Like this post"]',
        'div[data-testid="like-button"]',
        'a[data-testid="like-button"]',
        'span[data-testid="like-button"]'
      ];

      for (const selector of likeSelectors) {
        try {
          const likeButton = await this.page.$(selector);
          if (likeButton) {
            await likeButton.click();
            await this.page.waitForTimeout(1000);
            console.log('✅ Post liked successfully');
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      throw new Error('Like button not found');
    } catch (error) {
      console.error('❌ Failed to like post:', error.message);
      throw error;
    }
  }

  async reactToPost(postUrl, reactionType) {
    try {
      await this.page.goto(postUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Map reaction types to Facebook reactions
      const reactionMap = {
        'love': 'Love',
        'haha': 'Haha',
        'wow': 'Wow',
        'sad': 'Sad',
        'angry': 'Angry'
      };

      const reactionName = reactionMap[reactionType] || 'Love';
      
      // Hover over like button to show reaction options
      const likeButton = await this.page.$('[aria-label="Like"]') || 
                        await this.page.$('[aria-label="Like this post"]') ||
                        await this.page.$('div[data-testid="like-button"]');

      if (!likeButton) {
        throw new Error('Like button not found');
      }

      await likeButton.hover();
      await this.page.waitForTimeout(1000);

      // Click on specific reaction
      const reactionSelector = `[aria-label="${reactionName}"]`;
      const reactionButton = await this.page.$(reactionSelector);
      
      if (reactionButton) {
        await reactionButton.click();
        await this.page.waitForTimeout(1000);
        console.log(`✅ Reacted with ${reactionName} successfully`);
        return true;
      } else {
        // Fallback to like if specific reaction not found
        await likeButton.click();
        console.log('✅ Liked post (reaction not available)');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to react to post:', error.message);
      throw error;
    }
  }

  async commentOnPost(postUrl, commentText) {
    try {
      await this.page.goto(postUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Find comment box
      const commentSelectors = [
        '[data-testid="comment-composer"]',
        '[aria-label="Write a comment"]',
        'div[data-testid="comment-composer"] textarea',
        'textarea[placeholder*="comment"]',
        'textarea[placeholder*="Comment"]'
      ];

      let commentBox = null;
      for (const selector of commentSelectors) {
        try {
          commentBox = await this.page.$(selector);
          if (commentBox) break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!commentBox) {
        throw new Error('Comment box not found');
      }

      // Click on comment box and type
      await commentBox.click();
      await this.page.waitForTimeout(500);
      await commentBox.type(commentText);
      await this.page.waitForTimeout(500);

      // Press Enter to submit
      await commentBox.press('Enter');
      await this.page.waitForTimeout(2000);

      console.log('✅ Comment posted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to comment on post:', error.message);
      throw error;
    }
  }

  async followUser(userId) {
    try {
      const profileUrl = `https://www.facebook.com/${userId}`;
      await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Try different follow button selectors
      const followSelectors = [
        '[data-testid="follow-button"]',
        '[aria-label="Follow"]',
        'button[data-testid="follow-button"]',
        'a[data-testid="follow-button"]',
        'div[data-testid="follow-button"]'
      ];

      for (const selector of followSelectors) {
        try {
          const followButton = await this.page.$(selector);
          if (followButton) {
            await followButton.click();
            await this.page.waitForTimeout(2000);
            console.log('✅ User followed successfully');
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      throw new Error('Follow button not found');
    } catch (error) {
      console.error('❌ Failed to follow user:', error.message);
      throw error;
    }
  }

  async extractUserIdFromUrl(url) {
    try {
      // Handle different Facebook URL formats
      const patterns = [
        /facebook\.com\/([^\/\?]+)/,
        /facebook\.com\/profile\.php\?id=(\d+)/,
        /facebook\.com\/groups\/(\d+)\/posts\/(\d+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1] || match[2];
        }
      }

      throw new Error('Could not extract user ID from URL');
    } catch (error) {
      console.error('❌ Failed to extract user ID:', error.message);
      throw error;
    }
  }

  async validateUrl(url) {
    try {
      const validDomains = ['facebook.com', 'www.facebook.com', 'm.facebook.com'];
      const urlObj = new URL(url);
      
      if (!validDomains.includes(urlObj.hostname)) {
        throw new Error('Invalid Facebook URL');
      }

      return true;
    } catch (error) {
      console.error('❌ URL validation failed:', error.message);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isInitialized = false;
        console.log('✅ Facebook service cleaned up');
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // Method to get user info
  async getUserInfo() {
    try {
      await this.page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Extract user information
      const userInfo = await this.page.evaluate(() => {
        const nameElement = document.querySelector('h1') || 
                           document.querySelector('[data-testid="profile-name"]') ||
                           document.querySelector('title');
        
        const profilePicElement = document.querySelector('img[data-testid="profile-picture"]') ||
                                 document.querySelector('img[alt*="profile"]');

        return {
          name: nameElement ? nameElement.textContent.trim() : 'Unknown User',
          profilePicture: profilePicElement ? profilePicElement.src : null
        };
      });

      return userInfo;
    } catch (error) {
      console.error('❌ Failed to get user info:', error.message);
      return { name: 'Unknown User', profilePicture: null };
    }
  }
}

module.exports = new FacebookService();