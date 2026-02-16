# 🚀 Combined Deployment Guide

## ✅ Your Application is Now Combined!

Both **frontend** and **backend** now run from a **single server** on port **5000**.

---

## 📦 **What Changed:**

1. **Frontend Built**: Production-optimized React app in `frontend/dist`
2. **Backend Updated**: Now serves the frontend static files
3. **Single Port**: Everything runs on `http://localhost:5000`
4. **API Routes**: All API calls go to `/api/*`
5. **Frontend Routes**: All other routes serve the React app

---

## 🎯 **How to Use:**

### **Development Mode** (separate servers for hot reload):
```powershell
# Terminal 1 - Backend (port 5000)
cd i:\Projects\familytree\backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd i:\Projects\familytree\frontend
npm run dev
```

Visit: http://localhost:5173/ (with hot reload)

### **Production Mode** (single server):
```powershell
# Build frontend
cd i:\Projects\familytree\frontend
npm run build

# Start combined server
cd i:\Projects\familytree\backend
npm start
```

Visit: http://localhost:5000/ (production build)

### **Quick Deploy** (from root):
```powershell
cd i:\Projects\familytree
npm run deploy
```

This will:
1. Build the frontend
2. Start the backend serving the frontend

---

## 🌐 **Deployment Options:**

### **Option 1: Render.com** (Recommended - Free Tier)
1. Push code to GitHub
2. Connect to Render.com
3. Create **Web Service**
4. Set Build Command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
5. Set Start Command: `cd backend && npm start`
6. Add Environment Variables (from `backend/.env`)

### **Option 2: Railway.app**
1. Push code to GitHub
2. Connect to Railway
3. Auto-detects Node.js
4. Set Root Directory: `backend`
5. Set Build Command: `cd ../frontend && npm run build && cd ../backend && npm install`
6. Add Environment Variables

### **Option 3: Heroku**
```powershell
# Install Heroku CLI, then:
heroku create your-familytree-app
git push heroku main
heroku config:set DATABASE_URL=your_neon_postgres_url
heroku config:set JWT_SECRET=your_secret
```

### **Option 4: Vercel** (Backend as Serverless)
- Frontend: Auto-deploy from GitHub
- Backend: Deploy as Vercel Functions

---

## 📁 **Project Structure:**

```
familytree/
├── package.json          # Root scripts for combined deployment
├── backend/
│   ├── server.js         # Now serves frontend static files
│   ├── package.json      # Backend dependencies
│   └── .env             # Environment variables
└── frontend/
    ├── dist/            # Built frontend (served by backend)
    └── package.json     # Frontend dependencies
```

---

## 🔧 **Environment Variables for Production:**

In your deployment platform, set:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_RIUw6PQx8JrE@ep-super-king-ahyd7aop-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<generate-strong-secret-here>
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=<generate-another-secret>
JWT_REFRESH_EXPIRE=30d
STRIPE_SECRET_KEY=<your-stripe-key>
CLIENT_URL=<your-production-domain>
```

---

## ✨ **Benefits of Combined Deployment:**

✅ **Single Server** - One URL, one deployment
✅ **No CORS Issues** - Same origin for API and frontend
✅ **Cost Effective** - Only pay for one server
✅ **Easy SSL** - One certificate covers everything
✅ **Simplified** - One deployment process
✅ **Production Ready** - Optimized build served efficiently

---

## 🎨 **Current Status:**

- **Backend**: ✅ Running on port 5000
- **Frontend**: ✅ Built and served by backend
- **Database**: ✅ PostgreSQL (Neon) connected
- **Ready**: ✅ Visit http://localhost:5000

---

## 📝 **Next Steps:**

1. **Test locally**: Visit http://localhost:5000
2. **Push to GitHub**: Create repository
3. **Choose deployment**: Render, Railway, or Heroku
4. **Deploy**: Follow platform instructions
5. **Set environment variables**: Add your secrets
6. **Go live**: Share your URL!

Your app is now **deployment-ready**! 🚀
