-- Create Admin User or Promote Existing User to Admin
-- Run this in Supabase SQL Editor

-- Option 1: Update existing user to admin by email
UPDATE users 
SET role = 'admin' 
WHERE email = 'softboyceo@gmail.com';

-- Option 2: Check if user exists and their current role
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE email = 'softboyceo@gmail.com';

-- Option 3: Create a sample admin user (update with your details)
-- Note: You'll need to sign up through Supabase Auth first, then run the UPDATE above

-- Verify admin users
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE role = 'admin';
