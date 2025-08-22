-- ============================================================================
-- CARDINAL DATABASE MIGRATION 003: ITINERARIES
-- Version: 1.2.0
-- Description: Complete itinerary management with activities and refinements
-- Dependencies: 002_travel_requirements
-- ============================================================================

-- ============================================================================
-- ITINERARY SYSTEM
-- ============================================================================

-- Main itinerary table with versioning and sharing
CREATE TABLE itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_suggestion_id UUID REFERENCES destination_suggestions(id),
  
  -- Core itinerary metadata
  title TEXT NOT NULL,
  description TEXT,
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  
  -- Persona and customization
  persona_lens TEXT NOT NULL CHECK (persona_lens IN (
    'photographer', 'foodie', 'family_explorer', 'culture_chaser',
    'architecture_buff', 'nature_lover', 'adventure_seeker', 
    'history_buff', 'art_enthusiast'
  )),
  pace_preference TEXT NOT NULL DEFAULT 'moderate' CHECK (pace_preference IN ('slow', 'moderate', 'fast')),
  
  -- Status and versioning
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  parent_itinerary_id UUID REFERENCES itineraries(id),
  
  -- Sharing and collaboration
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  is_public BOOLEAN NOT NULL DEFAULT false,
  allow_comments BOOLEAN NOT NULL DEFAULT false,
  
  -- Travel logistics
  estimated_total_cost_usd DECIMAL(10,2),
  suggested_arrival_time TIME,
  suggested_departure_time TIME,
  transportation_notes TEXT,
  
  -- Quality and analytics
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  generation_model_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT parent_not_self CHECK (parent_itinerary_id != id)
);

-- Daily schedule structure
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  
  -- Day identification and sequencing
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  date DATE,
  
  -- Daily theme and content
  theme TEXT,
  overview TEXT NOT NULL,
  
  -- Logistics
  suggested_start_time TIME DEFAULT '09:00',
  suggested_end_time TIME DEFAULT '22:00',
  estimated_walking_distance_km DECIMAL(5,2),
  estimated_total_cost_usd DECIMAL(8,2),
  
  -- Weather and seasonal considerations
  weather_considerations TEXT,
  seasonal_notes TEXT,
  
  -- Flexibility and alternatives
  backup_plan TEXT,
  notes TEXT,
  
  UNIQUE(itinerary_id, day_number)
);

-- Individual activities within each day
CREATE TABLE itinerary_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id),
  
  -- Activity identification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'meal', 'attraction', 'activity', 'lodging', 'transportation', 'rest', 'shopping'
  )),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing and sequencing
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  order_in_day INTEGER NOT NULL CHECK (order_in_day > 0),
  
  -- Logistics and planning
  cost_estimate DECIMAL(8,2),
  reservation_needed BOOLEAN DEFAULT false,
  reservation_tips TEXT,
  advance_booking_days INTEGER,
  
  -- Dietary and accessibility
  dietary_accommodations TEXT[] DEFAULT '{}',
  accessibility_features TEXT[] DEFAULT '{}',
  
  -- Family considerations
  kid_friendly BOOLEAN DEFAULT null,
  min_age_recommendation INTEGER,
  stroller_friendly BOOLEAN DEFAULT null,
  
  -- Content richness
  rationale TEXT,
  insider_tips TEXT,
  photo_opportunities TEXT,
  
  -- Alternatives and flexibility
  backup_options JSONB DEFAULT '[]',
  weather_dependent BOOLEAN DEFAULT false,
  
  -- User experience tags
  tags TEXT[] DEFAULT '{}',
  
  UNIQUE(day_id, order_in_day)
);

-- Transportation segments between activities
CREATE TABLE activity_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_activity_id UUID NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  to_activity_id UUID NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  
  -- Transportation details
  transportation_mode TEXT NOT NULL CHECK (transportation_mode IN (
    'walking', 'taxi', 'public_transit', 'rental_car', 'rideshare', 'bicycle'
  )),
  estimated_duration_minutes INTEGER NOT NULL CHECK (estimated_duration_minutes >= 0),
  estimated_cost_usd DECIMAL(6,2),
  distance_km DECIMAL(8,3),
  
  -- Route instructions
  directions TEXT,
  transit_details JSONB,
  
  -- Special considerations
  accessibility_notes TEXT,
  weather_considerations TEXT,
  
  CONSTRAINT no_self_transition CHECK (from_activity_id != to_activity_id)
);

-- ============================================================================
-- ITINERARY REFINEMENT SYSTEM
-- ============================================================================

-- Track refinement requests and changes
CREATE TABLE itinerary_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_itinerary_id UUID NOT NULL REFERENCES itineraries(id),
  refined_itinerary_id UUID NOT NULL REFERENCES itineraries(id),
  
  -- Refinement request details
  refinement_type TEXT NOT NULL CHECK (refinement_type IN (
    'hotel_change', 'neighborhood_focus', 'dietary_update', 'pace_adjustment',
    'activity_swap', 'budget_adjustment', 'time_constraint', 'accessibility_update'
  )),
  user_request TEXT NOT NULL,
  
  -- Changes made
  changes_summary JSONB NOT NULL,
  ai_reasoning TEXT,
  
  -- Metadata
  processing_time_seconds INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User feedback on itineraries
CREATE TABLE itinerary_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Overall feedback
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  
  -- Specific feedback
  feedback_text TEXT,
  liked_aspects TEXT[] DEFAULT '{}',
  improvement_suggestions TEXT[] DEFAULT '{}',
  
  -- Categorical feedback
  feedback_categories TEXT[] DEFAULT '{}',
  
  -- Trip outcome
  actually_traveled BOOLEAN,
  trip_completion_percentage INTEGER CHECK (trip_completion_percentage >= 0 AND trip_completion_percentage <= 100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(itinerary_id, user_id)
);

