# Cardinal Database Security Configuration

This document outlines the security configuration for Cardinal's PostgreSQL database, including Row Level Security (RLS) policies, access controls, and best practices.

## Security Architecture Overview

Cardinal implements a multi-layered security approach:

1. **Row Level Security (RLS)** - Database-level access control
2. **API Key Management** - Supabase service vs anon key separation  
3. **Environment Isolation** - Separate databases for dev/staging/prod
4. **Audit Logging** - Track database operations and access
5. **Encryption** - Data encryption at rest and in transit

## Row Level Security Policies

### User Data Protection

All user-related tables implement strict RLS policies:

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile  
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Travel Requirements and AI Sessions

Private user data is fully protected:

```sql
-- Travel requirements belong to users
CREATE POLICY "Users can manage own travel requirements" ON travel_requirements
  FOR ALL USING (auth.uid() = user_id);

-- AI sessions belong to users
CREATE POLICY "Users can view own AI sessions" ON ai_generation_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

### Itinerary Access Control

Itineraries support both private and public access:

```sql
-- Private itineraries - owner access only
CREATE POLICY "Users can manage own itineraries" ON itineraries
  FOR ALL USING (auth.uid() = user_id);

-- Public itineraries - read-only for everyone
CREATE POLICY "Public itineraries are readable" ON itineraries
  FOR SELECT USING (is_public = true AND status = 'finalized');
```

### Geographic Data

Countries, cities, and places are publicly accessible:

```sql
-- Public geographic reference data
CREATE POLICY "Countries are publicly readable" ON countries
  FOR SELECT USING (true);

CREATE POLICY "Cities are publicly readable" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Places are publicly readable" ON places
  FOR SELECT USING (true);
```

## API Key Security

### Service Role Key (PRIVATE)

**Purpose**: Administrative operations, migrations, and backend services
**Access**: Full database access, bypasses RLS
**Storage**: Server environment variables only
**Usage**: 
- Database migrations
- Admin operations  
- Backend services
- Analytics and reporting

```javascript
// Server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // NEVER expose this
);
```

### Anon Key (PUBLIC)

**Purpose**: Client-side operations with RLS enforcement
**Access**: RLS-protected database access
**Storage**: Client-side code, environment variables
**Usage**:
- User authentication
- Client-side data operations
- Public data access

```javascript
// Client-side safe
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Safe to expose
);
```

## Environment-Specific Security

### Development Environment

**Database**: `cardinal-dev`
**Security Level**: Relaxed for development efficiency
**Configuration**:
- Enhanced logging enabled
- Debug mode allowed
- Sample data included
- Relaxed rate limits

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key
```

### Staging Environment

**Database**: `cardinal-staging`
**Security Level**: Production-like with monitoring
**Configuration**:
- Full RLS enforcement
- Audit logging enabled
- Performance monitoring
- Production-like data volume

```bash
# .env.staging  
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key
```

### Production Environment

**Database**: `cardinal-prod`
**Security Level**: Maximum security and monitoring
**Configuration**:
- Strict RLS enforcement
- Full audit logging
- Real-time monitoring
- Automated backups
- Rate limiting enabled

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
```

## Authentication Flow Security

### Magic Link Authentication

Cardinal uses magic link authentication for security:

1. **User requests login** with email
2. **System generates secure token** and stores hash
3. **Magic link sent** via email with token
4. **Token validation** against stored hash
5. **Session creation** with JWT

```sql
-- Secure session storage
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, -- Hashed, never plain text
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_consumed BOOLEAN DEFAULT false
);
```

### Session Management

- **JWT tokens** for stateless authentication
- **Automatic expiration** with configurable timeouts
- **Session invalidation** on logout
- **Concurrent session limits** if needed

## Data Classification and Protection

### Personal Identifiable Information (PII)

**Minimal PII Approach**: Only store essential user data
- Email address (required for authentication)
- User preferences (JSON, non-sensitive)
- No names, phone numbers, or addresses stored

**Protection Measures**:
- RLS enforcement on all user tables
- Audit logging for PII access
- Data minimization principles
- GDPR compliance preparation

### Travel Data

**Sensitivity**: Medium - user travel patterns and preferences
**Protection**:
- User-scoped access only
- No cross-user data exposure
- Anonymized analytics data

### AI Conversation Data

**Sensitivity**: High - detailed user interactions
**Protection**:
- Strict user scoping
- Conversation encryption at rest
- Limited retention periods
- Audit trail for access

## Audit and Monitoring

### Database Activity Monitoring

Track critical database operations:

```sql
-- Example audit trigger (implementation depends on requirements)
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    user_id,
    old_values,
    new_values,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    NEW.user_id,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Supabase Built-in Monitoring

