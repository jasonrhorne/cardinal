# Cardinal Database Setup - Complete Guide

This is the master setup guide for Cardinal's database infrastructure. Follow this guide for initial setup or when setting up new environments.

## Prerequisites

Before starting, ensure you have:

- [x] Supabase account created
- [x] Node.js 18+ installed
- [x] Git repository cloned
- [x] npm dependencies installed (`npm install`)

## Quick Start

For immediate setup of a development environment:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see Environment Setup section)
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Deploy database schema
npm run db:deploy:dev

# 4. Test connectivity
npm run db:test

# 5. Verify setup
npm run env:validate
```

## Detailed Setup Process

### Step 1: Create Supabase Project

1. **Sign up/Login** to [Supabase](https://app.supabase.com)
2. **Create new project**:
   - Organization: Your organization
   - Name: `cardinal-dev` (or appropriate environment name)
   - Database Password: Use a strong password
   - Region: Choose closest to your users
3. **Wait for provisioning** (2-3 minutes)
4. **Copy project credentials**:
   - Project URL (from Settings → API)
   - Anon public key (from Settings → API)
   - Service role secret key (from Settings → API)
   - Database URL (from Settings → Database)

### Step 2: Environment Configuration

Create environment file for your setup:

```bash
# For development
cp .env.example .env.local

# For staging
cp .env.staging.example .env.staging

# For production
cp .env.production.example .env.production
```

Edit the appropriate file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

### Step 3: Database Schema Deployment

Deploy the complete Cardinal database schema:

```bash
# Deploy to development
npm run db:deploy:dev

# Or deploy with explicit environment
node database/deploy.js development
```

The deployment script will:

- ✅ Test database connectivity
- ✅ Check for existing schema
- ✅ Apply all migrations in order
- ✅ Validate deployment success
- ✅ Generate deployment summary

### Step 4: Verify Setup

Run comprehensive connectivity tests:

```bash
npm run db:test
```

This will verify:

- ✅ Database connection
- ✅ PostgreSQL extensions (PostGIS, UUID, trigram)
- ✅ All required tables exist
- ✅ Migration records are correct
- ✅ CRUD operations work
- ✅ Row Level Security is enforced
- ✅ Generate database statistics

### Step 5: Application Integration

Test that your Next.js application can connect:

```bash
# Validate environment configuration
npm run env:validate

# Check environment detection
npm run env:check

# Run development server
npm run dev
```

Visit `http://localhost:3000` and verify the application loads correctly.

## Environment-Specific Setup

### Development Environment

**Purpose**: Local development and testing
**Database**: `cardinal-dev`
**Configuration**: `.env.local`

```bash
# Setup development environment
npm run db:deploy:dev
npm run db:test
npm run dev
```

**Features**:

- Enhanced logging enabled
- Debug mode available
- Sample data for testing
- Relaxed security for development

### Staging Environment

**Purpose**: Pre-production testing and QA
**Database**: `cardinal-staging`
**Configuration**: `.env.staging`

```bash
# Setup staging environment
npm run db:deploy:staging
npm run db:test
```

**Features**:

- Production-like configuration
- Full security enforcement
- Performance monitoring
- Integration testing data

### Production Environment

**Purpose**: Live application serving users
**Database**: `cardinal-prod`
**Configuration**: `.env.production`

⚠️ **IMPORTANT**: Production deployment requires confirmation

```bash
# Setup production environment (requires --confirm flag)
npm run db:deploy:prod
npm run db:test
```

**Features**:

- Maximum security settings
- Full audit logging
- Real-time monitoring
- Automated backups
- Performance optimization

## Database Schema Overview

Cardinal's database consists of three main migration layers:

### 001_foundation.sql

**Core Infrastructure**

- PostgreSQL extensions (UUID, PostGIS, trigram)
- User authentication system
- Geographic data (countries, cities, places)
- Row Level Security policies
- Basic indexes and triggers

### 002_travel_requirements.sql

**AI Generation System**

- Travel requirements capture
- AI generation sessions tracking
- Conversation message storage
- Destination suggestions
- Token usage and cost tracking

### 003_itineraries.sql

**Itinerary Management**

- Complete itinerary structure
- Daily schedules and activities
- Activity transitions and logistics
- Refinement and feedback systems
- Sharing and collaboration features

## Security Configuration

Cardinal implements comprehensive security measures:

### Row Level Security (RLS)

- **User Data**: Users can only access their own data
- **Public Data**: Countries, cities, places are publicly readable
- **Itineraries**: Support both private and public sharing
- **AI Data**: Strict user scoping for conversations and sessions

### API Key Management

