-- RYD Car Rentals Database Migration
-- Transform property rental platform to car rental platform
-- This migration updates all property-related tables to vehicle-related tables
-- Run this in Supabase SQL Editor

-- PART 1: BACKUP AND SAFETY CHECKS
-- ================================

-- Create a backup of the current properties table before migration
CREATE TABLE IF NOT EXISTS properties_backup AS SELECT * FROM properties;

-- Log the migration start
INSERT INTO audit_logs (action, entity, entity_id, changes) 
VALUES ('MIGRATION_START', 'DATABASE', null, '{"migration": "property_to_vehicle", "timestamp": "' || NOW() || '"}');

-- PART 2: UPDATE USER ROLES
-- =========================

-- Update user roles from property-specific to car rental-specific
UPDATE users 
SET role = CASE 
    WHEN role = 'tenant' THEN 'renter'
    WHEN role = 'owner' THEN 'car_owner'
    ELSE role -- keep admin unchanged
END;

-- Update role constraint to reflect new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('renter', 'car_owner', 'admin'));

-- PART 3: TRANSFORM PROPERTIES TO VEHICLES
-- ========================================

-- Step 1: Add new vehicle-specific columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS make VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vin VARCHAR(17) UNIQUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20) UNIQUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS color VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS body_type VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- Technical specifications
ALTER TABLE properties ADD COLUMN IF NOT EXISTS engine_size VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS transmission VARCHAR(20) 
    CHECK (transmission IN ('manual', 'automatic'));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) 
    CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid'));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fuel_economy DECIMAL(4,2);

-- Pricing structure (rename existing price to daily_rate)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2);

-- Rental terms
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_rental_period INTEGER DEFAULT 1; -- days
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_rental_period INTEGER DEFAULT 30; -- days
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_driver_age INTEGER DEFAULT 21;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_driving_experience INTEGER DEFAULT 1; -- years

-- Availability
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS next_available_date DATE;

-- Step 2: Migrate existing data to new structure
-- Set default values for required vehicle fields
UPDATE properties SET 
    make = 'Toyota',
    model = 'Camry',
    year = 2020,
    daily_rate = price::DECIMAL,
    security_deposit = COALESCE(deposit_ngn::DECIMAL, price::DECIMAL * 0.1),
    transmission = 'automatic',
    fuel_type = 'petrol'
WHERE make IS NULL;

-- Transform property_type to vehicle categories
UPDATE properties SET property_type = CASE 
    WHEN property_type = 'apartment' THEN 'sedan'
    WHEN property_type = 'house' THEN 'suv'
    WHEN property_type = 'shared' THEN 'hatchback'
    WHEN property_type = 'land' THEN 'van'
    ELSE 'sedan'
END;

-- Update property_type constraint for vehicle categories
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('sedan', 'suv', 'hatchback', 'van', 'truck', 'luxury', 'economy'));

-- Transform bedrooms/bathrooms to seats/doors
UPDATE properties SET 
    bedrooms = CASE 
        WHEN bedrooms IS NULL OR bedrooms = 0 THEN 5
        WHEN bedrooms > 10 THEN 7
        ELSE bedrooms
    END,
    bathrooms = CASE 
        WHEN bathrooms IS NULL OR bathrooms = 0 THEN 4
        WHEN bathrooms > 6 THEN 4
        ELSE bathrooms
    END;

-- Step 3: Make required columns NOT NULL
ALTER TABLE properties ALTER COLUMN make SET NOT NULL;
ALTER TABLE properties ALTER COLUMN model SET NOT NULL;
ALTER TABLE properties ALTER COLUMN year SET NOT NULL;
ALTER TABLE properties ALTER COLUMN daily_rate SET NOT NULL;

-- Step 4: Rename table and columns
ALTER TABLE properties RENAME TO vehicles;

