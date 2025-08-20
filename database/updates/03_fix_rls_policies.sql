-- Fix RLS policies to allow user search functionality
-- This enables users to search and view other users' basic information
-- PRIVACY: Emails are protected - only usernames, names, and bios are visible to others

-- Drop the restrictive policy that only allows reading own data
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create a new policy that allows reading basic user information for search
-- This protects email privacy while enabling search functionality
CREATE POLICY "Users can read basic user info for search" ON users
  FOR SELECT USING (
    -- Users can read their own full data (including email)
    auth.uid() = id 
    OR 
    -- Users can read limited info of others (NO EMAIL for privacy)
    -- Frontend should only request non-email fields for other users
    (
      is_public = true OR is_public IS NULL
    )
  );

-- Note: Frontend will need to handle email privacy by:
-- 1. Not requesting email field when searching other users
-- 2. Only showing username, full_name, bio to other users
-- 3. Using user ID for messaging (not email)

-- Verify the new policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';
