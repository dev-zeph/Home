# Car Rentals Migration Plan
**From: NG Rentals (Property Platform) → Car Rentals Platform**

## Overview
This document outlines the complete migration strategy to transform the existing property rental platform into a professional car rental system. The migration preserves the robust architecture while adapting all domain-specific features.

---

## Migration Strategy

### Phase 1: Planning & Documentation ✅ (Current Phase)

**Objective**: Define scope, map existing features to car rental equivalents, and create detailed implementation plan.

**Key Mappings**:
- **Properties** → **Vehicles**
- **Property Types** → **Vehicle Categories** (Economy, SUV, Luxury, etc.)
- **Bedrooms/Bathrooms** → **Seats/Doors/Engine/Transmission**
- **Property Amenities** → **Vehicle Features** (AC, GPS, Bluetooth, etc.)
- **Property Location** → **Pickup/Dropoff Locations**
- **Property Listings** → **Vehicle Availability**
- **Property Applications** → **Rental Bookings**
- **Property Leases** → **Rental Agreements**

---

## Phase 2: Frontend Changes

### 2.1 Branding & Terminology Updates
**Files to Update**:
- `frontend/src/App.js` - Update header branding
- `frontend/public/index.html` - Update page title
- `frontend/public/manifest.json` - Update app metadata

**Changes**:
- Brand name: "Home.NG" → "RYD"
- Navigation: "Search Properties" → "Search Cars"
- CTA buttons: "Post Property" → "List Your Car"

### 2.2 Homepage Transformation
**File**: `frontend/src/pages/Home.js`

**Updates**:
- Hero section: Property search → Car search interface
- Search filters: Property filters → Car filters (make, model, year, price range)
- Featured section: "Explore Nigeria" cities → "Popular Car Categories"
- CTA section: Property posting → Car listing invitation

**New Search Filters**:
- Car Make (Toyota, Honda, Mercedes, etc.)
- Car Model dropdown (dynamic based on make)
- Year range slider
- Price per day range
- Vehicle type (Economy, SUV, Luxury, etc.)
- Transmission (Manual/Automatic)
- Fuel type (Petrol, Diesel, Electric)

### 2.3 Listing Pages Transformation
**Files**: 
- `frontend/src/pages/Listings.js` → Rename to `VehicleListings.js`
- `frontend/src/pages/ListingDetail.js` → Rename to `VehicleDetail.js`

**Vehicle Listings Page**:
- Grid layout showing car cards
- Car image, make/model, year, price per day
- Quick filters: transmission, fuel type, seats
- Sort options: price, year, popularity

**Vehicle Detail Page**:
- Car image gallery
- Detailed specifications (engine, transmission, fuel economy)
- Features list (AC, GPS, Bluetooth, etc.)
- Availability calendar
- Pricing breakdown (daily, weekly, monthly rates)
- Location pickup/dropoff details
- "Book Now" CTA instead of "Apply"

### 2.4 Car Posting Page
**File**: `frontend/src/pages/PostProperty.js` → Rename to `ListCar.js`

**New Form Fields**:
- **Vehicle Information**:
  - Make, Model, Year
  - Vehicle Identification Number (VIN)
  - License plate number
  - Color, Body type
  - Mileage
- **Technical Specifications**:
  - Engine size/type
  - Transmission (Manual/Automatic)
  - Fuel type (Petrol/Diesel/Electric)
  - Fuel economy (km/L)
  - Seating capacity
  - Number of doors
- **Features & Amenities**:
  - Air conditioning
  - GPS navigation
  - Bluetooth connectivity
  - USB charging ports
  - Backup camera
  - Parking sensors
  - Sunroof
- **Availability & Pricing**:
  - Daily rate
  - Weekly rate (optional)
  - Monthly rate (optional)
  - Security deposit amount
  - Minimum rental period
  - Maximum rental period
- **Location & Pickup**:
  - Primary pickup location
  - Delivery available (yes/no)
  - Delivery radius (if applicable)
- **Insurance & Documentation**:
  - Insurance coverage included
  - Required driver age
  - Required driving experience (years)
  - Additional driver fee

### 2.5 Dashboard Updates
**File**: `frontend/src/pages/Dashboard.js`

**Section Renames**:
- "My Listings" → "My Cars"
- "Property Analytics" → "Car Analytics"
- "Applications" → "Bookings"
- "Leases" → "Active Rentals"

**New Dashboard Features**:
- Car availability calendar
- Booking requests management
- Rental history and earnings
- Car maintenance reminders
- Performance analytics (booking rate, revenue)

### 2.6 City Pages Transformation
**Files**: `frontend/src/pages/Lagos.js`, `Abuja.js`, etc.

**Updates**:
- "Properties in Lagos" → "Car Rentals in Lagos"
- City-specific car availability
- Popular car categories by city
- Average pricing information by location

### 2.7 Authentication Updates
**Files**: `frontend/src/pages/Signup.js`, `Login.js`

