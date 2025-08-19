# Supabase Database Setup Guide

## ⚠️ Important: Fixed Schema Issues

If you got the error `column "owner_id" does not exist`, I've fixed all the schema issues. Please use the updated files.

## Steps to Create the Database Schema

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in to your account
2. Select your project: **kazehgcfgvhwlckfjjzr** (based on your URL)
3. Navigate to the **SQL Editor** from the left sidebar

### 2. Run the Schema Script
1. In the SQL Editor, click **"New Query"**
2. Copy the entire contents of `supabase_schema.sql` 
3. Paste it into the SQL editor
4. Click **"Run"** to execute the schema

### 3. Add Sample Data (Optional)
For testing purposes, you can add sample data:
1. Use `supabase_seed_fixed.sql` instead of the original seed file
2. This version includes hardcoded UUIDs that work without requiring existing users
3. Copy and paste the content into a new SQL query and run it

### 4. Create Storage Bucket for Property Media
After running the schema, you need to create a storage bucket:

1. Go to **Storage** in the left sidebar
2. Click **"Create Bucket"**
3. Name it: `property-media`
4. Make it **Public** (check the public option)
5. Click **Create**

### 5. Set Storage Policies
1. Click on the `property-media` bucket
2. Go to **Policies** tab
3. Add these policies:

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'property-media');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-media' AND auth.role() = 'authenticated');
```

**Policy 3: Users can update their own files**
```sql
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Verify Setup
1. Go to **Table Editor** in the sidebar
2. You should see all these tables:
   - users
   - owner_profiles
   - properties
   - property_media
   - applications
   - leases
   - invoices
   - payments
   - message_threads
   - messages
   - audit_logs

### 6. Optional: Add Sample Data
After the schema is created, you can run the `supabase_seed.sql` file to add sample data for testing.

### 7. Verify RLS Policies
1. Go to **Authentication > Policies**
2. You should see policies for each table ensuring proper security

## Important Notes

- **Row Level Security (RLS)** is enabled on all tables for security
- **Authentication** is handled by Supabase Auth automatically
- **Storage** bucket is needed for property images/videos
- **Triggers** automatically handle user creation and timestamp updates
- **Indexes** are created for better query performance

## Troubleshooting

If you encounter errors:
1. Check that all extensions are enabled
2. Ensure you're running the script in the correct order
3. Verify your Supabase project has the necessary permissions
4. Check the Supabase logs for detailed error messages

## Next Steps

After setting up the database:
1. Test the connection from your React app
2. Run the seed data script for sample properties
3. Test user registration and property creation
4. Verify media upload functionality
