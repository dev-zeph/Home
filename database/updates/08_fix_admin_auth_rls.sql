-- Fix Admin Authentication RLS Policies
-- Run this in Supabase SQL Editor to fix admin login issues

-- First, let's check current state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- The issue is that users can't read their own profiles due to missing RLS policies
-- Let's add the necessary policies for users table

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow role check for authentication" ON public.users;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow new user profile creation (for the trigger)
CREATE POLICY "Enable insert for authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure properties can be read by everyone for the home page
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (status = 'active' AND verified = true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'properties');

-- Test query that should now work for authenticated users
SELECT id, email, role 
FROM users 
WHERE id = auth.uid();

-- Test query for properties (should work for everyone)
SELECT count(*) 
FROM properties 
WHERE status = 'active' AND verified = true;

DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been fixed!';
    RAISE NOTICE '1. Users can now read their own profiles';
    RAISE NOTICE '2. Admin authentication should work';
    RAISE NOTICE '3. Home page should load properties correctly';
    RAISE NOTICE 'Try refreshing the home page and admin login.';
END $$;
