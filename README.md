# Facebook Auto Actions 🚀

A professional, production-ready Facebook automation web application for auto liking, commenting, following, and reacting to Facebook posts. Built with Node.js, Express, MongoDB, and Puppeteer.

## ✨ Features

- **🔐 Secure Authentication**: Facebook ID + password or cookie-based login
- **🤖 Smart Automation**: Auto like, comment, follow, and react to posts
- **📊 Analytics Dashboard**: Track performance with detailed statistics
- **🛡️ Session Management**: Encrypted cookie storage with automatic cleanup
- **⚡ Bulk Actions**: Perform multiple actions simultaneously
- **🌐 Cloud Ready**: Deploy on Render.com or any cloud platform
- **📱 Responsive Design**: Modern UI with Bootstrap and custom styling

## 🏗️ Architecture

```
├── package.json          # Dependencies and scripts
├── index.js             # Main application entry point
├── config/
│   └── db.js           # MongoDB connection configuration
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── action.js       # Action routes
│   └── dashboard.js    # Dashboard routes
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── actionController.js  # Action execution logic
│   └── dashboardController.js # Dashboard management
├── models/
│   └── User.js         # User model with session management
├── services/
│   └── fbService.js    # Facebook automation service
├── public/
│   ├── index.html      # Landing page
│   ├── styles.css      # Custom CSS
│   └── script.js       # Frontend JavaScript
├── views/
│   ├── dashboard.ejs   # Dashboard template
│   ├── login.ejs       # Login page
│   ├── register.ejs    # Registration page
│   └── error.ejs       # Error page
├── .env                # Environment variables
└── .gitignore          # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facebook-auto-actions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   ```
   http://localhost:3000
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/facebook_auto_actions
# For production: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook_auto_actions

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
SESSION_COOKIE_MAX_AGE=86400000

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Puppeteer Configuration
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
```

## 🌐 Deployment on Render.com

### 1. Prepare Your Repository

Ensure your repository is ready for deployment:

```bash
# Make sure all files are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy on Render

1. **Create a new Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   ```
   Name: facebook-auto-actions
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook_auto_actions
   SESSION_SECRET=your-production-secret-key
   SESSION_COOKIE_MAX_AGE=86400000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--disable-gpu
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app-name.onrender.com`

### 3. MongoDB Atlas Setup

1. **Create MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Set up database access (username/password)
   - Set up network access (0.0.0.0/0 for Render)

2. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/facebook_auto_actions
   ```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/auth/login/credentials`
Login with Facebook ID and password.

**Request:**
```json
{
  "facebookId": "123456789",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "facebookId": "****1234",
    "displayName": "John Doe",
    "profilePicture": "https://...",
    "stats": {...}
  }
}
```

#### POST `/auth/login/cookies`
Login with Facebook cookie string.

**Request:**
```json
{
  "cookieString": "c_user=123456789; xs=abc123..."
}
```

#### POST `/auth/register`
Register new user.

**Request:**
```json
{
  "facebookId": "123456789",
  "cookieString": "c_user=123456789; xs=abc123..."
}
```

#### POST `/auth/logout`
Logout user.

### Action Endpoints

#### POST `/action/perform`
Perform a single Facebook action.

**Request:**
```json
{
  "targetUrl": "https://www.facebook.com/post/123",
  "actionType": "like",
  "commentText": "Great post!" // Optional for comment action
}
```

**Available Actions:**
- `like` - Like a post
- `love`, `haha`, `wow`, `sad`, `angry` - React to a post
- `comment` - Comment on a post
- `follow` - Follow a user

#### POST `/action/bulk`
Perform multiple actions.

**Request:**
```json
{
  "actions": [
    {
      "targetUrl": "https://www.facebook.com/post/123",
      "actionType": "like"
    },
    {
      "targetUrl": "https://www.facebook.com/post/456",
      "actionType": "comment",
      "commentText": "Amazing!"
    }
  ]
}
```

#### GET `/action/types`
Get available action types.

**Response:**
```json
{
  "success": true,
  "actionTypes": [
    {
      "value": "like",
      "label": "👍 Like",
      "description": "Like a Facebook post",
      "requiresComment": false
    }
  ]
}
```

### Dashboard Endpoints

#### GET `/dashboard/data`
Get dashboard data.

#### GET `/dashboard/stats`
Get system statistics.

#### PUT `/dashboard/preferences`
Update user preferences.

