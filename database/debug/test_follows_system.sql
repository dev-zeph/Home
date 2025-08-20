-- Check RLS policies for follows table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'follows';

-- Test if follows table is accessible
SELECT COUNT(*) as follow_count FROM follows;

-- Check if RLS is enabled on follows table
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'follows';

-- Test inserting a follow relationship with your actual user IDs
-- First get the other user's ID
SELECT id, username, email FROM users WHERE username = 'zulu';

-- Test follow functionality (replace OTHER_USER_ID with the actual ID from above)
-- INSERT INTO follows (follower_id, following_id) VALUES 
-- ('b767374e-bd62-4f0d-8bf9-0b8acaddc60e', 'OTHER_USER_ID_HERE');

-- Test if you can read follows
SELECT f.*, 
       follower.username as follower_username,
       following.username as following_username
FROM follows f
LEFT JOIN users follower ON f.follower_id = follower.id
LEFT JOIN users following ON f.following_id = following.id;
