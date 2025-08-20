-- Username System Update Script
-- Run this ONLY if you need to add username functionality to existing database
-- DO NOT run the full schema files again if they've already been executed

-- Add username column to users table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        RAISE NOTICE 'Username column and index added successfully';
    ELSE
        RAISE NOTICE 'Username column already exists, skipping...';
    END IF;
END $$;

-- Update existing sample users with usernames (optional - only if you want sample data)
DO $$
DECLARE
    owner_id UUID;
    tenant_id UUID;
BEGIN
    -- Update owner profile with username
    SELECT id INTO owner_id FROM users WHERE role = 'owner' AND username IS NULL LIMIT 1;
    IF owner_id IS NOT NULL THEN
        UPDATE users SET 
            username = 'property_pro_lagos',
            full_name = COALESCE(full_name, 'Ibrahim Property Solutions'),
            bio = COALESCE(bio, 'Professional property investor with 5+ years experience in Lagos real estate market.')
        WHERE id = owner_id;
        RAISE NOTICE 'Owner profile updated with username';
    END IF;
    
    -- Update tenant profile with username
    SELECT id INTO tenant_id FROM users WHERE role = 'tenant' AND username IS NULL LIMIT 1;
    IF tenant_id IS NOT NULL THEN
        UPDATE users SET 
            username = 'tenant_seeker_ng',
            full_name = COALESCE(full_name, 'Adaora Okafor'),
            bio = COALESCE(bio, 'Looking for quality rental properties in Abuja and Lagos areas.')
        WHERE id = tenant_id;
        RAISE NOTICE 'Tenant profile updated with username';
    END IF;
    
    IF owner_id IS NULL AND tenant_id IS NULL THEN
        RAISE NOTICE 'No users found to update or all users already have usernames';
    END IF;
END $$;

-- Verify the changes
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'username';
