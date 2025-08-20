-- Check RLS policies for messaging tables
-- This will help identify what's blocking message sending

-- Check message_threads table policies
SELECT 'message_threads' as table_name, schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'message_threads'
UNION ALL
-- Check messages table policies  
SELECT 'messages' as table_name, schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY table_name, cmd;
