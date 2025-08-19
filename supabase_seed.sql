-- NG Rentals Seed Data for Supabase
-- Run this after the schema is created

-- Insert sample properties with Lagos and Abuja Plus Codes
INSERT INTO public.properties (user_id, title, description, price, deposit_ngn, property_type, bedrooms, bathrooms, furnished, amenities, city, state, area, plus_code, address_text, status, verified) VALUES

-- Lagos Properties
(
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1),
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
((SELECT id FROM public.properties WHERE title = 'Modern 3BR Apartment in Victoria Island'), 'image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', true),
((SELECT id FROM public.properties WHERE title = 'Modern 3BR Apartment in Victoria Island'), 'image', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop', false),
((SELECT id FROM public.properties WHERE title = 'Modern 3BR Apartment in Victoria Island'), 'tour', 'https://kuula.co/share/collection/7lJtJ?logo=0&info=0&fs=1&vr=1&sd=1', false),

-- Property 2 media
((SELECT id FROM public.properties WHERE title = 'Luxury 4BR House in Lekki'), 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', true),
((SELECT id FROM public.properties WHERE title = 'Luxury 4BR House in Lekki'), 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', false),

-- Property 3 media
((SELECT id FROM public.properties WHERE title = 'Cozy 2BR Flat in Ikeja'), 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', true),

-- Property 4 media
((SELECT id FROM public.properties WHERE title = 'Executive 5BR Duplex in Maitama'), 'image', 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop', true),

-- Property 5 media
((SELECT id FROM public.properties WHERE title = 'Modern 3BR Apartment in Wuse 2'), 'image', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', true),

-- Property 6 media
((SELECT id FROM public.properties WHERE title = 'Affordable 2BR in Kubwa'), 'image', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop', true);

-- Note: You'll need to create actual user accounts through Supabase Auth first
-- Then update the user_id references in the properties table

-- To create test users, you can use the Supabase Auth API or dashboard:
-- 1. Owner: owner@ngrentals.com (role: owner)
-- 2. Tenant: tenant@ngrentals.com (role: tenant)  
-- 3. Admin: admin@ngrentals.com (role: admin)
