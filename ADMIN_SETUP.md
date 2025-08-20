# Admin Setup Guide

## Quick Admin Access Setup

### Step 1: Start the Application
```bash
cd frontend
npm start
```

### Step 2: Choose Your Admin Setup Method

#### Option A: Create New Admin Account
1. Go to: `http://localhost:3000/admin/signup`
2. Fill out the form with your admin details
3. Account will automatically have admin privileges

#### Option B: Promote Existing User
1. First, create a regular account at `http://localhost:3000/signup`
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```
3. Go to: `http://localhost:3000/admin/login`

### Step 3: Access Admin Dashboard
- Login at: `http://localhost:3000/admin/login`
- You'll see the property verification dashboard
- Session expires after 30 minutes of inactivity

## Admin Features Available

✅ **Property Verification**
- View all properties (verified/unverified)
- Verify properties to make them public
- Unverify problematic properties

✅ **Owner Communication**
- Click on property owner email
- Compose reasons for rejection
- Send feedback directly

✅ **Security Features**
- 30-minute idle timeout
- Admin-only access to verification features
- Separate admin authentication context

## Troubleshooting

**Can't access admin routes?**
- Ensure you're using `/admin/login` not `/login`
- Check that your user role is 'admin' in the database

**Session expires too quickly?**
- Default is 30 minutes idle time
- This can be adjusted in `AdminAuthContext.js`

**Properties not showing?**
- Check RLS policies are applied from core database setup
- Verify admin user has proper role in database
