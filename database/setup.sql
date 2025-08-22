-- ============================================================================
-- CARDINAL DATABASE SETUP SCRIPT
-- Complete database initialization for all environments
-- ============================================================================

-- ============================================================================
-- ENVIRONMENT DETECTION AND SETUP
-- ============================================================================

-- Check if this is a fresh installation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    RAISE NOTICE 'Starting fresh Cardinal database installation...';
  ELSE
    RAISE NOTICE 'Existing Cardinal database detected. Running migrations...';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION EXECUTION
-- ============================================================================

-- Execute migrations in order
\echo 'Running migration 001_foundation...'
\i 001_foundation.sql

\echo 'Running migration 002_travel_requirements...'
\i 002_travel_requirements.sql

\echo 'Running migration 003_itineraries...'
\i 003_itineraries.sql

-- ============================================================================
-- POST-INSTALLATION VALIDATION
-- ============================================================================

-- Validate all tables were created
DO $$
DECLARE
  table_count INTEGER;
  expected_tables TEXT[] := ARRAY[
    'users', 'auth_sessions', 'countries', 'cities', 'places',
    'travel_requirements', 'ai_generation_sessions', 'ai_conversation_messages',
    'destination_suggestions', 'itineraries', 'itinerary_days', 
    'itinerary_activities', 'activity_transitions', 'itinerary_refinements',
    'itinerary_feedback', 'schema_migrations'
  ];
  missing_tables TEXT[] := '{}';
  table_name TEXT;
BEGIN
  -- Check for missing tables
  FOREACH table_name IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  -- Report results
  SELECT count(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = ANY(expected_tables);
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Created % tables with full schema', table_count;
  END IF;
END $$;

-- ============================================================================
-- DATABASE STATISTICS
-- ============================================================================

-- Show database statistics
DO $$
DECLARE
  stats_record RECORD;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CARDINAL DATABASE SETUP COMPLETE';
  RAISE NOTICE '============================================================================';
  
  -- Count tables by category
  SELECT 
    COUNT(*) FILTER (WHERE table_name IN ('users', 'auth_sessions')) as auth_tables,
    COUNT(*) FILTER (WHERE table_name IN ('countries', 'cities', 'places')) as geo_tables,
    COUNT(*) FILTER (WHERE table_name IN ('travel_requirements', 'ai_generation_sessions', 'ai_conversation_messages', 'destination_suggestions')) as ai_tables,
    COUNT(*) FILTER (WHERE table_name IN ('itineraries', 'itinerary_days', 'itinerary_activities', 'activity_transitions', 'itinerary_refinements', 'itinerary_feedback')) as itinerary_tables
  INTO stats_record
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  RAISE NOTICE 'Authentication tables: %', stats_record.auth_tables;
  RAISE NOTICE 'Geographic tables: %', stats_record.geo_tables;
  RAISE NOTICE 'AI/Generation tables: %', stats_record.ai_tables;
  RAISE NOTICE 'Itinerary tables: %', stats_record.itinerary_tables;
  
  -- Show extension status
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ENABLED EXTENSIONS:';
  FOR stats_record IN 
    SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')
  LOOP
    RAISE NOTICE '✓ %', stats_record.extname;
  END LOOP;
  
  -- Show sample data counts
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SAMPLE DATA:';
  SELECT COUNT(*) INTO stats_record FROM countries;
  RAISE NOTICE 'Countries: %', stats_record;
  
  SELECT COUNT(*) INTO stats_record FROM cities;
  RAISE NOTICE 'Cities: %', stats_record;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'DATABASE READY FOR CARDINAL APPLICATION';
  RAISE NOTICE '============================================================================';
END $$;