-- Add listing_type column to properties table
-- This allows properties to be listed for rent or sale
-- Run this in Supabase SQL Editor

-- Add the listing_type column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sale'));

-- Update existing properties to have 'rent' as default
UPDATE public.properties 
SET listing_type = 'rent' 
WHERE listing_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.properties 
ALTER COLUMN listing_type SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.listing_type IS 'Type of listing: rent or sale';

-- Update the search function to include listing_type (if it exists)
-- This is optional but helpful for filtering
CREATE OR REPLACE FUNCTION search_properties(
  p_query text DEFAULT '',
  p_city text DEFAULT '',
  p_property_type text DEFAULT '',
  p_listing_type text DEFAULT '',
  p_min_price integer DEFAULT NULL,
  p_max_price integer DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price integer,
  listing_type text,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  city text,
  state text,
  area text,
  created_at timestamptz,
  user_id uuid
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.listing_type,
    p.property_type,
    p.bedrooms,
    p.bathrooms,
    p.city,
    p.state,
    p.area,
    p.created_at,
    p.user_id
  FROM public.properties p
  WHERE 
    p.status = 'active' 
    AND p.verified = true
    AND (p_query = '' OR p.title ILIKE '%' || p_query || '%' OR p.description ILIKE '%' || p_query || '%')
    AND (p_city = '' OR p.city ILIKE '%' || p_city || '%')
    AND (p_property_type = '' OR p.property_type = p_property_type)
    AND (p_listing_type = '' OR p.listing_type = p_listing_type)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name = 'listing_type';

-- Check the constraint separately
SELECT 
  cc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu 
  ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'properties' 
  AND ccu.column_name = 'listing_type';

DO $$
BEGIN
    RAISE NOTICE '✅ Added listing_type column to properties table';
    RAISE NOTICE '✅ Supports both "rent" and "sale" listings';
    RAISE NOTICE '✅ Existing properties defaulted to "rent"';
    RAISE NOTICE '✅ Updated search function to support listing type filtering';
    RAISE NOTICE 'Your property platform now supports both rentals and sales! 🏠💼';
END $$;
