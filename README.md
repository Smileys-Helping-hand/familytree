 # 🌳 Family Tree Website

A modern, full-stack web application for preserving family heritage, sharing memories, and staying connected across generations.

## 🎯 Features

### Core Features
- **Interactive Family Tree** - Visual family tree with drag-and-drop functionality
- **Member Profiles** - Detailed profiles with photos, dates, relationships, and biographies
- **Memories Gallery** - Upload and share photos, videos, and stories
- **Events Calendar** - Track birthdays, anniversaries, and special occasions
- **Email Notifications** - Automatic birthday and event reminders
- **Multi-User Collaboration** - Role-based access (Admin, Editor, Viewer)
- **Mobile Responsive** - Works seamlessly on all devices

### Monetization Features (Subtle & User-Friendly)
- **Free Tier** - 100 members, 1GB storage, basic features
- **Premium Tier ($9.99/mo)** - Unlimited members, 50GB, PDF exports, custom themes
- **Premium Plus ($19.99/mo)** - 200GB, DNA integration, printed family books

## 🏗️ Tech Stack

### Backend
- **Node.js & Express** - RESTful API server
- **PostgreSQL & Sequelize** - Primary database and ORM
- **MongoDB & Mongoose** - Optional/legacy database support
- **JWT** - Authentication
- **Cloudinary** - Image/video storage
- **SendGrid/Nodemailer** - Email service
- **Stripe** - Payment processing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **React Flow** - Family tree visualization
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ (primary database)
- MongoDB (optional, for legacy support)
- Cloudinary account (for image uploads)
- Stripe account (for payments)
- SendGrid or SMTP email service

### 1. Clone the Repository
```bash
cd i:\Projects\familytree
```

### 2. Backend Setup
```powershell
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
Copy-Item .env.example .env

# Edit .env with your credentials
notepad .env
```

**Required Environment Variables:**
```env
PORT=5000
NODE_ENV=development

# PostgreSQL (Primary)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=familytree
DB_USER=postgres
DB_PASSWORD=your_password

# MongoDB (Optional)
MONGODB_URI=mongodb://localhost:27017/familytree

# JWT
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup
```powershell
cd ..\frontend

# Install dependencies
npm install
```

### 4. Start Development Servers

**Option 1 - Using root package.json (Recommended):**
```powershell
# From project root, runs both servers concurrently
npm run dev
```

**Option 2 - Manual (two terminals):**

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 🚀 Production Deployment

### ⚡ Single Deployment (Recommended)

This application is configured to run as a **unified deployment** - both frontend and backend on a single server.

**Quick Start:**
```bash
# Install all dependencies
npm run install

# Build frontend and start production server
npm run deploy
```

The backend serves both the API and the built frontend files on one port (default: 5000).

**📖 For detailed deployment instructions, see [SINGLE_DEPLOYMENT_GUIDE.md](./SINGLE_DEPLOYMENT_GUIDE.md)**

### Deployment Platforms

#### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production JWT_SECRET=your_secret
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Build: `npm run build`
5. Start: `npm run start:prod`

#### Render / DigitalOcean / VPS
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- Add PostgreSQL database
- Configure environment variables

### Database
- **PostgreSQL** (primary, recommended)
- MongoDB (optional/legacy support)

## 📚 API Documentation

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
POST /api/auth/logout       - Logout user
GET  /api/auth/me           - Get current user
```

### Families
```
POST   /api/families              - Create family
GET    /api/families              - Get user's families
GET    /api/families/:id          - Get single family
PUT    /api/families/:id          - Update family
DELETE /api/families/:id          - Delete family
POST   /api/families/:id/invite   - Invite member
```

### Members
```
POST   /api/members                    - Create member
GET    /api/members/family/:familyId   - Get family members
GET    /api/members/:id                - Get member details
PUT    /api/members/:id                - Update member
DELETE /api/members/:id                - Delete member
GET    /api/members/:id/tree           - Get family tree
```

### Memories
```
POST   /api/memories                    - Create memory (with file upload)
GET    /api/memories/family/:familyId   - Get family memories
GET    /api/memories/:id                - Get memory details
PUT    /api/memories/:id                - Update memory
DELETE /api/memories/:id                - Delete memory
POST   /api/memories/:id/like           - Like memory
POST   /api/memories/:id/comment        - Add comment
```

### Events
```
POST   /api/events                    - Create event
GET    /api/events/family/:familyId   - Get family events
GET    /api/events/upcoming           - Get upcoming events
GET    /api/events/:id                - Get event details
PUT    /api/events/:id                - Update event
DELETE /api/events/:id                - Delete event
POST   /api/events/:id/rsvp           - RSVP to event
```

### Subscriptions
```
POST /api/subscriptions/create-checkout   - Create Stripe checkout
GET  /api/subscriptions/status            - Get subscription status
POST /api/subscriptions/cancel            - Cancel subscription
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- CORS protection
- Rate limiting
- Helmet security headers
- Input validation
- File upload restrictions
- Environment variable protection

## 🎨 UI/UX Highlights

- Clean, modern design with Tailwind CSS
- Intuitive navigation
- Responsive layouts for mobile/tablet/desktop
- Loading states and error handling
- Toast notifications for user feedback
- Optimistic UI updates
- Accessible (WCAG AA compliant)

## 💰 Monetization Strategy

The app uses a **freemium model** with subtle upsells:

### Free Tier
- Perfect for small families
- 100 members, 1GB storage
- Core features included

### Premium ($9.99/mo)
- For growing families
- Unlimited members, 50GB
- PDF exports, custom themes
- Ad-free experience

### Premium Plus ($19.99/mo)
- For serious genealogists
- 200GB storage
- DNA integration
- Professional printing
- Advanced reports

### Additional Revenue
- Printed family trees & photo books
- Premium themes ($4.99)
- Extra storage packs
- DNA test kit affiliate commissions

## 📈 Future Enhancements

- [ ] Mobile apps (iOS/Android)
- [ ] DNA test integration (Ancestry, 23andMe)
- [ ] Historical records search
- [ ] AI-powered photo colorization
- [ ] Multi-language support
- [ ] Family messaging/chat
- [ ] Timeline view
- [ ] Advanced analytics dashboard
- [ ] Collaborative editing with conflict resolution
- [ ] Export to GEDCOM format

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 📧 Support

For issues or questions:
- Email: support@yourfamilytree.com
- Documentation: [See PROJECT_PLAN.md](./PROJECT_PLAN.md)

## 🙏 Acknowledgments

Built with love for families who want to preserve their heritage for future generations.

---

**Start preserving your family history today! 🌳**
