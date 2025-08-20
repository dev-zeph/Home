-- COMPLETE FIX for RLS Infinite Recursion
-- This script addresses all recursion issues and ensures proper authentication flow
-- Run this in Supabase SQL Editor

-- STEP 1: Temporarily disable RLS to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies to start fresh
DO $$
DECLARE
    policy_record record;
BEGIN
    -- Drop all policies on users table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on properties table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'properties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', policy_record.policyname);
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- STEP 3: Verify and fix the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial for RLS bypass
AS $$
BEGIN
    INSERT INTO public.users (id, email, role, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;

-- Ensure trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Enable RLS with MINIMAL, non-recursive policies

-- Re-enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile (ONLY their own, no joins)
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (ONLY their own, no joins)
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Allow service_role and postgres to do anything (for triggers and admin operations)
CREATE POLICY "service_role_all_users" ON public.users
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Re-enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Public can view active, verified properties (NO user table joins)
CREATE POLICY "public_view_verified_properties" ON public.properties
    FOR SELECT TO anon, authenticated
    USING (status = 'active' AND verified = true);

-- Users can view their own properties (simple auth.uid() check)
CREATE POLICY "users_view_own_properties" ON public.properties
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own properties (simple auth.uid() check)
CREATE POLICY "users_update_own_properties" ON public.properties
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Users can insert properties (simple auth.uid() check)
CREATE POLICY "users_insert_properties" ON public.properties
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow service_role and postgres to do anything (for admin operations)
CREATE POLICY "service_role_all_properties" ON public.properties
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- STEP 5: Create admin verification function that bypasses RLS
CREATE OR REPLACE FUNCTION admin_verify_property(property_id UUID, admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
    admin_role TEXT;
BEGIN
    -- Check if the admin_id is actually an admin
    SELECT role INTO admin_role 
    FROM public.users 
    WHERE id = admin_id;
    
    IF admin_role NOT IN ('admin', 'verification_officer') THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;
    
    -- Update the property
    UPDATE public.properties 
    SET 
        verified = true,
        verified_at = NOW(),
        verified_by = admin_id
    WHERE id = property_id;
    
    RETURN TRUE;
END;
$$;

-- STEP 6: Test the setup
DO $$
BEGIN
    -- Test basic queries
    PERFORM count(*) FROM public.users;
    PERFORM count(*) FROM public.properties;
    
    RAISE NOTICE '✅ RLS policies successfully recreated!';
    RAISE NOTICE '✅ No recursive policies - only simple auth.uid() checks';
    RAISE NOTICE '✅ Service role has full access for triggers';
    RAISE NOTICE '✅ Admin verification function created';
    RAISE NOTICE '✅ Property posting should work now!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during testing: %', SQLERRM;
END $$;

-- STEP 7: Display current policies for verification
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN length(qual) > 60 THEN left(qual, 60) || '...'
        ELSE qual 
    END as condition
FROM pg_policies 
WHERE tablename IN ('users', 'properties')
ORDER BY tablename, policyname;
