-- EMERGENCY: Drop All Recursive Policies Causing Infinite Loops
-- These policies are still present and causing RLS recursion
-- Run this in Supabase SQL Editor IMMEDIATELY

-- Drop the recursive admin policies on properties table
DROP POLICY IF EXISTS "Admins can update property verification" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;

-- Drop the recursive admin policies on users table
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can read basic user info for search" ON public.users;

-- Drop any duplicate policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can read active properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Check what policies are left
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
    RAISE NOTICE '🚨 EMERGENCY: Dropped all recursive admin policies!';
    RAISE NOTICE '✅ Remaining policies should be non-recursive';
    RAISE NOTICE 'Current safe policies:';
    RAISE NOTICE '- users_own_select (users can see own profile)';
    RAISE NOTICE '- users_own_update (users can update own profile)';
    RAISE NOTICE '- service_role_insert_users (for new user creation)';
    RAISE NOTICE '- public_view_properties (public can see active+verified)';
    RAISE NOTICE '- owner_view_properties (owners see own properties)';
    RAISE NOTICE '- owner_update_properties (owners update own properties)';
    RAISE NOTICE '- authenticated_create_properties (users can create)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Admin features will now work via JS checks, not RLS';
    RAISE NOTICE 'Try the app again - recursion should be fixed!';
END $$;