-- Rename columns to match vehicle domain
ALTER TABLE vehicles RENAME COLUMN property_type TO vehicle_category;
ALTER TABLE vehicles RENAME COLUMN bedrooms TO seating_capacity;
ALTER TABLE vehicles RENAME COLUMN bathrooms TO doors;
ALTER TABLE vehicles RENAME COLUMN furnished TO has_ac; -- air conditioning

-- Step 5: Remove property-specific columns that don't apply to vehicles
ALTER TABLE vehicles DROP COLUMN IF EXISTS listing_type;

-- PART 4: CREATE VEHICLE FEATURES TABLE
-- ====================================

CREATE TABLE IF NOT EXISTS vehicle_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50), -- 'comfort', 'safety', 'entertainment', 'convenience'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);

-- Add default features for existing vehicles
INSERT INTO vehicle_features (vehicle_id, feature_name, feature_category)
SELECT 
    id,
    CASE 
        WHEN has_ac THEN 'Air Conditioning'
        ELSE 'Basic Features'
    END,
    'comfort'
FROM vehicles;

-- PART 5: TRANSFORM APPLICATIONS TO BOOKINGS
-- ==========================================

-- Rename applications table to bookings
ALTER TABLE applications RENAME TO bookings;

-- Add booking-specific columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_location TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_days INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled'));

-- Rename foreign key reference
ALTER TABLE bookings RENAME COLUMN property_id TO vehicle_id;

-- Set default values for new columns
UPDATE bookings SET 
    pickup_date = CURRENT_DATE + INTERVAL '1 day',
    return_date = CURRENT_DATE + INTERVAL '3 days',
    total_days = 2,
    total_amount = 30000.00,
    pickup_location = 'Default Pickup Location',
    return_location = 'Default Return Location',
    booking_status = status
WHERE pickup_date IS NULL;

-- PART 6: TRANSFORM LEASES TO RENTAL AGREEMENTS
-- =============================================

-- Rename leases table to rental_agreements
ALTER TABLE leases RENAME TO rental_agreements;

-- Add rental-specific columns
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS actual_pickup_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS actual_return_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS pickup_mileage INTEGER;
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS return_mileage INTEGER;
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS fuel_level_pickup VARCHAR(20);
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS fuel_level_return VARCHAR(20);
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS damage_assessment TEXT;
ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS additional_charges DECIMAL(10,2) DEFAULT 0;

-- Update references
ALTER TABLE rental_agreements RENAME COLUMN property_id TO vehicle_id;
-- Note: application_id should reference booking_id, but we need to handle the constraint

-- PART 7: UPDATE MEDIA TABLE
-- ==========================

-- Rename property_media to vehicle_media
ALTER TABLE property_media RENAME TO vehicle_media;
ALTER TABLE vehicle_media RENAME COLUMN property_id TO vehicle_id;

-- Add vehicle-specific media categories
ALTER TABLE vehicle_media ADD COLUMN IF NOT EXISTS media_category VARCHAR(30) DEFAULT 'exterior'
    CHECK (media_category IN ('exterior', 'interior', 'engine', 'dashboard', 'documents'));

-- PART 8: UPDATE MESSAGE THREADS
-- ==============================

-- Update message_threads to reference vehicles instead of properties
ALTER TABLE message_threads RENAME COLUMN property_id TO vehicle_id;
ALTER TABLE message_threads RENAME COLUMN property_owner_id TO vehicle_owner_id;
ALTER TABLE message_threads RENAME COLUMN tenant_id TO renter_id;

-- PART 9: UPDATE PROPERTY VIEWS TO VEHICLE VIEWS
-- ==============================================

-- Rename property_views to vehicle_views
ALTER TABLE property_views RENAME TO vehicle_views;
ALTER TABLE property_views RENAME COLUMN property_id TO vehicle_id;

-- PART 10: UPDATE INDEXES
-- =======================

-- Drop old indexes
DROP INDEX IF EXISTS idx_properties_city;
DROP INDEX IF EXISTS idx_properties_state;
DROP INDEX IF EXISTS idx_properties_type;
DROP INDEX IF EXISTS idx_properties_price;
DROP INDEX IF EXISTS idx_properties_status;
DROP INDEX IF EXISTS idx_applications_property;
DROP INDEX IF EXISTS idx_property_media_property;

