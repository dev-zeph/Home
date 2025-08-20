-- Get your user ID
-- Run this first to find your user ID, then use it in the debug script

SELECT 
    id as user_id,
    email,
    username,
    display_name
FROM users 
WHERE email = 'zephchizulu@gmail.com';

-- Alternative: Get both user IDs
SELECT 
    id as user_id,
    email,
    username,
    display_name
FROM users 
WHERE email IN ('zephchizulu@gmail.com', 'softboyceo@gmail.com')
ORDER BY email;
