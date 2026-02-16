# 🚀 Deployment Checklist

Use this checklist to deploy your Family Tree website to production.

## Pre-Deployment

### Environment Setup
- [ ] Create MongoDB Atlas account and cluster
- [ ] Create Cloudinary account (image hosting)
- [ ] Create Stripe account (payments)
- [ ] Create SendGrid account (emails) or configure SMTP
- [ ] Choose hosting providers:
  - [ ] Backend: Railway / Render / AWS / DigitalOcean
  - [ ] Frontend: Vercel / Netlify

### Code Preparation
- [ ] Test all features locally
- [ ] Fix any bugs or issues
- [ ] Update environment variables for production
- [ ] Add production MongoDB URI
- [ ] Add production Cloudinary credentials
- [ ] Add production Stripe keys
- [ ] Set strong JWT secrets
- [ ] Update FRONTEND_URL to production domain
- [ ] Review and update CORS settings

## Backend Deployment

### MongoDB Atlas Setup
- [ ] Create cluster (free M0 tier available)
- [ ] Create database user
- [ ] Whitelist IP addresses (0.0.0.0/0 for all or specific IPs)
- [ ] Get connection string
- [ ] Test connection locally

### Backend Hosting (Railway Example)
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Create new project from repo
- [ ] Select backend folder as root
- [ ] Add environment variables:
  ```
  NODE_ENV=production
  PORT=5000
  MONGODB_URI=your_atlas_connection_string
  JWT_SECRET=your_production_secret
  JWT_REFRESH_SECRET=your_refresh_secret
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  SENDGRID_API_KEY=your_sendgrid_key
  STRIPE_SECRET_KEY=your_stripe_secret
  STRIPE_WEBHOOK_SECRET=your_webhook_secret
  STRIPE_PREMIUM_PRICE_ID=your_price_id
  STRIPE_PREMIUM_PLUS_PRICE_ID=your_price_id
  FRONTEND_URL=https://your-frontend-domain.com
  EMAIL_FROM=noreply@yourdomain.com
  ```
- [ ] Deploy backend
- [ ] Test API endpoints
- [ ] Check logs for errors

### Alternative Hosting (Render)
- [ ] Sign up at render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Set build command: `cd backend && npm install`
- [ ] Set start command: `cd backend && npm start`
- [ ] Add environment variables (same as above)
- [ ] Deploy

## Frontend Deployment

### Vercel Deployment
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Select frontend folder
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Root directory: `frontend`
- [ ] Add environment variable (if needed):
  ```
  VITE_API_URL=https://your-backend-domain.com
  ```
- [ ] Deploy
- [ ] Test the live site
- [ ] Check browser console for errors

### Alternative (Netlify)
- [ ] Sign up at netlify.com
- [ ] New site from Git
- [ ] Select repository
- [ ] Build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/dist`
- [ ] Add environment variables (if needed)
- [ ] Deploy

## Stripe Configuration

### Create Products
- [ ] Log in to Stripe Dashboard
- [ ] Create Premium product ($9.99/month)
- [ ] Create Premium Plus product ($19.99/month)
- [ ] Copy Price IDs
- [ ] Add to backend environment variables

### Setup Webhooks
- [ ] In Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://your-backend-domain.com/api/subscriptions/webhook`
- [ ] Select events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Copy webhook signing secret
- [ ] Add to backend environment variables

## Domain Setup

### Custom Domain (Optional but Recommended)
- [ ] Purchase domain (Namecheap, GoDaddy, etc.)
- [ ] Add domain to Vercel/Netlify
- [ ] Configure DNS records
- [ ] Update FRONTEND_URL in backend .env
- [ ] Update Stripe webhooks with new domain
- [ ] Test HTTPS

## Post-Deployment Testing

### Backend Tests
- [ ] Health check: `GET /api/health`
- [ ] Register new user
- [ ] Login
- [ ] Create family
- [ ] Add family member
- [ ] Upload image (test Cloudinary)
- [ ] Create event
- [ ] Test authentication
- [ ] Check database for data

### Frontend Tests
- [ ] Visit homepage
- [ ] Register account
- [ ] Login
- [ ] Create family
- [ ] Navigate all pages
- [ ] Test mobile responsiveness
- [ ] Check console for errors
- [ ] Test on different browsers

