# Cardinal Database Setup Guide

This document provides comprehensive instructions for setting up and managing Cardinal's PostgreSQL database with PostGIS using Supabase.

## Overview

Cardinal uses a PostgreSQL database with PostGIS extensions for geospatial functionality. The database schema is designed to support:

- User authentication and profiles
- Geographic data (countries, cities, places)
- Travel requirements and AI generation sessions
- Complete itinerary management with activities and refinements
- Real-time collaboration and sharing features

## Database Structure

The database consists of three main migration scripts:

- `001_foundation.sql` - Core user management, authentication, and geographic foundation
- `002_travel_requirements.sql` - Travel requirements capture and AI generation system
- `003_itineraries.sql` - Complete itinerary management with activities and refinements

## Environment Setup

### Prerequisites

- Supabase account
- Node.js project with environment variables configured
- PostgreSQL client (psql) for local development

### Environment Variables

Ensure the following environment variables are configured in your `.env` files:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres
```

## Supabase Project Setup

### 1. Create Supabase Project

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and project name: `cardinal-[environment]`
4. Select region closest to your users
5. Set a strong database password
6. Wait for project provisioning (2-3 minutes)

### 2. Configure Project Settings

1. Navigate to Project Settings → API
2. Copy the Project URL and anon public key
3. Copy the service_role secret key (keep secure)
4. Navigate to Project Settings → Database
5. Copy the connection string

## Database Deployment

### Option 1: Using Supabase Dashboard (Recommended for Initial Setup)

1. Open Supabase Dashboard → SQL Editor
2. Execute migrations in order:
   - Copy and paste `001_foundation.sql`
   - Execute and verify success
   - Copy and paste `002_travel_requirements.sql`
   - Execute and verify success
   - Copy and paste `003_itineraries.sql`
   - Execute and verify success

### Option 2: Using psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres"

# Run the complete setup script
\i database/setup.sql

# Or run migrations individually
\i database/migrations/001_foundation.sql
\i database/migrations/002_travel_requirements.sql
\i database/migrations/003_itineraries.sql
```

### Option 3: Using Node.js Script

```bash
# Create a deployment script
npm run db:migrate

# Or manually with the Supabase client
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  const sql = fs.readFileSync('database/setup.sql', 'utf8');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) console.error('Migration failed:', error);
  else console.log('Migration completed successfully');
}

runMigration();
"
```

## Verification Steps

### 1. Check Extensions

```sql
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm');
```

Expected output:

```
   extname
-----------
 uuid-ossp
 postgis
 pg_trgm
```

### 2. Verify Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:

- activity_transitions
- ai_conversation_messages
- ai_generation_sessions
- auth_sessions
- cities
- countries
- destination_suggestions
- itineraries
- itinerary_activities
- itinerary_days
- itinerary_feedback
- itinerary_refinements
- places
- schema_migrations
- travel_requirements
- users

### 3. Test Database Connectivity

```bash
# Test from Node.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase.from('countries').select('count').single()
  .then(({ data, error }) => {
    if (error) console.error('Connection failed:', error);
    else console.log('✅ Database connection successful');
  });
"
```

## Row Level Security (RLS) Configuration

Our database implements comprehensive RLS policies:

### User Data Protection

- Users can only access their own profiles and data
- Authentication sessions are user-scoped
- Travel requirements and AI sessions are private

### Public Data Access

- Countries and cities are publicly readable
- Places are publicly readable
- Public itineraries can be viewed by anyone

### Security Best Practices

- All sensitive tables have RLS enabled
- Service role key is used only for admin operations
- Anon key is used for client-side operations

## Environment-Specific Setup

### Development Environment

1. Create development Supabase project: `cardinal-dev`
2. Use `.env.local` for configuration
3. Enable additional logging and debug features
4. Seed with sample data for testing

### Staging Environment

1. Create staging Supabase project: `cardinal-staging`
2. Use `.env.staging` for configuration
3. Mirror production setup with test data
4. Enable monitoring and analytics

### Production Environment

1. Create production Supabase project: `cardinal-prod`
2. Use `.env.production` for configuration
3. Enable all security features
4. Configure backup and monitoring
5. Set up alerting for critical issues

## Performance Optimization

### Indexes

All critical indexes are created automatically by migrations:

- Geographic indexes using GIST for spatial queries
- Composite indexes for common query patterns
- Unique indexes for data integrity
- Partial indexes for filtered queries

### Query Optimization

```sql
-- Example: Find nearby places
SELECT p.*, ST_Distance(p.coordinates, ST_GeogFromText('POINT(-122.4194 37.7749)')) as distance
FROM places p
WHERE ST_DWithin(p.coordinates, ST_GeogFromText('POINT(-122.4194 37.7749)'), 1000)
ORDER BY distance
LIMIT 10;
```

## Backup and Recovery

### Automated Backups

Supabase provides automated daily backups for all projects. Additional considerations:

1. **Point-in-Time Recovery**: Available for Pro+ plans
2. **Manual Backups**: Use pg_dump for critical migrations
3. **Cross-Region Backups**: Consider for production

### Manual Backup

```bash
# Full database backup
pg_dump "postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres" > backup.sql

# Schema-only backup
pg_dump --schema-only "postgresql://..." > schema.sql

# Data-only backup
pg_dump --data-only "postgresql://..." > data.sql
```

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Connection Pool Usage**
2. **Query Performance**
3. **Storage Usage**
4. **Active Sessions**
5. **Error Rates**

### Maintenance Tasks

1. **Weekly**: Review slow query logs
2. **Monthly**: Analyze storage growth
3. **Quarterly**: Review and optimize indexes
4. **Annually**: Plan for scaling needs

### Health Check Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check environment variables and network access
2. **Migration Failures**: Verify dependencies and run migrations in order
3. **RLS Denials**: Ensure proper authentication context
4. **Performance Issues**: Check indexes and query patterns

### Debug Mode

Enable detailed logging in development:

```javascript
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { debug: true },
  global: { debug: true },
})
```

## Security Considerations

1. **Never commit service role keys to version control**
2. **Use environment variables for all credentials**
3. **Regularly rotate database passwords**
4. **Monitor for unusual query patterns**
5. **Keep Supabase client libraries updated**
6. **Use RLS policies for all sensitive data**

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Cardinal Team: Internal Slack #database-support
