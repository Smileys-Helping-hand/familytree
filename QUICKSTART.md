# Quick Start Guide - Family Tree Website

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies

Open PowerShell and run:

```powershell
# Backend
cd i:\Projects\familytree\backend
npm install

# Frontend
cd i:\Projects\familytree\frontend
npm install
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/familytree`

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (Free tier)
4. Get connection string
5. Whitelist your IP address

### Step 3: Configure Environment Variables

```powershell
cd i:\Projects\familytree\backend
Copy-Item .env.example .env
notepad .env
```

**Minimal .env for local development:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/familytree
JWT_SECRET=your_random_secret_key_123456789
JWT_REFRESH_SECRET=your_random_refresh_secret_987654321
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=noreply@familytree.local

# For file uploads (get free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Start the Servers

**Terminal 1 - Backend:**
```powershell
cd i:\Projects\familytree\backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📝 Environment: development
```

**Terminal 2 - Frontend:**
```powershell
cd i:\Projects\familytree\frontend
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Access the Application

Open your browser and go to: **http://localhost:5173**

## 📝 First Time Setup

1. **Create an Account**
   - Click "Get Started" or "Register"
   - Fill in your name, email, and password
   - Click "Create Account"

2. **Create Your First Family**
   - After login, click "Create Family"
   - Enter family name (e.g., "Smith Family")
   - Add a description (optional)
   - Click "Create"

3. **Add Family Members**
   - Go to "Family Tree"
   - Click "Add Member"
   - Fill in details (name, birthdate, etc.)
   - Define relationships
   - Save

4. **Upload Memories**
   - Go to "Memories"
   - Click "Upload Memory"
   - Choose photos/videos
   - Add description
   - Tag family members
   - Share!

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error: MongooseServerSelectionError
```
**Fix:**
- Make sure MongoDB is running
- Check connection string in .env
- For Atlas: whitelist your IP

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:**
```powershell
# Find and kill the process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess -Unique
Stop-Process -Id <ProcessID>
```

### Frontend Not Loading
**Fix:**
- Clear browser cache
- Check if backend is running on port 5000
- Check browser console for errors

### Image Upload Not Working
**Fix:**
- Create free Cloudinary account at https://cloudinary.com
- Get credentials from Cloudinary dashboard
- Add to .env file

## 🎯 Next Steps

1. **Invite Family Members**
   - Settings → Invite Members
   - Enter their email
   - They'll receive invitation link

2. **Explore Features**
   - Build your family tree
   - Upload photos and memories
   - Add birthdays and events
   - Set up notifications

3. **Upgrade (Optional)**
   - Visit Pricing page
   - Choose Premium plan
   - Get unlimited members and storage

## 💡 Tips

- **Start Small**: Begin with immediate family, then expand
- **Add Photos**: Visual memories make the tree more engaging
- **Document Stories**: Add biographies and anecdotes
- **Regular Updates**: Keep birthdays and events current
- **Backup Data**: Export regularly (Premium feature)

## 📞 Need Help?

- Check [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed documentation
- Review [README.md](./README.md) for API reference
- Check backend logs for errors
- Check browser console for frontend issues

## 🎉 You're Ready!

Start building your family tree and preserving your heritage for generations to come!

---

**Happy Family Tree Building! 🌳**
