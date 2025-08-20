-- Verification script to check if enhanced schema was applied correctly
-- Run this in Supabase SQL Editor to verify all changes

-- Check if new columns were added to existing tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'properties') 
  AND column_name IN ('bio', 'avatar_url', 'follower_count', 'following_count', 'is_public', 'full_name', 'username', 'view_count')
ORDER BY table_name, column_name;

-- Check if new tables were created
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name IN ('follows', 'property_views', 'messages', 'user_notifications')
  AND table_schema = 'public';

-- Check if indexes were created
SELECT indexname, tablename
FROM pg_indexes 
WHERE tablename IN ('follows', 'property_views', 'messages', 'user_notifications')
  AND schemaname = 'public';

-- Check if RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('follows', 'property_views', 'messages', 'user_notifications');

-- Check if functions and triggers were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_follower_counts', 'update_property_view_count')
  AND routine_schema = 'public';

SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_update_follower_counts', 'trigger_update_property_view_count');

-- Sample data verification (if seed was run)
SELECT 'follows' as table_name, COUNT(*) as record_count FROM follows
UNION ALL
SELECT 'property_views', COUNT(*) FROM property_views  
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'user_notifications', COUNT(*) FROM user_notifications;