-- ============================================================================
-- INDEXES FOR ITINERARY SYSTEM
-- ============================================================================

-- Itinerary indexes
CREATE INDEX idx_itineraries_user_created ON itineraries (user_id, created_at DESC);
CREATE INDEX idx_itineraries_destination_suggestion ON itineraries (destination_suggestion_id);
CREATE INDEX idx_itineraries_status ON itineraries (status);
CREATE INDEX idx_itineraries_share_token ON itineraries (share_token) WHERE is_public = true;
CREATE INDEX idx_itineraries_public_destination ON itineraries (destination_suggestion_id, created_at DESC) 
WHERE is_public = true AND status = 'finalized';

-- Day and activity indexes
CREATE INDEX idx_itinerary_days_itinerary_id ON itinerary_days (itinerary_id);
CREATE INDEX idx_itinerary_days_day_number ON itinerary_days (itinerary_id, day_number);
CREATE INDEX idx_itinerary_activities_day_order ON itinerary_activities (day_id, order_in_day);
CREATE INDEX idx_itinerary_activities_place_id ON itinerary_activities (place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_itinerary_activities_type ON itinerary_activities (day_id, activity_type, order_in_day);

-- Refinement and feedback indexes
CREATE INDEX idx_itinerary_refinements_original ON itinerary_refinements (original_itinerary_id);
CREATE INDEX idx_itinerary_refinements_refined ON itinerary_refinements (refined_itinerary_id);
CREATE INDEX idx_itinerary_feedback_itinerary ON itinerary_feedback (itinerary_id);
CREATE INDEX idx_itinerary_feedback_rating ON itinerary_feedback (overall_rating, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Itineraries belong to users or are public
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own itineraries" ON itineraries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public itineraries are readable" ON itineraries
  FOR SELECT USING (is_public = true AND status = 'finalized');

-- Days belong to itinerary owners
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own itinerary days" ON itinerary_days
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM itineraries WHERE id = itinerary_id)
  );

CREATE POLICY "Public itinerary days are readable" ON itinerary_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE id = itinerary_id 
      AND is_public = true 
      AND status = 'finalized'
    )
  );

-- Activities belong to itinerary owners
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activities" ON itinerary_activities
  FOR ALL USING (
    auth.uid() = (
      SELECT i.user_id 
      FROM itineraries i 
      JOIN itinerary_days d ON i.id = d.itinerary_id 
      WHERE d.id = day_id
    )
  );

CREATE POLICY "Public activities are readable" ON itinerary_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries i 
      JOIN itinerary_days d ON i.id = d.itinerary_id 
      WHERE d.id = day_id 
      AND i.is_public = true 
      AND i.status = 'finalized'
    )
  );

-- Other tables follow similar patterns
ALTER TABLE activity_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Apply update triggers
CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get complete itinerary with all activities
CREATE OR REPLACE FUNCTION get_complete_itinerary(
  p_itinerary_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'itinerary', to_jsonb(i.*),
    'days', (
      SELECT json_agg(
        json_build_object(
          'day', to_jsonb(d.*),
          'activities', (
            SELECT json_agg(
              json_build_object(
                'activity', to_jsonb(a.*),
                'place', to_jsonb(p.*)
              ) ORDER BY a.order_in_day
            )
            FROM itinerary_activities a
            LEFT JOIN places p ON a.place_id = p.id
            WHERE a.day_id = d.id
          )
        ) ORDER BY d.day_number
      )
      FROM itinerary_days d
      WHERE d.itinerary_id = i.id
    )
  )
  INTO result
  FROM itineraries i
  WHERE i.id = p_itinerary_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate walking sequence for places
CREATE OR REPLACE FUNCTION get_walking_sequence(place_ids UUID[])
RETURNS TABLE (
  from_place_id UUID,
  to_place_id UUID,
  walking_time_minutes INTEGER,
  cumulative_time INTEGER
) AS $$
DECLARE
  place_id UUID;
  prev_place_id UUID;
  cumulative_time INTEGER := 0;
  walking_time INTEGER;
BEGIN
  FOREACH place_id IN ARRAY place_ids LOOP
    IF prev_place_id IS NOT NULL THEN
      -- Simple distance-based estimate (enhanced version would use actual routing)
      SELECT COALESCE(
        ROUND(ST_Distance(p1.coordinates, p2.coordinates) / 80)::INTEGER, -- ~80m/min walking speed
        15 -- Default 15 minutes if no coordinates
      ) INTO walking_time
      FROM places p1, places p2
      WHERE p1.id = prev_place_id AND p2.id = place_id;
      
      cumulative_time := cumulative_time + walking_time;
      
      RETURN QUERY SELECT prev_place_id, place_id, walking_time, cumulative_time;
    END IF;
    prev_place_id := place_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Record this migration
INSERT INTO schema_migrations (version, description) VALUES 
  ('003_itineraries', 'Complete itinerary management with activities, refinements, and feedback');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 003_itineraries completed successfully';
  RAISE NOTICE 'Created tables: itineraries, itinerary_days, itinerary_activities, activity_transitions, itinerary_refinements, itinerary_feedback';
  RAISE NOTICE 'Applied RLS policies and performance indexes';
  RAISE NOTICE 'Added utility functions for complete itinerary retrieval and walking sequences';
END $$;