-- NG Rentals Seed Data for Supabase
-- This version uses hardcoded UUIDs that you can replace after creating real users

-- First, you need to create users through Supabase Auth dashboard or API
-- Then replace these UUIDs with the actual user IDs from auth.users table

-- Example UUIDs (replace with real ones from your auth.users table)
-- Owner 1: '550e8400-e29b-41d4-a716-446655440000'
-- Owner 2: '550e8400-e29b-41d4-a716-446655440001'

-- Insert sample users (these will be linked to auth.users)
INSERT INTO public.users (id, email, display_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'owner1@ngrentals.com', 'Property Owner 1', 'owner'),
('550e8400-e29b-41d4-a716-446655440001', 'owner2@ngrentals.com', 'Property Owner 2', 'owner'),
('550e8400-e29b-41d4-a716-446655440002', 'tenant1@ngrentals.com', 'John Tenant', 'tenant');

-- Insert sample properties with specific user IDs
INSERT INTO public.properties (id, user_id, title, description, price, deposit_ngn, property_type, bedrooms, bathrooms, furnished, amenities, city, state, area, plus_code, address_text, status, verified) VALUES

-- Lagos Properties
(
  '450e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Modern 3BR Apartment in Victoria Island',
  'Beautiful modern apartment with stunning views of Lagos lagoon. Features include modern kitchen, spacious living area, and access to swimming pool and gym.',
  2500000,
  5000000,
  'apartment',
  3,
  2,
  true,
  '["Swimming Pool", "Gym", "Security", "Parking", "Generator", "Wi-Fi"]'::jsonb,
  'Lagos',
  'Lagos State',
  'Victoria Island',
  '6FR5R6QP+4Q',
  'Adeola Odeku Street, Victoria Island, Lagos',
  'active',
  true
),

(
  '450e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Luxury 4BR House in Lekki',
  'Spacious family home in prestigious Lekki Phase 1. Features include en-suite bedrooms, modern kitchen, garden, and 24/7 security.',
  5000000,
  10000000,
  'house',
  4,
  3,
  true,
  '["Swimming Pool", "Garden", "Security", "Parking", "Generator", "Air Conditioning"]'::jsonb,
  'Lagos',
  'Lagos State',
  'Lekki',
  '6FR5R8XM+8R',
  'Admiralty Way, Lekki Phase 1, Lagos',
  'active',
  true
),

(
  '450e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'Cozy 2BR Flat in Ikeja',
  'Well-maintained apartment in a quiet neighborhood. Close to shopping centers and good schools.',
  1800000,
  3600000,
  'apartment',
  2,
  1,
  false,
  '["Security", "Parking", "Generator"]'::jsonb,
  'Lagos',
  'Lagos State',
  'Ikeja',
  '6FR5Q4GX+7P',
  'Allen Avenue, Ikeja, Lagos',
  'active',
  false
),

-- Abuja Properties
(
  '450e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  'Executive 5BR Duplex in Maitama',
  'Luxury duplex in the heart of Abuja. Perfect for diplomats and executives.',
  8000000,
  16000000,
  'house',
  5,
  4,
  true,
  '["Swimming Pool", "Garden", "Security", "Parking", "Generator", "Air Conditioning", "Study Room"]'::jsonb,
  'Abuja',
  'FCT',
  'Maitama',
  '7F22XR4M+9Q',
  'Maitama District, Abuja',
  'active',
  true
),

(
  '450e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  'Modern 3BR Apartment in Wuse 2',
  'Contemporary apartment in commercial district. Walking distance to offices and restaurants.',
  3500000,
  7000000,
  'apartment',
  3,
  2,
  true,
  '["Gym", "Security", "Parking", "Generator", "Wi-Fi"]'::jsonb,
  'Abuja',
  'FCT',
  'Wuse 2',
  '7F22XQ6H+8M',
  'Aminu Kano Crescent, Wuse 2, Abuja',
  'active',
  true
),

(
  '450e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  'Affordable 2BR in Kubwa',
  'Budget-friendly option for young professionals. Good transport links to city center.',
  1200000,
  2400000,
  'apartment',
  2,
  1,
  false,
  '["Security", "Parking", "Generator"]'::jsonb,
  'Abuja',
  'FCT',
  'Kubwa',
  '7F23XG3P+4R',
  'Kubwa Satellite Town, Abuja',
  'active',
  false
);

-- Insert sample media for properties
INSERT INTO public.property_media (property_id, type, url, is_cover) VALUES
-- Property 1 media
('450e8400-e29b-41d4-a716-446655440000', 'image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', true),
('450e8400-e29b-41d4-a716-446655440000', 'image', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop', false),

-- Property 2 media
('450e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', true),
('450e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', false),

-- Property 3 media
('450e8400-e29b-41d4-a716-446655440002', 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', true),

-- Property 4 media
('450e8400-e29b-41d4-a716-446655440003', 'image', 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop', true),

-- Property 5 media
('450e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', true),

-- Property 6 media
('450e8400-e29b-41d4-a716-446655440005', 'image', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop', true);

-- Note: For production use, you should:
-- 1. Create actual users through Supabase Auth (sign up process)
-- 2. Get their real UUIDs from the auth.users table
-- 3. Update the user_id references in the properties table accordingly