-- Create new indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_city ON vehicles(city);
CREATE INDEX IF NOT EXISTS idx_vehicles_state ON vehicles(state);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_transmission ON vehicles(transmission);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(tenant_id); -- keeping old column name for now
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle ON vehicle_media(vehicle_id);

-- PART 11: UPDATE RLS POLICIES
-- ============================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read active properties" ON vehicles;
DROP POLICY IF EXISTS "Owners can manage own properties" ON vehicles;
DROP POLICY IF EXISTS "Anyone can read media for active properties" ON vehicle_media;
DROP POLICY IF EXISTS "Owners can manage media for own properties" ON vehicle_media;
DROP POLICY IF EXISTS "Tenants can create applications" ON bookings;
DROP POLICY IF EXISTS "Users can read own applications" ON bookings;
DROP POLICY IF EXISTS "Owners can update applications for own properties" ON bookings;

-- Create new RLS policies for vehicles
CREATE POLICY "Anyone can read active vehicles" ON vehicles
    FOR SELECT USING (status = 'active');

CREATE POLICY "Car owners can manage own vehicles" ON vehicles
    FOR ALL USING (auth.uid() = user_id);

-- Vehicle media policies
CREATE POLICY "Anyone can read media for active vehicles" ON vehicle_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_media.vehicle_id AND status = 'active'
        )
    );

CREATE POLICY "Car owners can manage media for own vehicles" ON vehicle_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_media.vehicle_id AND user_id = auth.uid()
        )
    );

-- Booking policies
CREATE POLICY "Renters can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can read own bookings" ON bookings
    FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() IN (
        SELECT user_id FROM vehicles WHERE id = vehicle_id
    ));

CREATE POLICY "Car owners can update bookings for own vehicles" ON bookings
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM vehicles WHERE id = vehicle_id
    ));

-- Vehicle features policies
ALTER TABLE vehicle_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicle features for active vehicles" ON vehicle_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_features.vehicle_id AND status = 'active'
        )
    );

CREATE POLICY "Car owners can manage features for own vehicles" ON vehicle_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_features.vehicle_id AND user_id = auth.uid()
        )
    );

-- PART 12: UPDATE FUNCTIONS AND TRIGGERS
-- ======================================

-- Update the search function for vehicles
CREATE OR REPLACE FUNCTION search_vehicles(
    p_query text DEFAULT '',
    p_city text DEFAULT '',
    p_vehicle_category text DEFAULT '',
    p_make text DEFAULT '',
    p_transmission text DEFAULT '',
    p_fuel_type text DEFAULT '',
    p_min_price decimal DEFAULT NULL,
    p_max_price decimal DEFAULT NULL,
    p_min_year integer DEFAULT NULL,
    p_max_year integer DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    daily_rate decimal,
    vehicle_category text,
    make text,
    model text,
    year integer,
    transmission text,
    fuel_type text,
    seating_capacity integer,
    doors integer,
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
        v.id,
        v.title,
        v.description,
        v.daily_rate,
        v.vehicle_category,
        v.make,
        v.model,
        v.year,
        v.transmission,
        v.fuel_type,
        v.seating_capacity,
        v.doors,
        v.city,
        v.state,
        v.area,
        v.created_at,
        v.user_id
    FROM vehicles v
    WHERE 
        v.status = 'active'
        AND (p_query = '' OR v.title ILIKE '%' || p_query || '%' OR v.description ILIKE '%' || p_query || '%')
        AND (p_city = '' OR v.city ILIKE '%' || p_city || '%')
        AND (p_vehicle_category = '' OR v.vehicle_category = p_vehicle_category)
        AND (p_make = '' OR v.make ILIKE '%' || p_make || '%')
        AND (p_transmission = '' OR v.transmission = p_transmission)
        AND (p_fuel_type = '' OR v.fuel_type = p_fuel_type)
        AND (p_min_price IS NULL OR v.daily_rate >= p_min_price)
        AND (p_max_price IS NULL OR v.daily_rate <= p_max_price)
        AND (p_min_year IS NULL OR v.year >= p_min_year)
        AND (p_max_year IS NULL OR v.year <= p_max_year)
    ORDER BY v.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- PART 13: UPDATE OWNER PROFILES
-- ==============================

-- Rename owner_profiles to better reflect car rental business
-- Add car rental specific fields
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS business_license_number TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS total_vehicles INTEGER DEFAULT 0;

-- Update existing profiles with default values
UPDATE owner_profiles SET 
    total_vehicles = (
        SELECT COUNT(*) FROM vehicles WHERE user_id = owner_profiles.user_id
    )
WHERE total_vehicles = 0;

-- PART 14: CREATE VEHICLE AVAILABILITY CALENDAR
-- =============================================

CREATE TABLE IF NOT EXISTS vehicle_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    reason TEXT, -- 'booked', 'maintenance', 'owner_blocked'
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for availability queries
CREATE INDEX IF NOT EXISTS idx_vehicle_availability_vehicle_dates 
    ON vehicle_availability(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_availability_dates 
    ON vehicle_availability(start_date, end_date);

-- Enable RLS for availability
ALTER TABLE vehicle_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicle availability" ON vehicle_availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_availability.vehicle_id AND status = 'active'
        )
    );

