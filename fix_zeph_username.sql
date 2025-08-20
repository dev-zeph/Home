-- Fix username for zephchizulu@gmail.com (force update)
-- This will override the existing username with the desired one

-- Update zephchizulu@gmail.com with username 'zeph' (force update)
UPDATE users 
SET username = 'zeph'
WHERE email = 'zephchizulu@gmail.com';

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
