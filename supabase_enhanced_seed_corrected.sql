-- Enhanced seed data for testing new features (CORRECTED)
-- Run this after running the enhanced schema

-- Insert some sample property views (for existing properties)
-- Only insert if we have properties
DO $$
BEGIN
    -- Check if we have any properties before inserting views
    IF EXISTS (SELECT 1 FROM properties LIMIT 1) THEN
        INSERT INTO property_views (property_id, viewer_id, ip_address, viewed_at) VALUES 
        (
            (SELECT id FROM properties ORDER BY created_at LIMIT 1),
            NULL, -- Anonymous view
            '192.168.1.100',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        ),
        (
            (SELECT id FROM properties ORDER BY created_at LIMIT 1),
            NULL, -- Anonymous view
            '192.168.1.101',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        );
        
        -- Insert view for second property if it exists
        IF EXISTS (SELECT 1 FROM properties OFFSET 1 LIMIT 1) THEN
            INSERT INTO property_views (property_id, viewer_id, ip_address, viewed_at) VALUES 
            (
                (SELECT id FROM properties ORDER BY created_at OFFSET 1 LIMIT 1),
                NULL, -- Anonymous view
                '192.168.1.102',
                CURRENT_TIMESTAMP - INTERVAL '3 hours'
            );
        END IF;
        
        RAISE NOTICE 'Sample property views inserted successfully';
    ELSE
        RAISE NOTICE 'No properties found - skipping property views';
    END IF;
END
$$;

-- Update existing properties to have some view counts
-- Only update if properties exist
DO $$
DECLARE
    prop1_id UUID;
    prop2_id UUID;
    prop3_id UUID;
BEGIN
    -- Get first property
    SELECT id INTO prop1_id FROM properties ORDER BY created_at LIMIT 1;
    IF prop1_id IS NOT NULL THEN
        UPDATE properties SET view_count = 15 WHERE id = prop1_id;
    END IF;
    
    -- Get second property
    SELECT id INTO prop2_id FROM properties ORDER BY created_at OFFSET 1 LIMIT 1;
    IF prop2_id IS NOT NULL THEN
        UPDATE properties SET view_count = 8 WHERE id = prop2_id;
    END IF;
    
    -- Get third property
    SELECT id INTO prop3_id FROM properties ORDER BY created_at OFFSET 2 LIMIT 1;
    IF prop3_id IS NOT NULL THEN
        UPDATE properties SET view_count = 23 WHERE id = prop3_id;
    END IF;
    
    RAISE NOTICE 'Property view counts updated successfully';
END
$$;

-- Add some user profile information
-- Only update if users exist
DO $$
DECLARE
    owner_id UUID;
    tenant_id UUID;
BEGIN
    -- Update owner profile
    SELECT id INTO owner_id FROM users WHERE role = 'owner' LIMIT 1;
    IF owner_id IS NOT NULL THEN
        UPDATE users SET 
            bio = 'Professional property investor with 5+ years experience in Lagos real estate market.',
            is_public = true
        WHERE id = owner_id;
    END IF;
    
    -- Update tenant profile
    SELECT id INTO tenant_id FROM users WHERE role = 'tenant' LIMIT 1;
    IF tenant_id IS NOT NULL THEN
        UPDATE users SET 
            bio = 'Looking for quality rental properties in Abuja and Lagos areas.',
            is_public = true
        WHERE id = tenant_id;
    END IF;
    
    RAISE NOTICE 'User profiles updated successfully';
END
$$;

-- Sample follows relationships
-- Only insert if we have both owner and tenant users
DO $$
DECLARE
    tenant_id UUID;
    owner_id UUID;
BEGIN
    SELECT id INTO tenant_id FROM users WHERE role = 'tenant' LIMIT 1;
    SELECT id INTO owner_id FROM users WHERE role = 'owner' LIMIT 1;
    
    IF tenant_id IS NOT NULL AND owner_id IS NOT NULL THEN
        INSERT INTO follows (follower_id, following_id) VALUES (tenant_id, owner_id);
        RAISE NOTICE 'Sample follow relationship created successfully';
    ELSE
        RAISE NOTICE 'Cannot create follow relationship - missing users';
    END IF;
END
$$;

-- Sample message thread (uses existing message_threads system)
-- Only insert if we have the required data
DO $$
DECLARE
    property_id UUID;
    owner_id UUID;
    tenant_id UUID;
    thread_id UUID;
BEGIN
    SELECT id INTO property_id FROM properties LIMIT 1;
    SELECT user_id INTO owner_id FROM properties WHERE id = property_id;
    SELECT id INTO tenant_id FROM users WHERE role = 'tenant' LIMIT 1;
    
    IF property_id IS NOT NULL AND owner_id IS NOT NULL AND tenant_id IS NOT NULL THEN
        INSERT INTO message_threads (property_id, property_owner_id, tenant_id) 
        VALUES (property_id, owner_id, tenant_id)
        RETURNING id INTO thread_id;
        
        -- Insert sample message in the thread
        INSERT INTO messages (thread_id, sender_id, body) 
        VALUES (
            thread_id,
            tenant_id,
            'Hi, I am interested in viewing your 3-bedroom apartment in Victoria Island. When would be a good time to schedule a viewing?'
        );
        
        RAISE NOTICE 'Sample message thread and message created successfully';
    ELSE
        RAISE NOTICE 'Cannot create message thread - missing required data';
    END IF;
END
$$;

-- Sample notifications
-- Only insert if users exist
DO $$
DECLARE
    owner_id UUID;
    tenant_id UUID;
BEGIN
    SELECT id INTO owner_id FROM users WHERE role = 'owner' LIMIT 1;
    SELECT id INTO tenant_id FROM users WHERE role = 'tenant' LIMIT 1;
    
    IF owner_id IS NOT NULL THEN
        INSERT INTO user_notifications (user_id, type, title, content) VALUES 
        (
            owner_id,
            'new_follower',
            'New Follower',
            'You have a new follower!'
        ),
        (
            owner_id,
            'property_view',
            'Property Viewed',
            'Your property in Lagos has been viewed 5 times today.'
        );
    END IF;
    
    IF tenant_id IS NOT NULL THEN
        INSERT INTO user_notifications (user_id, type, title, content) VALUES 
        (
            tenant_id,
            'message',
            'New Message',
            'You have received a new message about a property inquiry.'
        );
    END IF;
    
    RAISE NOTICE 'Sample notifications created successfully';
END
$$;
