-- NG Rentals Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('tenant', 'owner', 'admin')) DEFAULT 'tenant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Owner profiles
CREATE TABLE public.owner_profiles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  bank_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties
CREATE TABLE public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  deposit_ngn INTEGER,
  currency TEXT DEFAULT 'NGN',
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'shared', 'land')) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnished BOOLEAN DEFAULT FALSE,
  amenities JSONB DEFAULT '[]'::jsonb,
  city TEXT NOT NULL,
  state TEXT,
  area TEXT,
  plus_code TEXT,
  lat DECIMAL,
  lng DECIMAL,
  address_text TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media (renamed to property_media to match frontend service)
CREATE TABLE public.property_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'tour')) DEFAULT 'image',
  provider TEXT CHECK (provider IN ('kuula', 'external', 'cloudinary')) DEFAULT 'cloudinary',
  url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications
CREATE TABLE public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leases
CREATE TABLE public.leases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount_ngn INTEGER NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  status TEXT CHECK (status IN ('draft', 'active', 'ended', 'late')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  amount_ngn INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'void')) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('mock', 'paystack')) DEFAULT 'mock',
  reference TEXT NOT NULL,
  method TEXT,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  raw_webhook JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message threads
CREATE TABLE public.message_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  property_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_state ON public.properties(state);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_applications_property ON public.applications(property_id);
CREATE INDEX idx_applications_tenant ON public.applications(tenant_id);
CREATE INDEX idx_property_media_property ON public.property_media(property_id);

-- RLS (Row Level Security) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read active properties
CREATE POLICY "Anyone can read active properties" ON public.properties
  FOR SELECT USING (status = 'active');

-- Owners can CRUD their own properties
CREATE POLICY "Owners can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can read media for active properties
CREATE POLICY "Anyone can read media for active properties" ON public.property_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_media.property_id AND status = 'active'
    )
  );

-- Property owners can manage media for their properties
CREATE POLICY "Owners can manage media for own properties" ON public.property_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_media.property_id AND user_id = auth.uid()
    )
  );

-- Tenants can create applications
CREATE POLICY "Tenants can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Users can read their own applications
CREATE POLICY "Users can read own applications" ON public.applications
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() IN (
    SELECT user_id FROM public.properties WHERE id = property_id
  ));

-- Property owners can update applications for their properties
CREATE POLICY "Owners can update applications for own properties" ON public.applications
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.properties WHERE id = property_id
  ));

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