Leverage Supabase's monitoring features:
- **Real-time dashboard** for database metrics
- **Query performance** monitoring
- **Connection pool** monitoring
- **Error tracking** and alerting

### Custom Security Monitoring

Implement application-level monitoring:

```javascript
// Log security-relevant events
const logSecurityEvent = async (event, userId, details) => {
  await supabase.from('security_events').insert({
    event_type: event,
    user_id: userId,
    details: details,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    timestamp: new Date()
  });
};
```

## Backup and Recovery Security

### Automated Backups

Supabase provides:
- **Daily automated backups** for all plans
- **Point-in-time recovery** (Pro+ plans)
- **Cross-region backup** replication

### Manual Backup Security

For additional protection:

```bash
# Encrypted backup creation
pg_dump "postgresql://..." | gpg --encrypt --recipient security@cardinal.com > backup.sql.gpg

# Secure backup storage
aws s3 cp backup.sql.gpg s3://cardinal-backups/$(date +%Y%m%d)/ --sse AES256
```

### Recovery Procedures

1. **Incident Detection** - Automated monitoring alerts
2. **Impact Assessment** - Determine scope of data loss
3. **Recovery Planning** - Select appropriate recovery point
4. **Data Restoration** - Execute recovery with validation
5. **Security Review** - Analyze incident and improve security

## Compliance and Regulations

### GDPR Compliance

Cardinal is designed with GDPR principles:

- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Clear purpose for data collection
- **User Rights**: Right to access, rectify, delete data
- **Data Portability**: Export user data in standard formats
- **Privacy by Design**: Security built into system architecture

### Data Retention Policies

```sql
-- Automatic cleanup of old data
-- Example: Delete old auth sessions
DELETE FROM auth_sessions 
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Example: Archive old AI conversations
INSERT INTO ai_conversations_archive 
SELECT * FROM ai_conversation_messages 
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Security Best Practices

### Development Guidelines

1. **Never commit secrets** to version control
2. **Use environment variables** for all configuration
3. **Implement least privilege** access principles
4. **Regular security reviews** of code and infrastructure
5. **Automated security testing** in CI/CD pipeline

### Operational Security

1. **Regular key rotation** for API keys and passwords
2. **Monitor for unusual activity** patterns
3. **Keep dependencies updated** with security patches
4. **Regular backup testing** and recovery drills
5. **Security incident response** plan

### Code Security

```javascript
// Good: Parameterized queries (Supabase handles this)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // Safe from SQL injection

// Good: Input validation
const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

// Good: Error handling without data exposure
try {
  // Database operation
} catch (error) {
  console.error('Database error:', error); // Log details
  return { error: 'Operation failed' }; // Generic user message
}
```

## Incident Response

### Security Incident Classification

**Level 1 - Critical**:
- Data breach or unauthorized access
- Service compromise
- Authentication bypass

**Level 2 - High**:
- Privilege escalation
- Data integrity issues
- DDoS attacks

**Level 3 - Medium**:
- Suspicious activity patterns
- Failed authentication attempts
- Performance degradation

### Response Procedures

1. **Immediate Response** (0-1 hour):
   - Contain the incident
   - Assess scope and impact
   - Notify key stakeholders

2. **Investigation** (1-24 hours):
   - Detailed forensic analysis
   - Root cause identification
   - Evidence collection

3. **Recovery** (24-72 hours):
   - System restoration
   - Security improvements
   - Monitoring enhancement

4. **Post-Incident** (1-2 weeks):
   - Incident report
   - Process improvements
   - Team training updates

## Contact and Support

For security issues or questions:

- **Security Team**: security@cardinal.com
- **Database Admin**: dba@cardinal.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Incident Reporting**: incident@cardinal.com

## Regular Security Reviews

- **Weekly**: Monitor security alerts and logs
- **Monthly**: Review access patterns and permissions
- **Quarterly**: Full security audit and penetration testing
- **Annually**: Complete security architecture review