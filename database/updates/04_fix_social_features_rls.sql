-- Fix RLS policies for follows and other social features
-- This enables users to follow each other and interact properly

-- === FOLLOWS TABLE POLICIES ===

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can read own follows" ON follows;
DROP POLICY IF EXISTS "Users can create follows" ON follows;
DROP POLICY IF EXISTS "Users can delete follows" ON follows;

-- Create proper policies for follows
CREATE POLICY "Users can read follows they participate in" ON follows
  FOR SELECT USING (
    auth.uid() = follower_id OR auth.uid() = following_id
  );

CREATE POLICY "Users can create follow relationships" ON follows
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id
  );

CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (
    auth.uid() = follower_id
  );

-- === PROPERTY_VIEWS TABLE POLICIES ===

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create property views" ON property_views;

-- Create policy for property views
CREATE POLICY "Users can create property views" ON property_views
  FOR INSERT WITH CHECK (
    auth.uid() = viewer_id OR viewer_id IS NULL
  );

CREATE POLICY "Property owners can read views of their properties" ON property_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_views.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- === USER_NOTIFICATIONS TABLE POLICIES ===

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;

-- Create policies for notifications
CREATE POLICY "Users can read own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);

-- === VERIFY ALL POLICIES ===
SELECT 'Updated social feature policies:' as info;

SELECT 'follows' as table_name, policyname, cmd
FROM pg_policies WHERE tablename = 'follows'
UNION ALL
SELECT 'property_views' as table_name, policyname, cmd
FROM pg_policies WHERE tablename = 'property_views'
UNION ALL
SELECT 'user_notifications' as table_name, policyname, cmd
FROM pg_policies WHERE tablename = 'user_notifications'
ORDER BY table_name, cmd;
