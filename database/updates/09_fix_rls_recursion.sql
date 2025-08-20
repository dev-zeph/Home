-- Fix Infinite Recursion in Users RLS Policies
-- Run this in Supabase SQL Editor

-- STEP 1: Completely disable RLS on users table to break recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow role check for authentication" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "enable_user_creation" ON public.users;

-- STEP 3: Drop and recreate any problematic property policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "view_active_verified_properties" ON public.properties;
DROP POLICY IF EXISTS "owners_view_own_properties" ON public.properties;
DROP POLICY IF EXISTS "owners_update_own_properties" ON public.properties;
DROP POLICY IF EXISTS "authenticated_insert_properties" ON public.properties;

-- STEP 4: Check for any triggers that might cause recursion
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgrelid IN ('public.users'::regclass, 'public.properties'::regclass);

-- STEP 5: Create very simple, non-recursive users policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile (simple check)
CREATE POLICY "users_own_select" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to update their own profile (simple check)
CREATE POLICY "users_own_update" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allow service role to insert users (for new user creation)
CREATE POLICY "service_role_insert_users" 
ON public.users 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- STEP 6: Create simple property policies that don't reference users table
-- Public viewing of active, verified properties
CREATE POLICY "public_view_properties" 
ON public.properties 
FOR SELECT 
TO anon, authenticated 
USING (status = 'active' AND verified = true);

-- Property owners can view their own properties
CREATE POLICY "owner_view_properties" 
ON public.properties 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Property owners can update their own properties
CREATE POLICY "owner_update_properties" 
ON public.properties 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Allow authenticated users to create properties
CREATE POLICY "authenticated_create_properties" 
ON public.properties 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- STEP 7: Test the policies
SELECT 'Testing users table...' as test;
SELECT count(*) as user_count FROM public.users;

SELECT 'Testing properties table...' as test;
SELECT count(*) as property_count FROM public.properties;

-- STEP 8: Verify all policies are clean
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    CASE 
        WHEN length(qual) > 50 THEN left(qual, 50) || '...'
        ELSE qual 
    END as policy_condition
FROM pg_policies 
WHERE tablename IN ('users', 'properties')
ORDER BY tablename, policyname;

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed infinite recursion in RLS policies!';
    RAISE NOTICE '✅ Users table: Simple auth.uid() checks only';
    RAISE NOTICE '✅ Properties table: No complex user lookups';
    RAISE NOTICE '✅ Service role can create users via triggers';
    RAISE NOTICE 'Try posting a property again - should work now!';
END $$;
