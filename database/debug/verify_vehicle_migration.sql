-- RYD Car Rentals Database Migration Verification
-- This script verifies that the migration was successful
-- Run this after executing the main migration script

-- VERIFICATION QUERIES
-- ====================

-- Check that tables were renamed correctly
DO $$
DECLARE
    tables_exist BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bookings'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rental_agreements'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_media'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_features'
    ) INTO tables_exist;
    
    IF tables_exist THEN
        RAISE NOTICE '✅ All required tables exist after migration';
    ELSE
        RAISE EXCEPTION '❌ Some tables are missing after migration';
    END IF;
END $$;

-- Check vehicle table structure
SELECT 
    'VEHICLES TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

-- Check new car-specific columns exist
DO $$
DECLARE
    required_columns TEXT[] := ARRAY['make', 'model', 'year', 'daily_rate', 'transmission', 'fuel_type'];
    col TEXT;
    col_exists BOOLEAN;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vehicles' AND column_name = col
        ) INTO col_exists;
        
        IF col_exists THEN
            RAISE NOTICE '✅ Column "%" exists in vehicles table', col;
        ELSE
            RAISE EXCEPTION '❌ Required column "%" missing from vehicles table', col;
        END IF;
    END LOOP;
END $$;

-- Check data migration
SELECT 
    'DATA MIGRATION CHECK' as check_type,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN make IS NOT NULL THEN 1 END) as vehicles_with_make,
    COUNT(CASE WHEN daily_rate IS NOT NULL THEN 1 END) as vehicles_with_daily_rate,
    COUNT(CASE WHEN vehicle_category IS NOT NULL THEN 1 END) as vehicles_with_category
FROM vehicles;

-- Check user roles migration
SELECT 
    'USER ROLES CHECK' as check_type,
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- Check booking table structure
SELECT 
    'BOOKINGS TABLE CHECK' as check_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN vehicle_id IS NOT NULL THEN 1 END) as bookings_with_vehicle_id,
    COUNT(CASE WHEN pickup_date IS NOT NULL THEN 1 END) as bookings_with_pickup_date
FROM bookings;

-- Check vehicle features
SELECT 
    'VEHICLE FEATURES CHECK' as check_type,
    COUNT(*) as total_features,
    COUNT(DISTINCT vehicle_id) as vehicles_with_features
FROM vehicle_features;

-- Check indexes exist
SELECT 
    'INDEX CHECK' as check_type,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('vehicles', 'bookings', 'vehicle_media', 'vehicle_features')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    'RLS POLICIES CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('vehicles', 'bookings', 'vehicle_media', 'vehicle_features')
ORDER BY tablename, policyname;

-- Sample data check
SELECT 
    'SAMPLE VEHICLES DATA' as check_type,
    id,
    title,
    make,
    model,
    year,
    vehicle_category,
    daily_rate,
    city
FROM vehicles 
LIMIT 5;

-- Sample bookings data
SELECT 
    'SAMPLE BOOKINGS DATA' as check_type,
    id,
    vehicle_id,
    pickup_date,
    return_date,
    total_amount,
    booking_status
FROM bookings 
LIMIT 5;

-- Check function exists
SELECT 
    'FUNCTIONS CHECK' as check_type,
    proname as function_name,
    pronargs as argument_count
FROM pg_proc 
WHERE proname LIKE '%vehicle%'
ORDER BY proname;

-- Final summary
DO $$
DECLARE
    vehicle_count INTEGER;
    booking_count INTEGER;
    feature_count INTEGER;
    user_count INTEGER;
    owner_count INTEGER;
    renter_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO booking_count FROM bookings;
    SELECT COUNT(*) INTO feature_count FROM vehicle_features;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO owner_count FROM users WHERE role = 'car_owner';
    SELECT COUNT(*) INTO renter_count FROM users WHERE role = 'renter';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRATION VERIFICATION SUMMARY';
    RAISE NOTICE '==================================';
    RAISE NOTICE '🚗 Total Vehicles: %', vehicle_count;
    RAISE NOTICE '📋 Total Bookings: %', booking_count;
    RAISE NOTICE '⭐ Total Vehicle Features: %', feature_count;
    RAISE NOTICE '👥 Total Users: %', user_count;
    RAISE NOTICE '🔑 Car Owners: %', owner_count;
    RAISE NOTICE '🚙 Renters: %', renter_count;
    RAISE NOTICE '';
    
    IF vehicle_count > 0 AND booking_count >= 0 AND user_count > 0 THEN
        RAISE NOTICE '✅ Migration appears successful!';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Update frontend code to use new table/column names';
        RAISE NOTICE '2. Test all CRUD operations';
        RAISE NOTICE '3. Verify RLS policies are working correctly';
        RAISE NOTICE '4. Update API endpoints and services';
    ELSE
        RAISE NOTICE '⚠️  Migration may have issues. Please review the results above.';
    END IF;
END $$;
