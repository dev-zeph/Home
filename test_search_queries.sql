-- Test the exact search queries that should work
-- Run these one by one and show me the results

-- Query 4: Search with user exclusion (this is what the frontend uses)
SELECT 
    id,
    username,
    email,
    full_name,
    phone,
    bio
FROM users 
WHERE (username ILIKE '%zulu%' OR full_name ILIKE '%zulu%' OR email ILIKE '%zulu%')
  AND id != 'b767374e-bd62-4f0d-8bf9-0b8acaddc60e'  
LIMIT 10;

-- Query 5: Search without exclusion filter
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

-- Query 6: Test searching for 'zeph'
SELECT 
    id,
    username,
    email,
    full_name,
    phone,
    bio
FROM users 
WHERE (username ILIKE '%zeph%' OR full_name ILIKE '%zeph%' OR email ILIKE '%zeph%')
LIMIT 10;

-- Query 7: Test RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';
