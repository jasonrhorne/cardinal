#!/usr/bin/env node

/**
 * Cardinal Database Connection Test
 *
 * This script tests database connectivity and validates the schema deployment.
 * Run with: node database/test-connection.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Test database connectivity
 */
async function testConnection() {
  console.log('🔗 Testing database connection...')

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

/**
 * Validate required extensions are installed
 */
async function validateExtensions() {
  console.log('🔧 Validating PostgreSQL extensions...')

  const requiredExtensions = ['uuid-ossp', 'postgis', 'pg_trgm']

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')",
    })

    if (error) {
      throw error
    }

    const installedExtensions = data.map(row => row.extname)
    const missingExtensions = requiredExtensions.filter(
      ext => !installedExtensions.includes(ext)
    )

    if (missingExtensions.length > 0) {
      console.error(
        '❌ Missing required extensions:',
        missingExtensions.join(', ')
      )
      return false
    }

    console.log(
      '✅ All required extensions are installed:',
      installedExtensions.join(', ')
    )
    return true
  } catch (error) {
    console.error('❌ Extension validation failed:', error.message)
    return false
  }
}

/**
 * Validate all required tables exist
 */
async function validateTables() {
  console.log('📋 Validating database schema...')

  const expectedTables = [
    'users',
    'auth_sessions',
    'countries',
    'cities',
    'places',
    'travel_requirements',
    'ai_generation_sessions',
    'ai_conversation_messages',
    'destination_suggestions',
    'itineraries',
    'itinerary_days',
    'itinerary_activities',
    'activity_transitions',
    'itinerary_refinements',
    'itinerary_feedback',
    'schema_migrations',
  ]

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `,
    })

    if (error) {
      throw error
    }

    const existingTables = data.map(row => row.table_name)
    const missingTables = expectedTables.filter(
      table => !existingTables.includes(table)
    )

    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:', missingTables.join(', '))
      return false
    }

    console.log('✅ All required tables exist')
    console.log(
      `   Found ${existingTables.length} tables:`,
      existingTables.join(', ')
    )
    return true
  } catch (error) {
    console.error('❌ Table validation failed:', error.message)
    return false
  }
}

/**
 * Validate migration records
 */
async function validateMigrations() {
  console.log('📝 Validating migration records...')

  const expectedMigrations = [
    '001_foundation',
    '002_travel_requirements',
    '003_itineraries',
  ]

  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version, description, applied_at')
      .order('applied_at')

    if (error) {
      throw error
    }

    const appliedMigrations = data.map(row => row.version)
    const missingMigrations = expectedMigrations.filter(
      migration => !appliedMigrations.includes(migration)
    )

    if (missingMigrations.length > 0) {
      console.error(
        '❌ Missing migration records:',
        missingMigrations.join(', ')
      )
      return false
    }

    console.log('✅ All migrations have been applied:')
    data.forEach(migration => {
      console.log(`   ${migration.version}: ${migration.description}`)
    })

    return true
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message)
    return false
  }
}

/**
 * Test basic CRUD operations
 */
async function testCrudOperations() {
  console.log('🧪 Testing basic CRUD operations...')

  try {
    // Test read operations on seed data
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('name, iso_code_2')
      .limit(3)

    if (countriesError) {
      throw countriesError
    }

    console.log('✅ Read operations working')
    console.log(`   Sample countries: ${countries.map(c => c.name).join(', ')}`)

    // Test cities with geographic data
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('name, coordinates')
      .limit(3)

    if (citiesError) {
      throw citiesError
    }

    console.log('✅ Geographic data accessible')
    console.log(`   Sample cities: ${cities.map(c => c.name).join(', ')}`)

    return true
  } catch (error) {
    console.error('❌ CRUD operations test failed:', error.message)
    return false
  }
}

/**
 * Test Row Level Security policies
 */
async function testRlsPolicies() {
  console.log('🔒 Testing Row Level Security policies...')

  try {
    // Create anon client (no auth)
    const anonClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test public data access
    const { data: countries, error: countriesError } = await anonClient
      .from('countries')
      .select('name')
      .limit(1)

    if (countriesError) {
      throw new Error(`Countries access failed: ${countriesError.message}`)
    }

    // Test protected data access (should be restricted)
    const { data: users, error: usersError } = await anonClient
      .from('users')
      .select('email')
      .limit(1)

    // This should fail due to RLS
    if (!usersError) {
      throw new Error(
        'RLS not working - anonymous access to users table succeeded'
      )
    }

    console.log('✅ Row Level Security policies are working correctly')
    console.log('   Public data accessible, protected data properly restricted')

    return true
  } catch (error) {
    console.error('❌ RLS policy test failed:', error.message)
    return false
  }
}

/**
 * Generate database statistics
 */
async function generateStats() {
  console.log('📊 Generating database statistics...')

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
          LIMIT 10
        `,
    })

    if (error) {
      throw error
    }

    console.log('📈 Database Statistics:')
    console.log('   Table Name | Size | Inserts | Updates | Deletes')
    console.log('   --------------------------------')
    data.forEach(row => {
      console.log(
        `   ${row.tablename.padEnd(12)} | ${row.size.padEnd(8)} | ${row.inserts.toString().padEnd(7)} | ${row.updates.toString().padEnd(7)} | ${row.deletes}`
      )
    })

    return true
  } catch (error) {
    console.error('❌ Statistics generation failed:', error.message)
    return false
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Cardinal Database Connectivity Test')
  console.log('=====================================\n')

  const tests = [
    { name: 'Database Connection', test: testConnection },
    { name: 'PostgreSQL Extensions', test: validateExtensions },
    { name: 'Database Schema', test: validateTables },
    { name: 'Migration Records', test: validateMigrations },
    { name: 'CRUD Operations', test: testCrudOperations },
    { name: 'RLS Policies', test: testRlsPolicies },
    { name: 'Database Statistics', test: generateStats },
  ]

  let passed = 0
  let failed = 0

  for (const { name, test } of tests) {
    try {
      const result = await test()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`❌ ${name} test failed with error:`, error.message)
      failed++
    }
    console.log('') // Add spacing between tests
  }

  console.log('=====================================')
  console.log('🎯 Test Results Summary')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${passed + failed}`)

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
    process.exit(1)
  } else {
    console.log(
      '\n🎉 All tests passed! Database is ready for Cardinal application.'
    )
    process.exit(0)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the tests
runTests()