**Role Updates**:
- "Tenant" → "Renter"
- "Owner" → "Car Owner"
- Keep "Admin" role unchanged

**Signup Form Additions for Car Owners**:
- Driver's license verification
- Business registration (for commercial car owners)
- Insurance information

---

## Phase 3: Backend/Database Changes ✅ (Ready for Execution)

### 3.1 Database Schema Migration ✅ (Complete)
**Migration File**: `database/updates/13_property_to_vehicle_migration.sql`
**Rollback File**: `database/updates/13_property_to_vehicle_migration_ROLLBACK.sql`
**Verification File**: `database/debug/verify_vehicle_migration.sql`

#### 3.1.1 Rename Main Table
```sql
-- Rename properties table to vehicles
ALTER TABLE properties RENAME TO vehicles;

-- Update column names to match car rental domain
ALTER TABLE vehicles RENAME COLUMN property_type TO vehicle_category;
ALTER TABLE vehicles RENAME COLUMN bedrooms TO seating_capacity;
ALTER TABLE vehicles RENAME COLUMN bathrooms TO doors;
ALTER TABLE vehicles RENAME COLUMN furnished TO features_included;
```

#### 3.1.2 Add Car-Specific Columns
```sql
-- Vehicle identification
ALTER TABLE vehicles ADD COLUMN make VARCHAR(50) NOT NULL;
ALTER TABLE vehicles ADD COLUMN model VARCHAR(100) NOT NULL;
ALTER TABLE vehicles ADD COLUMN year INTEGER NOT NULL;
ALTER TABLE vehicles ADD COLUMN vin VARCHAR(17) UNIQUE;
ALTER TABLE vehicles ADD COLUMN license_plate VARCHAR(20) UNIQUE;
ALTER TABLE vehicles ADD COLUMN color VARCHAR(30);
ALTER TABLE vehicles ADD COLUMN body_type VARCHAR(30);
ALTER TABLE vehicles ADD COLUMN mileage INTEGER;

-- Technical specifications
ALTER TABLE vehicles ADD COLUMN engine_size VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic'));
ALTER TABLE vehicles ADD COLUMN fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid'));
ALTER TABLE vehicles ADD COLUMN fuel_economy DECIMAL(4,2);

-- Pricing structure
ALTER TABLE vehicles ADD COLUMN daily_rate DECIMAL(10,2) NOT NULL;
ALTER TABLE vehicles ADD COLUMN weekly_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN monthly_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN security_deposit DECIMAL(10,2) NOT NULL;

-- Rental terms
ALTER TABLE vehicles ADD COLUMN min_rental_period INTEGER DEFAULT 1; -- days
ALTER TABLE vehicles ADD COLUMN max_rental_period INTEGER DEFAULT 30; -- days
ALTER TABLE vehicles ADD COLUMN min_driver_age INTEGER DEFAULT 21;
ALTER TABLE vehicles ADD COLUMN min_driving_experience INTEGER DEFAULT 1; -- years

-- Availability
ALTER TABLE vehicles ADD COLUMN is_available BOOLEAN DEFAULT true;
ALTER TABLE vehicles ADD COLUMN next_available_date DATE;

-- Remove property-specific columns
ALTER TABLE vehicles DROP COLUMN IF EXISTS listing_type;
```

#### 3.1.3 Create Vehicle Features Table
```sql
-- Vehicle features/amenities
CREATE TABLE vehicle_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50), -- 'comfort', 'safety', 'entertainment', 'convenience'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);
```

#### 3.1.4 Update Applications to Bookings
```sql
-- Rename applications table to bookings
ALTER TABLE applications RENAME TO bookings;

-- Add booking-specific columns
ALTER TABLE bookings ADD COLUMN pickup_date DATE NOT NULL;
ALTER TABLE bookings ADD COLUMN return_date DATE NOT NULL;
ALTER TABLE bookings ADD COLUMN pickup_location TEXT;
ALTER TABLE bookings ADD COLUMN return_location TEXT;
ALTER TABLE bookings ADD COLUMN total_days INTEGER NOT NULL;
ALTER TABLE bookings ADD COLUMN total_amount DECIMAL(10,2) NOT NULL;
ALTER TABLE bookings ADD COLUMN booking_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled'));

-- Rename foreign key reference
ALTER TABLE bookings RENAME COLUMN property_id TO vehicle_id;
```

#### 3.1.5 Update Leases to Rental Agreements
```sql
-- Rename leases table to rental_agreements
ALTER TABLE leases RENAME TO rental_agreements;

-- Add rental-specific columns
ALTER TABLE rental_agreements ADD COLUMN actual_pickup_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE rental_agreements ADD COLUMN actual_return_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE rental_agreements ADD COLUMN pickup_mileage INTEGER;
ALTER TABLE rental_agreements ADD COLUMN return_mileage INTEGER;
ALTER TABLE rental_agreements ADD COLUMN fuel_level_pickup VARCHAR(20);
ALTER TABLE rental_agreements ADD COLUMN fuel_level_return VARCHAR(20);
ALTER TABLE rental_agreements ADD COLUMN damage_assessment TEXT;
ALTER TABLE rental_agreements ADD COLUMN additional_charges DECIMAL(10,2) DEFAULT 0;

-- Update references
ALTER TABLE rental_agreements RENAME COLUMN property_id TO vehicle_id;
ALTER TABLE rental_agreements RENAME COLUMN application_id TO booking_id;
```

