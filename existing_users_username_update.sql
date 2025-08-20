-- Update existing users with usernames
-- This script adds usernames to specific existing users who signed up before username feature

-- Update zephchizulu@gmail.com with username 'zeph'
UPDATE users 
SET username = 'zeph'
WHERE email = 'zephchizulu@gmail.com' AND username IS NULL;

-- Update softboyceo@gmail.com with username 'zulu'  
UPDATE users 
SET username = 'zulu'
WHERE email = 'softboyceo@gmail.com' AND username IS NULL;

-- Verify the updates
SELECT 
    email,
    username,
    display_name,
    role,
    created_at
FROM users 
WHERE email IN ('zephchizulu@gmail.com', 'softboyceo@gmail.com')
ORDER BY email;
