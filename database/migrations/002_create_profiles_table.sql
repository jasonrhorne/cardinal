-- ============================================================================
-- Migration: Create User Profiles Table
-- Description: Creates the profiles table for storing user profile data and preferences
-- Date: 2025-08-26
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign key to auth.users
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic profile information
  full_name TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Travel preferences (stored as JSONB for flexibility)
  travel_preferences JSONB DEFAULT '{}' NOT NULL,
  /* Expected structure:
    {
      "budget_range": {"min": 1000, "max": 5000, "currency": "USD"},
      "travel_pace": "relaxed" | "moderate" | "packed",
      "interests": ["photography", "food", "architecture", "nature", "culture"],
      "dietary_restrictions": ["vegetarian", "vegan", "gluten-free", "halal", "kosher"],
      "accessibility_needs": ["wheelchair", "limited_mobility", "visual", "hearing"],
      "preferred_accommodation": ["hotel", "airbnb", "hostel", "boutique"],
      "travel_style": ["luxury", "comfort", "budget", "backpacking"],
      "group_composition": ["solo", "couple", "family", "friends"],
      "preferred_destinations": ["europe", "asia", "americas", "africa", "oceania"]
    }
  */
  
  -- User settings
  settings JSONB DEFAULT '{}' NOT NULL,
  /* Expected structure:
    {
      "email_notifications": true,
      "marketing_emails": false,
      "public_profile": false,
      "default_currency": "USD",
      "default_units": "metric" | "imperial",
      "timezone": "America/New_York"
    }
  */
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Soft delete support (for future)
  deleted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users cannot delete profiles (soft delete only via update)
-- No DELETE policy created

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, settings)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    jsonb_build_object(
      'email_notifications', true,
      'marketing_emails', false,
      'public_profile', false,
      'default_currency', 'USD',
      'default_units', 'imperial',
      'timezone', COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/New_York')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Sample Queries
-- ============================================================================
/*
-- Get user profile with preferences
SELECT 
  p.*,
  u.email,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id = 'user-uuid-here';

-- Update travel preferences
UPDATE public.profiles
SET 
  travel_preferences = jsonb_set(
    travel_preferences,
    '{interests}',
    '["photography", "food", "architecture"]'::jsonb
  ),
  updated_at = NOW()
WHERE user_id = 'user-uuid-here';

-- Get users by travel interest
SELECT * FROM public.profiles
WHERE travel_preferences->'interests' ? 'photography'
  AND deleted_at IS NULL;
*/

-- ============================================================================
-- Rollback Script
-- ============================================================================
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP TABLE IF EXISTS public.profiles;
*/