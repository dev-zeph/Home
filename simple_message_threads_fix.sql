-- Simple fix for message_threads schema
-- Make property_id nullable to allow direct messaging between users

-- Check current constraint
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'message_threads' 
    AND column_name = 'property_id';

-- Make property_id nullable
ALTER TABLE message_threads 
ALTER COLUMN property_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'message_threads' 
    AND column_name = 'property_id';

SELECT 'Schema fix complete - property_id is now nullable' as status;
