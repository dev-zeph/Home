-- Fix RLS policies for messaging system
-- This enables users to create and read message threads and messages

-- === MESSAGE THREADS POLICIES ===

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can read own message threads" ON message_threads;
DROP POLICY IF EXISTS "Users can create message threads" ON message_threads;

-- Create proper policies for message_threads
CREATE POLICY "Users can read message threads they participate in" ON message_threads
  FOR SELECT USING (
    auth.uid() = property_owner_id OR auth.uid() = tenant_id
  );

CREATE POLICY "Users can create message threads" ON message_threads
  FOR INSERT WITH CHECK (
    auth.uid() = property_owner_id OR auth.uid() = tenant_id
  );

-- === MESSAGES POLICIES ===

-- Drop existing restrictive policies if they exist  
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;

-- Create proper policies for messages
CREATE POLICY "Users can read messages in their threads" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads 
      WHERE message_threads.id = messages.thread_id 
      AND (message_threads.property_owner_id = auth.uid() OR message_threads.tenant_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their threads" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM message_threads 
      WHERE message_threads.id = messages.thread_id 
      AND (message_threads.property_owner_id = auth.uid() OR message_threads.tenant_id = auth.uid())
    )
  );

-- === VERIFY THE POLICIES ===
SELECT 'Updated policies:' as info;

SELECT 'message_threads' as table_name, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'message_threads'
UNION ALL
SELECT 'messages' as table_name, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY table_name, cmd;
