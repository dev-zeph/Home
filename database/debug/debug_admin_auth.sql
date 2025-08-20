-- Debug Admin Authentication Issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- Step 1: Check if RLS is enabled on users table
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Step 2: Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 3: Check if your admin user exists and has correct role
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE email = 'zephchizulu@gmail.com';

-- Step 4: Test if you can query users table as authenticated user
-- (This should work after applying the RLS fix)
SELECT current_user, auth.uid(), auth.role();

-- Step 5: Check properties table policies for home page
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- Step 6: Check if there are any verified properties for home page
SELECT count(*) as total_properties,
       count(*) FILTER (WHERE verified = true) as verified_properties,
       count(*) FILTER (WHERE status = 'active') as active_properties,
       count(*) FILTER (WHERE verified = true AND status = 'active') as live_properties
FROM properties;

-- Step 7: If RLS policies don't exist, create them
DO $$
BEGIN
    -- Create users policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id)';
        RAISE NOTICE 'Created users view policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
        RAISE NOTICE 'Created users update policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Enable insert for authenticated users'
    ) THEN
        EXECUTE 'CREATE POLICY "Enable insert for authenticated users" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
        RAISE NOTICE 'Created users insert policy';
    END IF;
    
    -- Create properties policy for public viewing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' AND policyname = 'Properties are viewable by everyone'
    ) THEN
        EXECUTE 'CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT TO anon, authenticated USING (status = ''active'' AND verified = true)';
        RAISE NOTICE 'Created properties public view policy';
    END IF;
    
    RAISE NOTICE 'All necessary RLS policies are now in place!';
END $$;
