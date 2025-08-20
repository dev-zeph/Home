# NG Rentals - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free at vercel.com)
- [ ] Supabase project with database setup complete

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - NG Rentals ready for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/ng-rentals.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to https://vercel.com and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `/` (leave as default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd frontend && npm install`

### 4. Environment Variables
In Vercel dashboard, add these environment variables:
- `REACT_APP_SUPABASE_URL` = Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` = Your Supabase anon key

### 5. Domain Configuration (Optional)
- In Vercel dashboard > Domains
- Add your custom domain
- Configure DNS as instructed

## 🔧 Build Configuration

The project includes:
- ✅ `vercel.json` for routing configuration
- ✅ `package.json` with vercel-build script
- ✅ Optimized for static deployment
- ✅ Environment variables configured

## 🌐 Post-Deployment
1. Test all features:
   - [ ] User registration/login
   - [ ] Property posting
   - [ ] Dashboard functionality
   - [ ] Admin panel
2. Update Supabase auth redirect URLs
3. Monitor performance and errors

## 🚨 Important Notes
- Ensure your Supabase RLS policies are properly configured
- Test the admin login functionality
- Verify all API calls work in production
- Monitor for any CORS issues

## 📱 Mobile Optimization
The app is built with Carbon Design System and is mobile-responsive by default.

## 🔒 Security
- Environment variables are secure in Vercel
- Supabase handles authentication
- RLS policies protect data access
