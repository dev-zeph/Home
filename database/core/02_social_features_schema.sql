-- Enhanced NG Rentals Database Schema (CORRECTED)
-- Updated for user following system and property view tracking
-- Builds on the existing supabase_schema.sql foundation
-- This version works with existing message_threads system

-- Update existing properties table to add view tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update existing users table for social features
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create unique index on username for faster searches
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create follows table for user following system
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a user can't follow the same person twice
    UNIQUE(follower_id, following_id),
    
    -- Ensure a user can't follow themselves
    CHECK (follower_id != following_id)
);

-- Create property_views table for tracking property views
CREATE TABLE IF NOT EXISTS property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_follower', 'property_view', 'message', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB, -- Additional data for the notification
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
DROP POLICY IF EXISTS "Users can view follows they're involved in" ON follows;
CREATE POLICY "Users can view follows they're involved in" ON follows
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = following_id
    );

DROP POLICY IF EXISTS "Users can create follows" ON follows;
CREATE POLICY "Users can create follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
CREATE POLICY "Users can delete their own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for property_views table
DROP POLICY IF EXISTS "Property owners can view their property views" ON property_views;
CREATE POLICY "Property owners can view their property views" ON property_views
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can create property views" ON property_views;
CREATE POLICY "Anyone can create property views" ON property_views
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON user_notifications;
CREATE POLICY "Users can view their own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;
CREATE POLICY "Users can update their own notifications" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_id ON property_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- Functions for updating counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE users SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        -- Increment follower count for the followed user
        UPDATE users SET follower_count = follower_count + 1 
        WHERE id = NEW.following_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE users SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        
        -- Decrement follower count for the followed user
        UPDATE users SET follower_count = follower_count - 1 
        WHERE id = OLD.following_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating follower counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;
CREATE TRIGGER trigger_update_follower_counts
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

-- Function for updating property view counts
CREATE OR REPLACE FUNCTION update_property_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties 
    SET view_count = view_count + 1 
    WHERE id = NEW.property_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating property view counts
DROP TRIGGER IF EXISTS trigger_update_property_view_count ON property_views;
CREATE TRIGGER trigger_update_property_view_count
    AFTER INSERT ON property_views
    FOR EACH ROW
    EXECUTE FUNCTION update_property_view_count();
