-- Admin System Migration for NG Rentals
-- Run this in your Supabase SQL editor

-- Add admin role to existing role check constraint (if not already present)
-- First, let's check and update the users table role constraint
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add the updated constraint with admin role
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('tenant', 'owner', 'admin'));
    
    RAISE NOTICE 'Updated users role constraint to include admin role';
END $$;

-- Create admin-specific RLS policies
-- Admin users should be able to read all properties for verification
CREATE POLICY "Admins can view all properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admin users should be able to update property verification status
CREATE POLICY "Admins can update property verification"
ON public.properties
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admin users should be able to view all user profiles for communication
CREATE POLICY "Admins can view all user profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users AS admin_user
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
    )
);

-- Create a function to check if user is admin (for convenience)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND role = 'admin'
    );
END;
$$;

-- Create a function to handle property verification notifications
-- This is a placeholder for future email integration
CREATE OR REPLACE FUNCTION public.notify_property_owner(
    property_id UUID,
    notification_type TEXT,
    message_content TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    property_owner_email TEXT;
    property_title TEXT;
BEGIN
    -- Get property details
    SELECT 
        p.title,
        u.email
    INTO 
        property_title,
        property_owner_email
    FROM public.properties p
    JOIN public.users u ON p.user_id = u.id
    WHERE p.id = property_id;
    
    -- Log the notification (in a real system, this would send an email)
    INSERT INTO public.admin_notifications (
        property_id,
        owner_email,
        notification_type,
        message_content,
        created_at
    ) VALUES (
        property_id,
        property_owner_email,
        notification_type,
        message_content,
        NOW()
    );
    
    RAISE NOTICE 'Notification logged for property: % to owner: %', property_title, property_owner_email;
END;
$$;

-- Create a table to log admin notifications (for audit trail)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    owner_email TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('verification_approved', 'verification_rejected', 'general_message')),
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notification logs
CREATE POLICY "Only admins can view notifications"
ON public.admin_notifications
FOR ALL
TO authenticated
USING (public.is_admin());

-- Create a trigger to update the property verification timestamp
CREATE OR REPLACE FUNCTION public.update_verification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If verified status changed to true, record verification time
    IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
        NEW.verified_at = NOW();
        NEW.verified_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add verification tracking columns to properties table if they don't exist
DO $$
BEGIN
    -- Add verified_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added verified_at column to properties table';
    END IF;
    
    -- Add verified_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'verified_by'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN verified_by UUID REFERENCES public.users(id);
        RAISE NOTICE 'Added verified_by column to properties table';
    END IF;
END $$;

-- Create the trigger on properties table
DROP TRIGGER IF EXISTS update_verification_timestamp_trigger ON public.properties;
CREATE TRIGGER update_verification_timestamp_trigger
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_verification_timestamp();

-- Create an admin user function (for development/testing)
-- In production, admin users should be created through a secure process
CREATE OR REPLACE FUNCTION public.create_admin_user(
    admin_email TEXT,
    admin_password TEXT,
    admin_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This is a simplified version for demo purposes
    -- In production, this should have proper authentication and authorization
    
    -- Insert into auth.users would be handled by Supabase Auth
    -- For now, we'll just return instructions
    
    RETURN format(
        'To create admin user:
        1. Use Supabase Auth to create user with email: %s
        2. After creation, run: UPDATE public.users SET role = ''admin'' WHERE email = ''%s'';
        3. Admin will then be able to access /admin/login',
        admin_email,
        admin_email
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_property_owner TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Admin system migration completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin users through Supabase Auth';
    RAISE NOTICE '2. Update their role to ''admin'' in the users table';
    RAISE NOTICE '3. Admin users can then access /admin/login';
END $$;
