#!/usr/bin/env node

/**
 * Cardinal Database Deployment Script
 * 
 * This script deploys the complete Cardinal database schema to Supabase.
 * Run with: node database/deploy.js [environment]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const environment = process.argv[2] || 'development';

console.log(`🚀 Cardinal Database Deployment - ${environment.toUpperCase()}`);
console.log('================================================\n');

// Validate environment
const validEnvironments = ['development', 'staging', 'production'];
if (!validEnvironments.includes(environment)) {
  console.error('❌ Invalid environment. Use: development, staging, or production');
  process.exit(1);
}

// Load appropriate environment file
const envFiles = {
  development: '.env.local',
  staging: '.env.staging', 
  production: '.env.production'
};

const envFile = envFiles[environment];
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
  console.log(`📄 Loaded environment from ${envFile}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error(`\nEnsure ${envFile} exists and contains the required variables.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if database is already initialized
 */
async function checkExistingSchema() {
  console.log('🔍 Checking for existing schema...');
  
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('applied_at');
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, fresh install
      console.log('✨ Fresh database detected - proceeding with full installation');
      return { isExisting: false, migrations: [] };
    } else if (error) {
      throw error;
    }
    
    const existingMigrations = data.map(row => row.version);
    console.log('📋 Existing migrations found:', existingMigrations.join(', '));
    
    return { isExisting: true, migrations: existingMigrations };
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    throw error;
  }
}

/**
 * Execute a SQL file
 */
async function executeSqlFile(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  
  console.log(`📝 Executing ${filename}...`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${filename} executed successfully`);
  } catch (error) {
    console.error(`❌ ${filename} execution failed:`, error.message);
    throw error;
  }
}

/**
 * Deploy fresh schema
 */
async function deployFreshSchema() {
  console.log('🏗️  Deploying fresh database schema...\n');
  
  const migrations = [
    '001_foundation.sql',
    '002_travel_requirements.sql', 
    '003_itineraries.sql'
  ];
  
  for (const migration of migrations) {
    await executeSqlFile(migration);
  }
  
  console.log('\n✅ Fresh schema deployment completed');
}

/**
 * Apply missing migrations
 */
async function applyMissingMigrations(existingMigrations) {
  console.log('🔄 Applying missing migrations...\n');
  
  const allMigrations = [
    { file: '001_foundation.sql', version: '001_foundation' },
    { file: '002_travel_requirements.sql', version: '002_travel_requirements' },
    { file: '003_itineraries.sql', version: '003_itineraries' }
  ];
  
  const missingMigrations = allMigrations.filter(
    migration => !existingMigrations.includes(migration.version)
  );
  
  if (missingMigrations.length === 0) {
    console.log('✅ No missing migrations - database is up to date');
    return;
  }
  
  console.log(`📥 Applying ${missingMigrations.length} missing migrations:`);
  missingMigrations.forEach(m => console.log(`   - ${m.file}`));
  console.log('');
  
  for (const migration of missingMigrations) {
    await executeSqlFile(migration.file);
  }
  
  console.log('\n✅ Missing migrations applied successfully');
}

/**
 * Validate deployment
 */
async function validateDeployment() {
  console.log('\n🧪 Validating deployment...');
  
  const expectedTables = [
    'users', 'auth_sessions', 'countries', 'cities', 'places',
    'travel_requirements', 'ai_generation_sessions', 'ai_conversation_messages',
    'destination_suggestions', 'itineraries', 'itinerary_days', 
    'itinerary_activities', 'activity_transitions', 'itinerary_refinements',
    'itinerary_feedback', 'schema_migrations'
  ];
  
  try {
    // Check tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      });
    
    if (tablesError) {
      throw tablesError;
    }
    
    const existingTables = tables.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    // Check extensions
    const { data: extensions, error: extensionsError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')"
      });
    
    if (extensionsError) {
      throw extensionsError;
    }
    
    const requiredExtensions = ['uuid-ossp', 'postgis', 'pg_trgm'];
    const installedExtensions = extensions.map(row => row.extname);
    const missingExtensions = requiredExtensions.filter(ext => !installedExtensions.includes(ext));
    
    if (missingExtensions.length > 0) {
      throw new Error(`Missing extensions: ${missingExtensions.join(', ')}`);
    }
    
    // Check seed data
    const { data: countriesCount, error: countError } = await supabase
      .from('countries')
      .select('id', { count: 'exact' });
    
    if (countError) {
      throw countError;
    }
    
    console.log('✅ Deployment validation successful');
    console.log(`   📊 Tables: ${existingTables.length}/${expectedTables.length}`);
    console.log(`   🔧 Extensions: ${installedExtensions.join(', ')}`);
    console.log(`   🌍 Countries: ${countriesCount.count} records`);
    
  } catch (error) {
    console.error('❌ Deployment validation failed:', error.message);
    throw error;
  }
}

/**
 * Generate post-deployment summary
 */
async function generateSummary() {
  console.log('\n📊 Deployment Summary');
  console.log('====================');
  
  try {
    // Get migration status
    const { data: migrations, error: migrationsError } = await supabase
      .from('schema_migrations')
      .select('version, description, applied_at')
      .order('applied_at');
    
    if (migrationsError) {
      throw migrationsError;
    }
    
    console.log('\n✅ Applied Migrations:');
    migrations.forEach(migration => {
      const date = new Date(migration.applied_at).toLocaleString();
      console.log(`   ${migration.version}: ${migration.description} (${date})`);
    });
    
    // Get table statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            COUNT(*) as table_count
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        `
      });
    
    if (statsError) {
      throw statsError;
    }
    
    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total tables: ${stats[0].table_count}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Supabase URL: ${supabaseUrl}`);
    
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
  }
}

/**
 * Main deployment function
 */
async function deployDatabase() {
  try {
    // Test connection first
    console.log('🔗 Testing database connection...');
    const { error: connectionError } = await supabase
      .from('countries')
      .select('count')
      .limit(1);
    
    if (connectionError && connectionError.code !== '42P01') {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Database connection successful\n');
    
    // Check existing schema
    const { isExisting, migrations } = await checkExistingSchema();
    
    if (isExisting) {
      await applyMissingMigrations(migrations);
    } else {
      await deployFreshSchema();
    }
    
    // Validate deployment
    await validateDeployment();
    
    // Generate summary
    await generateSummary();
    
    console.log('\n🎉 Database deployment completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node database/test-connection.js');
    console.log('2. Configure your application environment variables');
    console.log('3. Test the Cardinal application');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    console.error('\nPlease check the error above and try again.');
    console.error('For help, see: database/README.md');
    process.exit(1);
  }
}

// Confirmation prompt for production
if (environment === 'production') {
  console.log('⚠️  PRODUCTION DEPLOYMENT DETECTED');
  console.log('This will modify your production database.');
  console.log('Please confirm you want to proceed...\n');
  
  // In a real CLI tool, you'd use readline for confirmation
  // For now, require explicit --confirm flag
  if (!process.argv.includes('--confirm')) {
    console.error('❌ Production deployment requires --confirm flag');
    console.error('Example: node database/deploy.js production --confirm');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});

// Run deployment
deployDatabase();