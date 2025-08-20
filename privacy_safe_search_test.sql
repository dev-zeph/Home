-- Test privacy-focused search functionality
-- This tests search without exposing emails

-- Test 1: Search by username only (no email exposed)
SELECT 
    id,
    username,
    full_name,
    bio
FROM users 
WHERE username ILIKE '%zulu%'
  AND id != 'b767374e-bd62-4f0d-8bf9-0b8acaddc60e'  -- Your user ID
LIMIT 10;

-- Test 2: Search by full name only
SELECT 
    id,
    username,
    full_name,
    bio
FROM users 
WHERE full_name ILIKE '%zulu%'
  AND id != 'b767374e-bd62-4f0d-8bf9-0b8acaddc60e'
LIMIT 10;

-- Test 3: Combined search (username OR full_name)
SELECT 
    id,
    username,
    full_name,
    bio
FROM users 
WHERE (username ILIKE '%zulu%' OR full_name ILIKE '%zulu%')
  AND id != 'b767374e-bd62-4f0d-8bf9-0b8acaddc60e'
LIMIT 10;

-- Test 4: Search for 'zeph'
SELECT 
    id,
    username,
    full_name,
    bio
FROM users 
WHERE (username ILIKE '%zeph%' OR full_name ILIKE '%zeph%')
  AND id != 'b767374e-bd62-4f0d-8bf9-0b8acaddc60e'
LIMIT 10;
