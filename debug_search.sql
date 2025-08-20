-- Debug script to test user search functionality
-- Run this to diagnose search issues

-- 1. Check if RLS is enabled on users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Test direct search query (replace USER_ID with your actual user ID)
-- First, get your user ID
SELECT 'Your user ID is: ' || id as info, email, username 
FROM users 
WHERE email = 'zephchizulu@gmail.com';

-- 4. Test the search query that the frontend uses
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from step 3
SELECT 
    id,
    username,
    email,
    full_name,
    phone,
    bio
FROM users 
WHERE (username ILIKE '%zulu%' OR full_name ILIKE '%zulu%' OR email ILIKE '%zulu%')
  AND id != 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
LIMIT 10;

-- 5. Test without the exclusion filter
SELECT 
    id,
    username,
    email,
    full_name,
    phone,
    bio
FROM users 
WHERE (username ILIKE '%zulu%' OR full_name ILIKE '%zulu%' OR email ILIKE '%zulu%')
LIMIT 10;

-- 6. Check all users in the database
SELECT 
    email,
    username,
    display_name,
    full_name,
    role
FROM users 
ORDER BY created_at;
