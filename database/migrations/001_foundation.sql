-- ============================================================================
-- CARDINAL DATABASE MIGRATION 001: FOUNDATION
-- Version: 1.0.0
-- Description: Initial database setup with extensions and core tables
-- Dependencies: None
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom UUID generation function
CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $$
BEGIN
  RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Users table (minimal PII approach)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'
);

-- Authentication sessions (magic link implementation)
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_consumed BOOLEAN DEFAULT false
);

-- ============================================================================
-- GEOGRAPHIC FOUNDATION
-- ============================================================================

-- Countries for geographic hierarchy
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  iso_code_2 CHAR(2) UNIQUE NOT NULL,
  iso_code_3 CHAR(3) UNIQUE NOT NULL,
  continent TEXT NOT NULL CHECK (continent IN (
    'Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'
  )),
  currency_code CHAR(3),
  phone_prefix VARCHAR(10),
  bounds GEOMETRY(POLYGON, 4326),
  capital_coordinates GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cities with PostGIS coordinates
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  elevation_meters INTEGER,
  timezone TEXT NOT NULL,
  admin_level_1 TEXT, -- State/Province
  admin_level_2 TEXT, -- County/Region
  population INTEGER,
  area_km2 DECIMAL(10,2),
  founded_year INTEGER,
  is_tourist_destination BOOLEAN DEFAULT false,
  is_major_airport_hub BOOLEAN DEFAULT false,
  typical_visit_duration_days INTEGER,
  geonames_id INTEGER UNIQUE,
  wikidata_id TEXT,
  city_character TEXT,
  famous_for TEXT[] DEFAULT '{}',
  best_seasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PLACES AND POINTS OF INTEREST
-- ============================================================================

-- Comprehensive places table with PostGIS
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES cities(id),
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  postal_code TEXT,
  floor_level TEXT,
  
  -- Place categorization
  place_type TEXT NOT NULL CHECK (place_type IN (
    'restaurant', 'cafe', 'bar', 'attraction', 'museum', 'park', 'hotel',
    'shop', 'market', 'viewpoint', 'beach', 'landmark', 'entertainment',
    'transportation', 'service', 'religious', 'educational', 'sports'
  )),
  subcategory TEXT,
  
  -- External integration
  google_place_id TEXT UNIQUE,
  google_rating DECIMAL(2,1) CHECK (google_rating >= 0 AND google_rating <= 5),
  google_review_count INTEGER DEFAULT 0,
  
  -- Contact and basic info
  phone TEXT,
  website TEXT,
  email TEXT,
  
  -- Operational details
  business_hours JSONB,
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  accepts_reservations BOOLEAN,
  reservation_required BOOLEAN DEFAULT false,
  
  -- Accessibility and inclusivity
  wheelchair_accessible BOOLEAN,
  hearing_loop_available BOOLEAN,
  braille_menu_available BOOLEAN,
  service_dog_friendly BOOLEAN DEFAULT true,
  
  -- Family considerations
  kid_friendly BOOLEAN,
  min_age_restriction INTEGER,
  stroller_accessible BOOLEAN,
  changing_facilities BOOLEAN,
  high_chair_available BOOLEAN,
  
  -- Dietary options (for restaurants/cafes)
  cuisine_types TEXT[] DEFAULT '{}',
  dietary_options TEXT[] DEFAULT '{}',
  alcohol_served BOOLEAN,
  
  -- Amenities and features
  amenities TEXT[] DEFAULT '{}',
  atmosphere_tags TEXT[] DEFAULT '{}',
  
  -- Capacity and logistics
  typical_visit_duration_minutes INTEGER,
  capacity_people INTEGER,
  busy_times JSONB,
  
  -- Content for recommendations
  description TEXT,
  why_visit TEXT,
  insider_tips TEXT,
  best_time_to_visit TEXT,
  
  -- Quality and validation
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'validated', 'needs_update', 'closed', 'invalid'
  )),
  last_validated_at TIMESTAMPTZ,
  validation_source TEXT,
  
  -- Analytics
  recommendation_count INTEGER DEFAULT 0,
  user_rating_avg DECIMAL(2,1),
  user_rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ESSENTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- User authentication indexes
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions (user_id);
CREATE INDEX idx_auth_sessions_token_hash ON auth_sessions (token_hash);
CREATE INDEX idx_auth_sessions_active_tokens ON auth_sessions (token_hash, expires_at) 
WHERE is_consumed = false;

-- Geographic indexes
CREATE INDEX idx_cities_coordinates ON cities USING GIST (coordinates);
CREATE INDEX idx_cities_country_id ON cities (country_id);
CREATE INDEX idx_places_coordinates ON places USING GIST (coordinates);
CREATE INDEX idx_places_city_type ON places (city_id, place_type);
CREATE INDEX idx_places_google_place_id ON places (google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX idx_places_validation_status ON places (validation_status);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Countries can be read by anyone (public geographic data)
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries are publicly readable" ON countries
  FOR SELECT USING (true);

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Auth sessions belong to the user
CREATE POLICY "Users can view own sessions" ON auth_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Cities and places are publicly readable
CREATE POLICY "Cities are publicly readable" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Places are publicly readable" ON places
  FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA SETUP
-- ============================================================================

-- Insert basic country data
INSERT INTO countries (name, iso_code_2, iso_code_3, continent) VALUES
  ('United States', 'US', 'USA', 'North America'),
  ('Canada', 'CA', 'CAN', 'North America'),
  ('United Kingdom', 'GB', 'GBR', 'Europe'),
  ('France', 'FR', 'FRA', 'Europe'),
  ('Germany', 'DE', 'DEU', 'Europe'),
  ('Italy', 'IT', 'ITA', 'Europe'),
  ('Spain', 'ES', 'ESP', 'Europe'),
  ('Japan', 'JP', 'JPN', 'Asia'),
  ('Australia', 'AU', 'AUS', 'Oceania')
ON CONFLICT (iso_code_2) DO NOTHING;

-- Insert sample US cities for development
INSERT INTO cities (name, country_id, coordinates, timezone, is_tourist_destination) VALUES
  ('San Francisco', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-122.4194 37.7749)'), 'America/Los_Angeles', true),
  ('New York', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-74.0060 40.7128)'), 'America/New_York', true),
  ('Los Angeles', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-118.2437 34.0522)'), 'America/Los_Angeles', true),
  ('Chicago', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-87.6298 41.8781)'), 'America/Chicago', true),
  ('Seattle', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-122.3321 47.6062)'), 'America/Los_Angeles', true),
  ('Portland', (SELECT id FROM countries WHERE iso_code_2 = 'US'), ST_GeogFromText('POINT(-122.6784 45.5152)'), 'America/Los_Angeles', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(20) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

-- Record this migration
INSERT INTO schema_migrations (version, description) VALUES 
  ('001_foundation', 'Initial database setup with extensions, users, auth, countries, cities, and places');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_foundation completed successfully';
  RAISE NOTICE 'Created tables: users, auth_sessions, countries, cities, places';
  RAISE NOTICE 'Enabled extensions: uuid-ossp, postgis, pg_trgm';
  RAISE NOTICE 'Applied RLS policies and performance indexes';
END $$;