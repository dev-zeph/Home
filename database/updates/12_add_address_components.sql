-- Add address_components column to properties table
-- This stores the structured Google Places data for better location handling
-- Run this in Supabase SQL Editor

-- Add the address_components column to store Google Places JSON data
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS address_components JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.address_components IS 'Google Places API address components (JSON data including lat/lng, place_id, etc.)';

-- Add an index on the address_components for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_properties_address_components 
ON public.properties USING gin (address_components);

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name = 'address_components';

-- Show some example data structure for the address_components
DO $$
BEGIN
    RAISE NOTICE '✅ Added address_components column to properties table';
    RAISE NOTICE '📍 This column will store Google Places data including:';
    RAISE NOTICE '   - formatted_address (full address string)';
    RAISE NOTICE '   - place_id (Google Places unique identifier)';
    RAISE NOTICE '   - lat/lng coordinates';
    RAISE NOTICE '   - street_number, route, locality, etc.';
    RAISE NOTICE '   - Enhanced location search and mapping capabilities';
    RAISE NOTICE '';
    RAISE NOTICE 'Example structure:';
    RAISE NOTICE '{';
    RAISE NOTICE '  "formatted_address": "123 Main St, Victoria Island, Lagos, Nigeria",';
    RAISE NOTICE '  "place_id": "ChIJXYZ...",';
    RAISE NOTICE '  "lat": 6.4281,';
    RAISE NOTICE '  "lng": 3.4219,';
    RAISE NOTICE '  "city": "Lagos",';
    RAISE NOTICE '  "state": "Lagos State",';
    RAISE NOTICE '  "country": "Nigeria"';
    RAISE NOTICE '}';
END $$;
