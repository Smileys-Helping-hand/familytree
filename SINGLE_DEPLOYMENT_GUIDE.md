# Single Deployment Guide

This guide explains how to deploy both the backend and frontend as a single application.

## 🎯 Overview

The Family Tree application is configured to run as a **single unified deployment**:
- The backend Express server serves both the API and the frontend static files
- In production, only one server runs (backend on port 5000 by default)
- The frontend is built into static files and served by the backend
- All API routes are prefixed with `/api`
- All other routes serve the React SPA

## 📋 Prerequisites

- Node.js 16+ and npm
- PostgreSQL database (or MongoDB as fallback)
- Required environment variables configured (see `.env` setup below)

## 🚀 Quick Start - Production Deployment

### 1. Install Dependencies

From the project root:
```bash
npm run install
```

This will install dependencies for both backend and frontend.

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database - PostgreSQL (Primary)
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=familytree
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Database - MongoDB (Optional Fallback)
MONGODB_URI=mongodb://localhost:27017/familytree

# JWT Configuration
JWT_SECRET=your_strong_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_FROM=noreply@yourfamilytree.com
SENDGRID_API_KEY=your_sendgrid_key

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL (not needed in production if same domain)
FRONTEND_URL=https://yourdomain.com

# File Upload Settings
MAX_FILE_SIZE=10485760
```

### 3. Build and Start

**Option A: Using root package.json (Recommended)**
```bash
# Build frontend and start production server
npm run deploy
```

**Option B: Using backend scripts**
```bash
cd backend
npm run build    # Builds the frontend
npm start        # Starts production server
```

**Option C: Single command from root**
```bash
npm run build    # Build frontend only
npm run start:prod    # Start backend in production mode
```

### 4. Verify Deployment

Once started, the application will be available at:
- **Full Application**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **API Routes**: http://localhost:5000/api/*

The backend serves both the API and the React frontend.

## 🔧 How It Works

### Development Mode
- **Frontend**: Runs on port 5173 with Vite dev server
- **Backend**: Runs on port 5000 with API endpoints
- Vite proxies `/api` requests to the backend
- Hot reload enabled for both

```bash
npm run dev    # Runs both servers concurrently
```

### Production Mode
- **Frontend**: Built to `frontend/dist/` as static files
- **Backend**: Serves API + static frontend files on port 5000
- Single server handles everything
- Optimized production builds

```bash
npm run deploy    # Build + start production
```

### Static File Serving Logic (backend/server.js)

```javascript
// API routes are registered first
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... other API routes

// In production mode
if (process.env.NODE_ENV === 'production') {
  // Serve static frontend files
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
```

## 🌐 Deployment Platforms

### Heroku

The `heroku-postbuild` script is already configured in `package.json`.

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
# ... set other env vars

# Deploy
git push heroku main

# Open app
heroku open
```

### Railway

1. Create new project on Railway
2. Connect your GitHub repository
3. Railway will auto-detect Node.js
4. Add PostgreSQL database addon
5. Set environment variables in Railway dashboard
6. Set these custom settings:
   - **Root Directory**: Leave blank (uses root)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`

### Render

1. Create new **Web Service**
2. Connect repository
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
4. Add PostgreSQL database
5. Set environment variables in Render dashboard

### DigitalOcean App Platform

1. Create new app from repository
2. Configure:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm run start:prod`
3. Add PostgreSQL database component
4. Set environment variables

### VPS/Custom Server

```bash
# Clone repository
git clone <your-repo> familytree
cd familytree

# Install dependencies
npm run install

# Set up environment variables
cd backend
nano .env    # Configure all required variables

# Build frontend
cd ..
npm run build

# Start with PM2 (process manager)
npm install -g pm2
cd backend
pm2 start server.js --name familytree-app -i max
pm2 save
pm2 startup

# Or use systemd service
# Create /etc/systemd/system/familytree.service
```

## 📦 Build Output

After running `npm run build`:
- Frontend is built to: `frontend/dist/`
- Contains: `index.html`, `assets/`, and other static files
- Backend serves these files in production mode

## 🔍 Troubleshooting

### Frontend Not Loading

**Problem**: API works but frontend shows 404 or doesn't load

**Solution**: 
1. Verify frontend was built: Check `frontend/dist/` exists
2. Ensure `NODE_ENV=production` is set
3. Check backend server.js has static file middleware

```bash
# Rebuild frontend
npm run build

# Verify dist folder
ls frontend/dist/
```

### API Routes Not Working

**Problem**: Frontend loads but API calls fail

**Solution**:
1. Verify API routes are registered before static file middleware
2. Check all routes are prefixed with `/api`
3. Verify CORS settings if accessing from different domain

### Environment Variables Not Working

**Problem**: Server starts but features don't work

**Solution**:
1. Ensure `.env` file is in `backend/` directory (not root)
2. Verify NODE_ENV is set to "production"
3. Check all required variables are set

### Database Connection Issues

**Problem**: Server won't start or database errors

**Solution**:
1. Verify database credentials in `.env`
2. Ensure database server is running
3. Check database host/port accessibility
4. Review connection logs in server output

## 📊 Available Scripts

### Root Level (package.json)
- `npm run install` - Install all dependencies
- `npm run dev` - Run both servers in development
- `npm run build` - Build frontend for production
- `npm run start:prod` - Start backend in production mode
- `npm run deploy` - Build and start production server

### Backend (backend/package.json)
- `npm run dev` - Run backend with nodemon
- `npm start` - Start backend in production
- `npm run build` - Build frontend from backend dir
- `npm run deploy` - Full deployment (build + start)

### Frontend (frontend/package.json)
- `npm run dev` - Run Vite dev server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, random secrets in production
3. **Database**: Use strong passwords, limit access
4. **CORS**: Restrict to your production domain
5. **Rate Limiting**: Already configured, adjust as needed
6. **Helmet**: Security headers already enabled
7. **File Uploads**: Size limits configured (10MB default)

## 🎉 Benefits of Single Deployment

✅ **Simplified deployment** - One codebase, one server
✅ **Easier configuration** - Single environment to manage
✅ **Cost effective** - One hosting instance instead of two
✅ **Better performance** - No cross-origin requests in production
✅ **Simplified CORS** - No CORS issues since same origin
✅ **Easy scaling** - Scale entire app together

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review server logs for specific errors
3. Verify all environment variables are set
4. Ensure database is accessible and configured correctly
