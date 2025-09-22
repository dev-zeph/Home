-- RYD Car Rentals Database Migration ROLLBACK
-- This script reverts the property-to-vehicle migration
-- USE WITH EXTREME CAUTION - This will restore the backup
-- Run this in Supabase SQL Editor ONLY if you need to rollback

-- SAFETY CHECK: Ensure backup exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties_backup') THEN
        RAISE EXCEPTION 'ERROR: properties_backup table not found! Cannot proceed with rollback.';
    END IF;
    
    RAISE NOTICE '⚠️  ROLLBACK STARTING: This will revert all car rental changes!';
    RAISE NOTICE '📋 Backup table found. Proceeding with rollback...';
END $$;

-- Log rollback start
INSERT INTO audit_logs (action, entity, entity_id, changes) 
VALUES ('ROLLBACK_START', 'DATABASE', null, '{"rollback": "vehicle_to_property", "timestamp": "' || NOW() || '"}');

-- STEP 1: Drop new tables created for car rentals
DROP TABLE IF EXISTS vehicle_maintenance CASCADE;
DROP TABLE IF EXISTS vehicle_availability CASCADE;
DROP TABLE IF EXISTS vehicle_features CASCADE;

-- STEP 2: Revert table names
ALTER TABLE IF EXISTS vehicles RENAME TO properties;
ALTER TABLE IF EXISTS bookings RENAME TO applications;
ALTER TABLE IF EXISTS rental_agreements RENAME TO leases;
ALTER TABLE IF EXISTS vehicle_media RENAME TO property_media;
ALTER TABLE IF EXISTS vehicle_views RENAME TO property_views;

-- STEP 3: Revert column names
ALTER TABLE IF EXISTS properties RENAME COLUMN vehicle_category TO property_type;
ALTER TABLE IF EXISTS properties RENAME COLUMN seating_capacity TO bedrooms;
ALTER TABLE IF EXISTS properties RENAME COLUMN doors TO bathrooms;
ALTER TABLE IF EXISTS properties RENAME COLUMN has_ac TO furnished;

ALTER TABLE IF EXISTS applications RENAME COLUMN vehicle_id TO property_id;
ALTER TABLE IF EXISTS leases RENAME COLUMN vehicle_id TO property_id;
ALTER TABLE IF EXISTS property_media RENAME COLUMN vehicle_id TO property_id;
ALTER TABLE IF EXISTS property_views RENAME COLUMN vehicle_id TO property_id;
ALTER TABLE IF EXISTS message_threads RENAME COLUMN vehicle_id TO property_id;
ALTER TABLE IF EXISTS message_threads RENAME COLUMN vehicle_owner_id TO property_owner_id;
ALTER TABLE IF EXISTS message_threads RENAME COLUMN renter_id TO tenant_id;

-- STEP 4: Remove car-specific columns
ALTER TABLE properties DROP COLUMN IF EXISTS make;
ALTER TABLE properties DROP COLUMN IF EXISTS model;
ALTER TABLE properties DROP COLUMN IF EXISTS year;
ALTER TABLE properties DROP COLUMN IF EXISTS vin;
ALTER TABLE properties DROP COLUMN IF EXISTS license_plate;
ALTER TABLE properties DROP COLUMN IF EXISTS color;
ALTER TABLE properties DROP COLUMN IF EXISTS body_type;
ALTER TABLE properties DROP COLUMN IF EXISTS mileage;
ALTER TABLE properties DROP COLUMN IF EXISTS engine_size;
ALTER TABLE properties DROP COLUMN IF EXISTS transmission;
ALTER TABLE properties DROP COLUMN IF EXISTS fuel_type;
ALTER TABLE properties DROP COLUMN IF EXISTS fuel_economy;
ALTER TABLE properties DROP COLUMN IF EXISTS daily_rate;
ALTER TABLE properties DROP COLUMN IF EXISTS weekly_rate;
ALTER TABLE properties DROP COLUMN IF EXISTS monthly_rate;
ALTER TABLE properties DROP COLUMN IF EXISTS security_deposit;
ALTER TABLE properties DROP COLUMN IF EXISTS min_rental_period;
ALTER TABLE properties DROP COLUMN IF EXISTS max_rental_period;
ALTER TABLE properties DROP COLUMN IF EXISTS min_driver_age;
ALTER TABLE properties DROP COLUMN IF EXISTS min_driving_experience;
ALTER TABLE properties DROP COLUMN IF EXISTS is_available;
ALTER TABLE properties DROP COLUMN IF EXISTS next_available_date;

-- Remove booking-specific columns
ALTER TABLE applications DROP COLUMN IF EXISTS pickup_date;
ALTER TABLE applications DROP COLUMN IF EXISTS return_date;
ALTER TABLE applications DROP COLUMN IF EXISTS pickup_location;
ALTER TABLE applications DROP COLUMN IF EXISTS return_location;
ALTER TABLE applications DROP COLUMN IF EXISTS total_days;
ALTER TABLE applications DROP COLUMN IF EXISTS total_amount;
ALTER TABLE applications DROP COLUMN IF EXISTS booking_status;