CREATE POLICY "Car owners can manage availability for own vehicles" ON vehicle_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_availability.vehicle_id AND user_id = auth.uid()
        )
    );

-- PART 15: CREATE VEHICLE MAINTENANCE LOG
-- =======================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL, -- 'service', 'repair', 'inspection', 'cleaning'
    description TEXT NOT NULL,
    cost DECIMAL(10,2),
    maintenance_date DATE NOT NULL,
    next_due_date DATE,
    service_provider TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for maintenance queries
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_date ON vehicle_maintenance(maintenance_date);

-- Enable RLS for maintenance
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Car owners can manage maintenance for own vehicles" ON vehicle_maintenance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE id = vehicle_maintenance.vehicle_id AND user_id = auth.uid()
        )
    );

-- PART 16: FINAL CLEANUP AND VERIFICATION
-- =======================================

-- Update audit log with completion
INSERT INTO audit_logs (action, entity, entity_id, changes) 
VALUES ('MIGRATION_COMPLETE', 'DATABASE', null, '{"migration": "property_to_vehicle", "timestamp": "' || NOW() || '", "status": "success"}');

-- Update view count column name reference in vehicles
UPDATE vehicles SET view_count = COALESCE(view_count, 0) WHERE view_count IS NULL;

-- Add comments for documentation
COMMENT ON TABLE vehicles IS 'Vehicle listings for car rental marketplace (migrated from properties)';
COMMENT ON TABLE bookings IS 'Car rental bookings (migrated from applications)';
COMMENT ON TABLE rental_agreements IS 'Active car rental agreements (migrated from leases)';
COMMENT ON TABLE vehicle_media IS 'Vehicle photos and media (migrated from property_media)';
COMMENT ON TABLE vehicle_features IS 'Vehicle features and amenities';
COMMENT ON TABLE vehicle_availability IS 'Vehicle availability calendar';
COMMENT ON TABLE vehicle_maintenance IS 'Vehicle maintenance history';

-- Verify migration success
DO $$
DECLARE
    vehicle_count INTEGER;
    booking_count INTEGER;
    feature_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO booking_count FROM bookings;
    SELECT COUNT(*) INTO feature_count FROM vehicle_features;
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '🚗 Vehicles: % records', vehicle_count;
    RAISE NOTICE '📋 Bookings: % records', booking_count;
    RAISE NOTICE '⭐ Vehicle Features: % records', feature_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Database successfully transformed from property rentals to car rentals!';
    RAISE NOTICE 'Next steps: Update frontend code to use new table names and columns.';
END $$;