**Request:**
```json
{
  "autoCleanup": true,
  "actionDelay": 5000,
  "maxActionsPerDay": 100
}
```

## 🧪 Testing with cURL

### Authentication Tests

```bash
# Login with cookies
curl -X POST http://localhost:3000/auth/login/cookies \
  -H "Content-Type: application/json" \
  -d '{"cookieString": "c_user=123456789; xs=abc123..."}'

# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"facebookId": "123456789", "cookieString": "c_user=123456789; xs=abc123..."}'

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  --cookie "fb-auto-session=your-session-cookie"
```

### Action Tests

```bash
# Perform single action
curl -X POST http://localhost:3000/action/perform \
  -H "Content-Type: application/json" \
  --cookie "fb-auto-session=your-session-cookie" \
  -d '{"targetUrl": "https://www.facebook.com/post/123", "actionType": "like"}'

# Perform bulk actions
curl -X POST http://localhost:3000/action/bulk \
  -H "Content-Type: application/json" \
  --cookie "fb-auto-session=your-session-cookie" \
  -d '{"actions": [{"targetUrl": "https://www.facebook.com/post/123", "actionType": "like"}]}'

# Get action types
curl -X GET http://localhost:3000/action/types
```

### Dashboard Tests

```bash
# Get dashboard data
curl -X GET http://localhost:3000/dashboard/data \
  --cookie "fb-auto-session=your-session-cookie"

# Get system stats
curl -X GET http://localhost:3000/dashboard/stats \
  --cookie "fb-auto-session=your-session-cookie"

# Update preferences
curl -X PUT http://localhost:3000/dashboard/preferences \
  -H "Content-Type: application/json" \
  --cookie "fb-auto-session=your-session-cookie" \
  -d '{"actionDelay": 5000, "maxActionsPerDay": 100}'
```

## 🔧 Configuration

### Security Settings

- **Session Secret**: Use a strong, random string
- **Rate Limiting**: Adjust limits based on your needs
- **CORS**: Configure for your domain
- **Helmet**: Security headers enabled

### Puppeteer Settings

The application uses Puppeteer for Facebook automation with optimized settings:

```javascript
const puppeteerArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu'
];
```

### Database Settings

- **MongoDB**: Primary database
- **Indexes**: Optimized for queries
- **Cleanup**: Automatic session cleanup
- **Encryption**: Session cookies encrypted

## 🛠️ Development

### Project Structure

```
├── config/          # Configuration files
├── controllers/     # Business logic
├── models/          # Database models
├── routes/          # API routes
├── services/        # External services
├── views/           # EJS templates
└── public/          # Static files
```

### Adding New Features

1. **Create Controller**: Add business logic in `controllers/`
2. **Create Route**: Add API endpoints in `routes/`
3. **Update Model**: Modify database schema if needed
4. **Add Frontend**: Update views and JavaScript
5. **Test**: Use cURL or Postman for testing

### Code Style

- Use ES6+ features
- Follow MVC pattern
- Add proper error handling
- Include JSDoc comments
- Use async/await for promises

## 🔒 Security Considerations

### Data Protection

- **Encryption**: Session cookies are encrypted
- **Masking**: Facebook IDs are masked in display
- **Cleanup**: Automatic session cleanup
- **Validation**: Input validation on all endpoints

### Rate Limiting

- **Requests**: 100 requests per 15 minutes per IP
- **Actions**: Configurable delays between actions
- **Sessions**: Automatic expiry handling

### Facebook Compliance

- **Respectful**: Reasonable delays between actions
- **Transparent**: Clear logging of all actions
- **Secure**: No password storage, only cookies
- **Limited**: Configurable action limits

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string
   - Verify network access
   - Test with MongoDB Compass

2. **Puppeteer Issues**
   - Update Node.js version
   - Check system dependencies
   - Verify Puppeteer installation

3. **Session Problems**
   - Clear browser cookies
   - Check session secret
   - Verify cookie settings

4. **Facebook Login Issues**
   - Verify cookie format
   - Check cookie expiration
   - Test with fresh cookies

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm start
```

### Health Check

Test application health:

```bash
curl http://localhost:3000/health
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## ⚠️ Disclaimer

This application is for educational and legitimate automation purposes only. Users are responsible for complying with Facebook's Terms of Service and applicable laws. The developers are not responsible for any misuse of this software.

---

**Built with ❤️ using Node.js, Express, MongoDB, and Puppeteer**