-- Remove rental agreement specific columns
ALTER TABLE leases DROP COLUMN IF EXISTS actual_pickup_date;
ALTER TABLE leases DROP COLUMN IF EXISTS actual_return_date;
ALTER TABLE leases DROP COLUMN IF EXISTS pickup_mileage;
ALTER TABLE leases DROP COLUMN IF EXISTS return_mileage;
ALTER TABLE leases DROP COLUMN IF EXISTS fuel_level_pickup;
ALTER TABLE leases DROP COLUMN IF EXISTS fuel_level_return;
ALTER TABLE leases DROP COLUMN IF EXISTS damage_assessment;
ALTER TABLE leases DROP COLUMN IF EXISTS additional_charges;

-- Remove media category column
ALTER TABLE property_media DROP COLUMN IF EXISTS media_category;

-- Remove owner profile car-specific columns
ALTER TABLE owner_profiles DROP COLUMN IF EXISTS business_license_number;
ALTER TABLE owner_profiles DROP COLUMN IF EXISTS insurance_provider;
ALTER TABLE owner_profiles DROP COLUMN IF EXISTS insurance_policy_number;
ALTER TABLE owner_profiles DROP COLUMN IF EXISTS insurance_expiry_date;
ALTER TABLE owner_profiles DROP COLUMN IF EXISTS total_vehicles;

-- STEP 5: Restore original data from backup
TRUNCATE TABLE properties;
INSERT INTO properties SELECT * FROM properties_backup;

-- STEP 6: Restore original constraints
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('apartment', 'house', 'shared', 'land'));

-- STEP 7: Restore user roles
UPDATE users 
SET role = CASE 
    WHEN role = 'renter' THEN 'tenant'
    WHEN role = 'car_owner' THEN 'owner'
    ELSE role -- keep admin unchanged
END;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('tenant', 'owner', 'admin'));

-- STEP 8: Restore original indexes
DROP INDEX IF EXISTS idx_vehicles_city;
DROP INDEX IF EXISTS idx_vehicles_state;
DROP INDEX IF EXISTS idx_vehicles_category;
DROP INDEX IF EXISTS idx_vehicles_daily_rate;
DROP INDEX IF EXISTS idx_vehicles_status;
DROP INDEX IF EXISTS idx_vehicles_make_model;
DROP INDEX IF EXISTS idx_vehicles_year;
DROP INDEX IF EXISTS idx_vehicles_transmission;
DROP INDEX IF EXISTS idx_vehicles_fuel_type;
DROP INDEX IF EXISTS idx_bookings_vehicle;
DROP INDEX IF EXISTS idx_vehicle_media_vehicle;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_applications_property ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media(property_id);

-- STEP 9: Restore original RLS policies
-- Drop vehicle policies
DROP POLICY IF EXISTS "Anyone can read active vehicles" ON properties;
DROP POLICY IF EXISTS "Car owners can manage own vehicles" ON properties;
DROP POLICY IF EXISTS "Anyone can read media for active vehicles" ON property_media;
DROP POLICY IF EXISTS "Car owners can manage media for own vehicles" ON property_media;
DROP POLICY IF EXISTS "Renters can create bookings" ON applications;
DROP POLICY IF EXISTS "Users can read own bookings" ON applications;
DROP POLICY IF EXISTS "Car owners can update bookings for own vehicles" ON applications;

-- Recreate original policies
CREATE POLICY "Anyone can read active properties" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Owners can manage own properties" ON properties
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read media for active properties" ON property_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE id = property_media.property_id AND status = 'active'
        )
    );

CREATE POLICY "Owners can manage media for own properties" ON property_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE id = property_media.property_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can read own applications" ON applications
    FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() IN (
        SELECT user_id FROM properties WHERE id = property_id
    ));

CREATE POLICY "Owners can update applications for own properties" ON applications
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM properties WHERE id = property_id
    ));

-- STEP 10: Drop search function and restore original (if it existed)
DROP FUNCTION IF EXISTS search_vehicles;

-- STEP 11: Final cleanup
-- Note: Keep the backup table for future reference
-- DROP TABLE IF EXISTS properties_backup;

-- Log rollback completion
INSERT INTO audit_logs (action, entity, entity_id, changes) 
VALUES ('ROLLBACK_COMPLETE', 'DATABASE', null, '{"rollback": "vehicle_to_property", "timestamp": "' || NOW() || '", "status": "success"}');

-- Verification
DO $$
DECLARE
    property_count INTEGER;
    application_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO property_count FROM properties;
    SELECT COUNT(*) INTO application_count FROM applications;
    
    RAISE NOTICE '✅ Rollback completed successfully!';
    RAISE NOTICE '🏠 Properties restored: % records', property_count;
    RAISE NOTICE '📋 Applications restored: % records', application_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Database successfully reverted to property rental system!';
    RAISE NOTICE 'ℹ️  Backup table "properties_backup" preserved for reference.';
END $$;