- **Service Role Key**: Server-side only, full access, bypasses RLS
- **Anon Key**: Client-side safe, RLS enforced, public operations

### Environment Isolation

- Separate databases for development, staging, production
- Different security levels for each environment
- Isolated data and configurations

For detailed security information, see [SECURITY.md](./SECURITY.md).

## Monitoring and Maintenance

Cardinal includes comprehensive monitoring:

### Built-in Monitoring

- Supabase dashboard metrics
- Performance monitoring
- Connection pool tracking
- Error rate monitoring

### Custom Monitoring

- Application-level metrics
- Business logic tracking
- Security event monitoring
- Custom alerting system

### Backup Strategy

- Automated Supabase backups
- Custom backup scripts
- Point-in-time recovery
- Cross-region replication

For detailed monitoring information, see [MONITORING.md](./MONITORING.md).

## Troubleshooting

### Common Issues

#### Connection Failed

**Symptoms**: Database connection errors, timeout issues
**Solutions**:

1. Verify environment variables are set correctly
2. Check Supabase project is active
3. Validate network connectivity
4. Confirm database password is correct

```bash
# Test basic connectivity
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); supabase.from('countries').select('count').then(console.log);"
```

#### Migration Failures

**Symptoms**: Deployment script errors, missing tables
**Solutions**:

1. Check migration file syntax
2. Verify dependencies are installed
3. Ensure migrations run in correct order
4. Review PostgreSQL error logs

```bash
# Re-run specific migration
node database/deploy.js development
```

#### RLS Policy Issues

**Symptoms**: Access denied errors, unexpected data filtering
**Solutions**:

1. Verify authentication context
2. Check RLS policy definitions
3. Test with service role key
4. Review user session data

```bash
# Test RLS policies
npm run db:test
```

#### Performance Issues

**Symptoms**: Slow queries, high response times
**Solutions**:

1. Review query execution plans
2. Check index usage
3. Monitor connection pool
4. Analyze slow query logs

```bash
# Monitor database performance
node -e "console.log('Check Supabase dashboard for performance metrics')"
```

### Getting Help

- **Database Issues**: Check [README.md](./README.md) for detailed documentation
- **Security Questions**: Review [SECURITY.md](./SECURITY.md)
- **Monitoring Setup**: See [MONITORING.md](./MONITORING.md)
- **Application Integration**: Check main project documentation

## Database Management Commands

Cardinal provides several npm scripts for database management:

```bash
# Database deployment
npm run db:deploy          # Deploy to default environment
npm run db:deploy:dev       # Deploy to development
npm run db:deploy:staging   # Deploy to staging
npm run db:deploy:prod      # Deploy to production (requires --confirm)

# Testing and validation
npm run db:test            # Run connectivity and validation tests
npm run db:setup           # Full setup: deploy + test

# Environment management
npm run env:validate       # Validate environment configuration
npm run env:check          # Check current environment detection
```

## Maintenance Schedule

### Daily Tasks

- Monitor Supabase dashboard for alerts
- Review error logs and performance metrics
- Check backup completion status

### Weekly Tasks

- Review security events and access patterns
- Analyze query performance and optimization opportunities
- Update environment configurations if needed

### Monthly Tasks

- Full security audit and access review
- Performance analysis and optimization
- Review and update documentation

### Quarterly Tasks

- Complete database schema review
- Disaster recovery testing
- Security penetration testing
- Capacity planning and scaling assessment

## Next Steps After Setup

Once your database is set up and validated:

1. **Configure Application Features**:
   - Set up authentication flows
   - Configure AI generation settings
   - Test itinerary creation workflows

2. **Set Up Monitoring**:
   - Configure alerting thresholds
   - Set up monitoring dashboards
   - Implement custom metrics

3. **Security Hardening**:
   - Review and customize RLS policies
   - Set up audit logging
   - Configure backup validation

4. **Performance Optimization**:
   - Monitor query performance
   - Optimize indexes based on usage
   - Configure connection pooling

5. **Team Onboarding**:
   - Share environment setup guides
   - Document operational procedures
   - Train team on monitoring and troubleshooting

## Conclusion

You now have a fully configured Cardinal database with:

✅ **Complete Schema**: All tables, indexes, and relationships
✅ **Security**: Row Level Security and access controls
✅ **Monitoring**: Comprehensive monitoring and alerting
✅ **Backup**: Automated backup and recovery systems
✅ **Documentation**: Complete setup and maintenance guides

The database is ready to support Cardinal's AI-powered travel itinerary generation with robust security, performance, and scalability.

For additional support or questions, refer to the detailed documentation in this directory or contact the Cardinal development team.
