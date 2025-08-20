-- Fix message_threads schema to allow direct messaging
-- Make property_id nullable so users can send direct messages without a property context

-- Check current NOT NULL constraints on message_threads
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'message_threads' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Make property_id nullable to allow direct messages without property context
ALTER TABLE message_threads 
ALTER COLUMN property_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'message_threads' 
    AND table_schema = 'public'
    AND column_name = 'property_id';

SELECT 'Schema fix complete - property_id is now nullable in message_threads' as status;
