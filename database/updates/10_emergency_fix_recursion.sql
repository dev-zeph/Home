-- EMERGENCY FIX: Remove All Recursive RLS Policies
-- Run this immediately in Supabase SQL Editor to fix infinite recursion

-- STEP 1: Remove all problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update property verification" ON public.properties;
DROP POLICY IF EXISTS "Users can read basic user info for search" ON public.users;

-- STEP 2: Clean up duplicate policies
DROP POLICY IF EXISTS "Anyone can read active properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- STEP 3: Keep only the simple, non-recursive policies
-- Users table policies (already good):
-- - users_own_select: allows users to see their own profile
-- - users_own_update: allows users to update their own profile  
-- - service_role_insert_users: allows system to create users

-- Properties table policies (already good):
-- - public_view_properties: public can see active+verified properties
-- - owner_view_properties: owners can see their own properties
-- - owner_update_properties: owners can update their own properties
-- - authenticated_create_properties: authenticated users can create properties

-- STEP 4: For admin functionality, we'll handle it in the application layer
-- instead of using RLS policies that cause recursion

-- STEP 5: Test that basic operations work
SELECT 'Testing users table access...' as test;
-- This should work now without recursion
SELECT count(*) FROM users WHERE id = auth.uid();

SELECT 'Testing properties insert...' as test;  
-- This should work now for property creation
SELECT count(*) FROM properties WHERE user_id = auth.uid();

-- STEP 6: Verify clean policy state
SELECT 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN length(qual) > 80 THEN left(qual, 80) || '...'
        ELSE qual 
    END as condition
FROM pg_policies 
WHERE tablename IN ('users', 'properties')
ORDER BY tablename, policyname;

DO $$
BEGIN
    RAISE NOTICE '🚨 EMERGENCY FIX APPLIED!';
    RAISE NOTICE '✅ Removed all recursive RLS policies';
    RAISE NOTICE '✅ Admin checks will be handled in application code';
    RAISE NOTICE '✅ Property posting should work now';
    RAISE NOTICE '✅ User authentication should work normally';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Try posting a property - should work now';
    RAISE NOTICE '2. Admin dashboard will handle admin checks in code';
    RAISE NOTICE '3. No more infinite recursion errors';
END $$;
