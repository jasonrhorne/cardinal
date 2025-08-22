/**
 * Database Type Definitions
 * Generated from F010 Database Schema Design
 * 
 * This file contains TypeScript types for all database tables
 * and their relationships based on the Cardinal schema.
 */

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          email_verified: boolean
          created_at: string
          updated_at: string
          last_active_at: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          email: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_active_at?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_active_at?: string | null
          preferences?: Json | null
        }
      }
      auth_sessions: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at: string
          is_consumed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at?: string
          is_consumed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          expires_at?: string
          created_at?: string
          is_consumed?: boolean
        }
      }
      countries: {
        Row: {
          id: number
          name: string
          iso_code_2: string
          iso_code_3: string
          continent: string
          currency_code: string | null
          phone_prefix: string | null
          bounds: unknown | null // PostGIS geometry
          capital_coordinates: unknown | null // PostGIS geography
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          iso_code_2: string
          iso_code_3: string
          continent: string
          currency_code?: string | null
          phone_prefix?: string | null
          bounds?: unknown | null
          capital_coordinates?: unknown | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          iso_code_2?: string
          iso_code_3?: string
          continent?: string
          currency_code?: string | null
          phone_prefix?: string | null
          bounds?: unknown | null
          capital_coordinates?: unknown | null
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          country_id: number
          coordinates: unknown // PostGIS geography
          elevation_meters: number | null
          timezone: string
          admin_level_1: string | null
          admin_level_2: string | null
          population: number | null
          area_km2: number | null
          founded_year: number | null
          is_tourist_destination: boolean
          is_major_airport_hub: boolean
          typical_visit_duration_days: number | null
          geonames_id: number | null
          wikidata_id: string | null
          city_character: string | null
          famous_for: string[]
          best_seasons: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country_id: number
          coordinates: unknown
          elevation_meters?: number | null
          timezone: string
          admin_level_1?: string | null
          admin_level_2?: string | null
          population?: number | null
          area_km2?: number | null
          founded_year?: number | null
          is_tourist_destination?: boolean
          is_major_airport_hub?: boolean
          typical_visit_duration_days?: number | null
          geonames_id?: number | null
          wikidata_id?: string | null
          city_character?: string | null
          famous_for?: string[]
          best_seasons?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country_id?: number
          coordinates?: unknown
          elevation_meters?: number | null
          timezone?: string
          admin_level_1?: string | null
          admin_level_2?: string | null
          population?: number | null
          area_km2?: number | null
          founded_year?: number | null
          is_tourist_destination?: boolean
          is_major_airport_hub?: boolean
          typical_visit_duration_days?: number | null
          geonames_id?: number | null
          wikidata_id?: string | null
          city_character?: string | null
          famous_for?: string[]
          best_seasons?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      places: {
        Row: {
          id: string
          name: string
          city_id: string
          neighborhood_id: string | null
          coordinates: unknown // PostGIS geography
          address: string | null
          postal_code: string | null
          floor_level: string | null
          place_type: string
          subcategory: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number
          phone: string | null
          website: string | null
          email: string | null
          business_hours: Json | null
          price_level: number | null
          accepts_reservations: boolean | null
          reservation_required: boolean
          wheelchair_accessible: boolean | null
          hearing_loop_available: boolean | null
          braille_menu_available: boolean | null
          service_dog_friendly: boolean
          kid_friendly: boolean | null
          min_age_restriction: number | null
          stroller_accessible: boolean | null
          changing_facilities: boolean | null
          high_chair_available: boolean | null
          cuisine_types: string[]
          dietary_options: string[]
          alcohol_served: boolean | null
          amenities: string[]
          atmosphere_tags: string[]
          typical_visit_duration_minutes: number | null
          capacity_people: number | null
          busy_times: Json | null
          description: string | null
          why_visit: string | null
          insider_tips: string | null
          best_time_to_visit: string | null
          validation_status: string
          last_validated_at: string | null
          validation_source: string | null
          recommendation_count: number
          user_rating_avg: number | null
          user_rating_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city_id: string
          neighborhood_id?: string | null
          coordinates: unknown
          address?: string | null
          postal_code?: string | null
          floor_level?: string | null
          place_type: string
          subcategory?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number
          phone?: string | null
          website?: string | null
          email?: string | null
          business_hours?: Json | null
          price_level?: number | null
          accepts_reservations?: boolean | null
          reservation_required?: boolean
          wheelchair_accessible?: boolean | null
          hearing_loop_available?: boolean | null
          braille_menu_available?: boolean | null
          service_dog_friendly?: boolean
          kid_friendly?: boolean | null
          min_age_restriction?: number | null
          stroller_accessible?: boolean | null
          changing_facilities?: boolean | null
          high_chair_available?: boolean | null
          cuisine_types?: string[]
          dietary_options?: string[]
          alcohol_served?: boolean | null
          amenities?: string[]
          atmosphere_tags?: string[]
          typical_visit_duration_minutes?: number | null
          capacity_people?: number | null
          busy_times?: Json | null
          description?: string | null
          why_visit?: string | null
          insider_tips?: string | null
          best_time_to_visit?: string | null
          validation_status?: string
          last_validated_at?: string | null
          validation_source?: string | null
          recommendation_count?: number
          user_rating_avg?: number | null
          user_rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          city_id?: string
          neighborhood_id?: string | null
          coordinates?: unknown
          address?: string | null
          postal_code?: string | null
          floor_level?: string | null
          place_type?: string
          subcategory?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number
          phone?: string | null
          website?: string | null
          email?: string | null
          business_hours?: Json | null
          price_level?: number | null
          accepts_reservations?: boolean | null
          reservation_required?: boolean
          wheelchair_accessible?: boolean | null
          hearing_loop_available?: boolean | null
          braille_menu_available?: boolean | null
          service_dog_friendly?: boolean
          kid_friendly?: boolean | null
          min_age_restriction?: number | null
          stroller_accessible?: boolean | null
          changing_facilities?: boolean | null
          high_chair_available?: boolean | null
          cuisine_types?: string[]
          dietary_options?: string[]
          alcohol_served?: boolean | null
          amenities?: string[]
          atmosphere_tags?: string[]
          typical_visit_duration_minutes?: number | null
          capacity_people?: number | null
          busy_times?: Json | null
          description?: string | null
          why_visit?: string | null
          insider_tips?: string | null
          best_time_to_visit?: string | null
          validation_status?: string
          last_validated_at?: string | null
          validation_source?: string | null
          recommendation_count?: number
          user_rating_avg?: number | null
          user_rating_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      travel_requirements: {
        Row: {
          id: string
          user_id: string
          origin_city_id: string | null
          max_travel_time_hours: number | null
          travel_modes: string[]
          group_size: number
          adults_count: number
          children_ages: number[]
          duration_days: number | null
          interests: string[]
          pace_preference: string | null
          budget_range: string | null
          dietary_restrictions: string[]
          accessibility_needs: string[]
          lodging_preferences: Json | null
          special_constraints: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          origin_city_id?: string | null
          max_travel_time_hours?: number | null
          travel_modes?: string[]
          group_size: number
          adults_count: number
          children_ages?: number[]
          duration_days?: number | null
          interests?: string[]
          pace_preference?: string | null
          budget_range?: string | null
          dietary_restrictions?: string[]
          accessibility_needs?: string[]
          lodging_preferences?: Json | null
          special_constraints?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          origin_city_id?: string | null
          max_travel_time_hours?: number | null
          travel_modes?: string[]
          group_size?: number
          adults_count?: number
          children_ages?: number[]
          duration_days?: number | null
          interests?: string[]
          pace_preference?: string | null
          budget_range?: string | null
          dietary_restrictions?: string[]
          accessibility_needs?: string[]
          lodging_preferences?: Json | null
          special_constraints?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_generation_sessions: {
        Row: {
          id: string
          user_id: string
          travel_requirements_id: string | null
          session_type: string
          status: string
          primary_model: string
          model_version: string | null
          model_temperature: number | null
          max_tokens: number | null
          parent_session_id: string | null
          refinement_depth: number
          total_tokens_used: number
          total_cost_usd: number
          processing_time_seconds: number | null
          user_satisfaction_rating: number | null
          output_quality_score: number | null
          hallucination_flags: string[]
          error_message: string | null
          retry_count: number
          started_at: string
          completed_at: string | null
          last_activity_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          travel_requirements_id?: string | null
          session_type: string
          status?: string
          primary_model: string
          model_version?: string | null
          model_temperature?: number | null
          max_tokens?: number | null
          parent_session_id?: string | null
          refinement_depth?: number
          total_tokens_used?: number
          total_cost_usd?: number
          processing_time_seconds?: number | null
          user_satisfaction_rating?: number | null
          output_quality_score?: number | null
          hallucination_flags?: string[]
          error_message?: string | null
          retry_count?: number
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          travel_requirements_id?: string | null
          session_type?: string
          status?: string
          primary_model?: string
          model_version?: string | null
          model_temperature?: number | null
          max_tokens?: number | null
          parent_session_id?: string | null
          refinement_depth?: number
          total_tokens_used?: number
          total_cost_usd?: number
          processing_time_seconds?: number | null
          user_satisfaction_rating?: number | null
          output_quality_score?: number | null
          hallucination_flags?: string[]
          error_message?: string | null
          retry_count?: number
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          metadata?: Json
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          destination_suggestion_id: string | null
          title: string
          description: string | null
          total_days: number
          persona_lens: string
          pace_preference: string
          status: string
          version: number
          parent_itinerary_id: string | null
          share_token: string
          is_public: boolean
          allow_comments: boolean
          estimated_total_cost_usd: number | null
          suggested_arrival_time: string | null
          suggested_departure_time: string | null
          transportation_notes: string | null
          ai_confidence_score: number | null
          generation_model_version: string | null
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          destination_suggestion_id?: string | null
          title: string
          description?: string | null
          total_days: number
          persona_lens: string
          pace_preference?: string
          status?: string
          version?: number
          parent_itinerary_id?: string | null
          share_token?: string
          is_public?: boolean
          allow_comments?: boolean
          estimated_total_cost_usd?: number | null
          suggested_arrival_time?: string | null
          suggested_departure_time?: string | null
          transportation_notes?: string | null
          ai_confidence_score?: number | null
          generation_model_version?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          destination_suggestion_id?: string | null
          title?: string
          description?: string | null
          total_days?: number
          persona_lens?: string
          pace_preference?: string
          status?: string
          version?: number
          parent_itinerary_id?: string | null
          share_token?: string
          is_public?: boolean
          allow_comments?: boolean
          estimated_total_cost_usd?: number | null
          suggested_arrival_time?: string | null
          suggested_departure_time?: string | null
          transportation_notes?: string | null
          ai_confidence_score?: number | null
          generation_model_version?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
      itinerary_activities: {
        Row: {
          id: string
          day_id: string
          place_id: string | null
          activity_type: string
          title: string
          description: string | null
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          order_in_day: number
          cost_estimate: number | null
          reservation_needed: boolean
          reservation_tips: string | null
          advance_booking_days: number | null
          dietary_accommodations: string[]
          accessibility_features: string[]
          kid_friendly: boolean | null
          min_age_recommendation: number | null
          stroller_friendly: boolean | null
          rationale: string | null
          insider_tips: string | null
          photo_opportunities: string | null
          backup_options: Json
          weather_dependent: boolean
          tags: string[]
        }
        Insert: {
          id?: string
          day_id: string
          place_id?: string | null
          activity_type: string
          title: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          order_in_day: number
          cost_estimate?: number | null
          reservation_needed?: boolean
          reservation_tips?: string | null
          advance_booking_days?: number | null
          dietary_accommodations?: string[]
          accessibility_features?: string[]
          kid_friendly?: boolean | null
          min_age_recommendation?: number | null
          stroller_friendly?: boolean | null
          rationale?: string | null
          insider_tips?: string | null
          photo_opportunities?: string | null
          backup_options?: Json
          weather_dependent?: boolean
          tags?: string[]
        }
        Update: {
          id?: string
          day_id?: string
          place_id?: string | null
          activity_type?: string
          title?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          order_in_day?: number
          cost_estimate?: number | null
          reservation_needed?: boolean
          reservation_tips?: string | null
          advance_booking_days?: number | null
          dietary_accommodations?: string[]
          accessibility_features?: string[]
          kid_friendly?: boolean | null
          min_age_recommendation?: number | null
          stroller_friendly?: boolean | null
          rationale?: string | null
          insider_tips?: string | null
          photo_opportunities?: string | null
          backup_options?: Json
          weather_dependent?: boolean
          tags?: string[]
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common entity types
export type User = Tables<'users'>
export type AuthSession = Tables<'auth_sessions'>
export type Country = Tables<'countries'>
export type City = Tables<'cities'>
export type Place = Tables<'places'>
export type TravelRequirements = Tables<'travel_requirements'>
export type AIGenerationSession = Tables<'ai_generation_sessions'>
export type Itinerary = Tables<'itineraries'>
export type ItineraryActivity = Tables<'itinerary_activities'>

// Enum types based on schema constraints
export type PlaceType = 
  | 'restaurant' 
  | 'cafe' 
  | 'bar' 
  | 'attraction' 
  | 'museum' 
  | 'park' 
  | 'hotel'
  | 'shop' 
  | 'market' 
  | 'viewpoint' 
  | 'beach' 
  | 'landmark' 
  | 'entertainment'
  | 'transportation' 
  | 'service' 
  | 'religious' 
  | 'educational' 
  | 'sports'

export type ActivityType = 
  | 'meal' 
  | 'attraction' 
  | 'activity' 
  | 'lodging' 
  | 'transportation' 
  | 'rest' 
  | 'shopping'

export type SessionType = 
  | 'destination_suggestions'
  | 'itinerary_generation'
  | 'itinerary_refinement'
  | 'question_answering'
  | 'place_validation'

export type SessionStatus = 
  | 'initialized' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'timed_out'

export type ItineraryStatus = 
  | 'draft' 
  | 'finalized' 
  | 'archived'

export type ValidationStatus = 
  | 'pending' 
  | 'validated' 
  | 'needs_update' 
  | 'closed' 
  | 'invalid'

export type PersonaLens = 
  | 'photographer' 
  | 'foodie' 
  | 'family_explorer' 
  | 'culture_chaser'
  | 'architecture_buff'
  | 'nature_lover'
  | 'adventure_seeker'
  | 'history_buff'
  | 'art_enthusiast'

export type PacePreference = 
  | 'slow' 
  | 'moderate' 
  | 'fast'

export type BudgetRange = 
  | 'budget' 
  | 'mid_range' 
  | 'luxury'