#### 3.1.6 Update Media Table
```sql
-- Update property_media to vehicle_media
ALTER TABLE property_media RENAME TO vehicle_media;
ALTER TABLE vehicle_media RENAME COLUMN property_id TO vehicle_id;

-- Add vehicle-specific media categories
ALTER TABLE vehicle_media ADD COLUMN media_category VARCHAR(30) DEFAULT 'exterior'
    CHECK (media_category IN ('exterior', 'interior', 'engine', 'dashboard', 'documents'));
```

### 3.2 Update RLS Policies
```sql
-- Update RLS policies to reference new table names and columns
-- (Detailed RLS policy updates for all renamed tables)
```

### 3.3 Service Layer Updates
**File**: `frontend/src/services/propertyService.js` → Rename to `vehicleService.js`

**Function Renames & Updates**:
- `createProperty()` → `createVehicle()`
- `searchProperties()` → `searchVehicles()`
- `getPropertyById()` → `getVehicleById()`
- `updateProperty()` → `updateVehicle()`
- `deleteProperty()` → `deleteVehicle()`

**New Functions**:
- `getVehicleAvailability(vehicleId, startDate, endDate)`
- `createBooking(vehicleId, bookingData)`
- `getBookingsByUser(userId)`
- `getBookingsByVehicle(vehicleId)`
- `updateBookingStatus(bookingId, status)`
- `checkVehicleConflicts(vehicleId, startDate, endDate)`

### 3.4 Google Places Integration Update
**Files**: 
- `frontend/src/components/GooglePlacesAutocomplete.js`

**Updates**:
- Adapt for pickup/dropoff location selection
- Support multiple location inputs (pickup + return)
- Add location-based pricing calculations

---

## Phase 4: New Features for Car Rentals

### 4.1 Booking System
- **Calendar availability view**
- **Real-time booking conflicts checking**
- **Booking confirmation workflow**
- **Payment integration preparation**

### 4.2 Vehicle Management
- **Maintenance tracking**
- **Availability calendar management**
- **Pricing management (seasonal, weekend rates)**
- **Vehicle documentation upload**

### 4.3 Enhanced Admin Features
- **Vehicle verification process**
- **Driver license verification**
- **Insurance document review**
- **Booking dispute resolution**

---

## Implementation Timeline

### Week 1: Frontend Core Changes
- Brand update and terminology changes
- Homepage car search implementation
- Navigation updates

### Week 2: Vehicle Listing & Detail Pages
- Transform property listings to vehicle listings
- Implement vehicle detail page
- Update search and filter functionality

### Week 3: Car Posting & Dashboard
- Transform PostProperty to ListCar page
- Update dashboard for car management
- Implement booking management

### Week 4: Database Migration
- Execute schema migration
- Update all RLS policies
- Test data migration

### Week 5: Service Layer & Integration
- Update all API services
- Test end-to-end functionality
- Bug fixes and optimizations

### Week 6: New Features & Testing
- Implement booking system
- Add vehicle management features
- Comprehensive testing

### Week 7: Production Deployment
- Final testing
- Environment setup
- Production deployment
- Post-deployment monitoring

---

## Risk Mitigation

### Data Migration Risks
- **Backup Strategy**: Full database backup before migration
- **Rollback Plan**: Maintain backup with ability to restore
- **Testing**: Comprehensive testing on staging environment

### User Impact
- **Maintenance Window**: Schedule migration during low-traffic period
- **Communication**: Notify users of temporary downtime
- **Gradual Rollout**: Phased deployment if possible

### Technical Risks
- **RLS Policy Updates**: Thorough testing of access controls
- **API Compatibility**: Ensure all frontend-backend communication works
- **Performance**: Monitor performance post-migration

---

## Success Metrics

### Technical Metrics
- Zero data loss during migration
- All tests passing post-migration
- Performance maintained or improved

### Business Metrics
- User adoption of new car rental features
- Successful vehicle listings creation
- Booking system functionality

### User Experience Metrics
- Smooth transition for existing users
- Intuitive car search and booking flow
- Positive user feedback on new features

---

## Conclusion

This migration plan transforms the existing property rental platform into a comprehensive car rental system while preserving the robust architecture, authentication system, and admin capabilities. The phased approach ensures minimal downtime and maintains data integrity throughout the process.

The resulting platform will provide:
- Professional car rental marketplace
- Robust booking and availability management
- Vehicle owner dashboard and analytics
- Admin oversight and verification
- Responsive, modern UI with Carbon Design System
- Production-ready deployment capability

**Next Step**: Begin Phase 2 (Frontend Changes) once this plan is approved.
