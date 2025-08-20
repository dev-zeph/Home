# NG Rentals Database Structure

This folder contains all SQL scripts organized by purpose and execution order.

## 📁 Structure

### `/core/` - Initial Database Setup
Execute these files in order for fresh database setup:

1. **`01_foundation_schema.sql`** - Core tables (users, properties, applications, etc.)
2. **`02_social_features_schema.sql`** - Social features (follows, notifications, views)
3. **`03_sample_data_seed.sql`** - Sample data for testing
4. **`04_verify_setup.sql`** - Verification queries to ensure setup is correct

### `/updates/` - Schema Migrations & Updates
Apply these incrementally as needed:

1. **`01_add_username_system.sql`** - Adds username column to users table
2. **`02_existing_users_username_migration.sql`** - Migrates existing users to username system
3. **`03_fix_rls_policies.sql`** - General RLS policy fixes
4. **`04_fix_social_features_rls.sql`** - RLS fixes for follows, views, notifications
5. **`05_fix_messaging_rls.sql`** - RLS fixes for messaging system
6. **`06_make_property_id_nullable.sql`** - Allows direct messaging without property context
7. **`07_add_admin_system.sql`** - Adds comprehensive admin system for property verification
8. **`08_fix_admin_auth_rls.sql`** - Fixes admin authentication RLS policies
9. **`09_fix_rls_recursion.sql`** - Fixes infinite recursion in RLS policies (IMPORTANT: Run this if you get recursion errors)

### `/debug/` - Testing & Debugging
Use these for troubleshooting and testing:

- **`debug_user_search.sql`** - Debug user search functionality
- **`test_search_functionality.sql`** - Test search queries
- **`test_follows_system.sql`** - Test follows/social features
- **`test_privacy_safe_search.sql`** - Test privacy-safe search
- **`check_messaging_rls_policies.sql`** - Check messaging RLS policies
- **`get_current_user_id.sql`** - Helper to get current user ID

## 🚀 Quick Setup

For a **fresh database**:
```bash
# Execute in Supabase SQL Editor in order:
1. Run: database/core/01_foundation_schema.sql
2. Run: database/core/02_social_features_schema.sql
3. Run: database/core/03_sample_data_seed.sql
4. Verify: database/core/04_verify_setup.sql
```

For **updating existing database**:
```bash
# Run updates as needed based on your current state
# Check Activity.json for which updates have been applied
```

## 👑 Admin Access Setup

### Method 1: Create New Admin Account
1. Navigate to `/admin/signup` in your browser
2. Fill out the signup form - account will be created with admin role
3. Login at `/admin/login`

### Method 2: Promote Existing User to Admin
1. Run `database/updates/07_create_admin_user.sql` in Supabase SQL Editor
2. Update the email address in the script to match your account
3. Access admin panel at `/admin/login`

**Admin Features:**
- View all properties (verified and unverified)
- Verify/unverify property listings
- Email property owners with feedback
- 30-minute idle session timeout for security

## 📝 Notes

- **RLS Policies**: Most files include Row Level Security policies for proper access control
- **Error Handling**: All scripts include error handling and verification steps
- **Rollback**: Keep backups before running updates
- **Dependencies**: Some updates depend on previous updates being applied

## 🔍 Activity Log

See `Activity.json` in the root directory for detailed logs of which scripts have been executed and when.
