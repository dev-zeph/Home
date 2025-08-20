# NG Rentals Database Setup

This directory contains the SQL files needed to set up the complete NG Rentals database with social features.

## Setup Order

Run these files in **this exact order** in your Supabase SQL Editor:

### 1. Foundation Schema
**File:** `schema_01_foundation.sql`
**Purpose:** Creates the basic rental marketplace tables
**Contains:**
- Users table (extends Supabase auth)
- Properties table with location and details
- Property media/images
- Applications and leases
- Invoices and payments
- Basic message threads system
- Row Level Security (RLS) policies

### 2. Social Features Schema
**File:** `schema_02_social_features.sql`
**Purpose:** Adds social networking and analytics features
**Contains:**
- User following system (`follows` table)
- Property view tracking (`property_views` table)
- User notifications (`user_notifications` table)
- Additional user profile fields (bio, avatar, etc.)
- Property view counting
- Automatic follower count updates
- Enhanced RLS policies

### 3. Sample Data
**File:** `seed_01_sample_data.sql`
**Purpose:** Populates tables with test data
**Contains:**
- Sample property views and analytics
- User profile information
- Follow relationships between users
- Message threads and messages
- Sample notifications
- View count updates for properties

### 4. Verification
**File:** `verification_01_check_setup.sql`
**Purpose:** Verify all setup was successful
**Contains:**
- Column existence checks
- Table creation verification
- Index and policy verification
- Sample data count checks

## Important Notes

1. **Run in order** - Each file builds on the previous one
2. **Foundation first** - `schema_01_foundation.sql` creates the base structure
3. **Safe to re-run** - All files use `IF NOT EXISTS` and similar safe patterns
4. **Check messages** - Supabase will show success/error messages for each operation

## Troubleshooting

If you encounter errors:
1. Check the exact error message in Supabase
2. Run `verification_01_check_setup.sql` to see what was created successfully
3. Files can be re-run safely if needed

## What's Created

After running all files, you'll have:
- Complete rental marketplace backend
- User authentication and profiles
- Property listings with media
- Social features (following, messaging)
- Property view analytics
- Notification system
- Sample data for testing

Perfect for developing the React frontend with all the enhanced dashboard features!
