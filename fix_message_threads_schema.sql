-- Fix message_threads schema to allow direct messaging
-- Make property_id nullable so users can send direct messages without a property context

-- First, let's check the current constraint
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'message_threads'::regclass 
    AND contype = 'c'  -- check constraints
    AND pg_get_constraintdef(oid) LIKE '%property_id%';

-- Make property_id nullable
ALTER TABLE message_threads 
ALTER COLUMN property_id DROP NOT NULL;

-- Test that we can now create a thread without property_id
INSERT INTO message_threads (property_owner_id, tenant_id, created_at)
VALUES (
    auth.uid(),
    (SELECT id FROM auth.users WHERE email != (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1),
    NOW()
);

-- Clean up the test record
DELETE FROM message_threads WHERE property_id IS NULL;

SELECT 'Schema fix complete - property_id is now nullable in message_threads' as status;