### Payment Tests
- [ ] Use Stripe test card: 4242 4242 4242 4242
- [ ] Test checkout flow
- [ ] Verify webhook received
- [ ] Check database for subscription update
- [ ] Test subscription cancellation

### Email Tests
- [ ] Register new user (verification email)
- [ ] Test password reset
- [ ] Test invitation emails
- [ ] Check spam folder if not receiving

## Monitoring & Maintenance

### Setup Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up analytics (Google Analytics)
- [ ] Monitor API response times
- [ ] Track database performance

### Regular Maintenance
- [ ] Monitor error logs daily
- [ ] Check database size weekly
- [ ] Review user feedback
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Test all features after updates

## Security Checklist

- [ ] HTTPS enabled on both frontend and backend
- [ ] Strong JWT secrets set
- [ ] MongoDB not publicly accessible (authentication required)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment variables secured (not in code)
- [ ] File upload size limits set
- [ ] Input validation on all endpoints
- [ ] Password hashing enabled
- [ ] Helmet security headers active

## Performance Optimization

- [ ] Enable gzip compression on backend
- [ ] Optimize images with Cloudinary
- [ ] Add database indexes
- [ ] Enable Redis caching (optional)
- [ ] Use CDN for static files
- [ ] Minify frontend assets
- [ ] Lazy load images
- [ ] Code splitting (already done by Vite)

## Legal & Compliance

- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Add Cookie Consent banner
- [ ] GDPR compliance (if targeting EU)
- [ ] Add data export functionality
- [ ] Add account deletion feature
- [ ] Backup user data policy

## Marketing & Launch

- [ ] Create social media accounts
- [ ] Prepare launch announcement
- [ ] Set up email marketing (Mailchimp)
- [ ] Create demo video
- [ ] Write blog post about features
- [ ] Submit to Product Hunt
- [ ] Share on Reddit (r/genealogy)
- [ ] Reach out to genealogy communities
- [ ] Create landing page content
- [ ] SEO optimization

## Support Setup

- [ ] Set up support email
- [ ] Create help documentation
- [ ] Add FAQ section
- [ ] Set up chat support (optional)
- [ ] Create video tutorials
- [ ] Prepare common responses

## Scaling Considerations

When you start getting users:

- [ ] Monitor server resources
- [ ] Upgrade database tier if needed
- [ ] Consider Redis for caching
- [ ] Implement CDN for images
- [ ] Add load balancer (if needed)
- [ ] Optimize database queries
- [ ] Consider microservices (future)
- [ ] Implement background jobs for emails

## Backup Strategy

- [ ] Automated MongoDB backups (MongoDB Atlas)
- [ ] Cloudinary has automatic backups
- [ ] Keep copy of code in GitHub
- [ ] Document restore procedures
- [ ] Test backup restoration regularly

## Success Metrics to Track

- [ ] Daily active users
- [ ] New signups per day
- [ ] Conversion rate (free to paid)
- [ ] Average family size
- [ ] Photos uploaded per day
- [ ] Monthly recurring revenue
- [ ] Churn rate
- [ ] User engagement time
- [ ] Feature usage statistics

## Troubleshooting Common Issues

### Can't connect to MongoDB
- Check connection string format
- Verify IP whitelist
- Check database user credentials
- Test from local machine first

### Images not uploading
- Verify Cloudinary credentials
- Check file size limits
- Verify CORS settings
- Check cloudinary console for errors

### Stripe payments not working
- Use test mode first
- Verify API keys
- Check webhook endpoint
- Test with Stripe test cards

### Emails not sending
- Verify SendGrid API key
- Check email from address
- Look for errors in logs
- Test with a simple email first

---

## 🎉 Final Steps

Once everything is checked:

1. Announce your launch! 🎊
2. Monitor closely for first week
3. Gather user feedback
4. Iterate and improve
5. Scale as needed

**Congratulations on deploying your Family Tree website!** 🌳

---

Need help? Review the documentation:
- [README.md](./README.md)
- [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- [QUICKSTART.md](./QUICKSTART.md)
