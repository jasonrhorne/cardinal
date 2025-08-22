# Cardinal Database Monitoring and Backup Guide

This document outlines the monitoring, alerting, and backup strategies for Cardinal's PostgreSQL database infrastructure.

## Monitoring Overview

Cardinal implements a comprehensive monitoring strategy across multiple layers:

1. **Supabase Built-in Monitoring** - Platform-level metrics and alerts
2. **Application-Level Monitoring** - Custom metrics and business logic monitoring
3. **Performance Monitoring** - Query performance and optimization
4. **Security Monitoring** - Access patterns and threat detection
5. **Custom Alerting** - Proactive notification system

## Supabase Platform Monitoring

### Dashboard Metrics

Access real-time metrics via Supabase Dashboard:

**Database Metrics**:

- Connection count and pool usage
- Query performance and slow queries
- Storage usage and growth trends
- Table sizes and index usage
- Error rates and response times

**API Metrics**:

- Request volume and patterns
- Authentication success/failure rates
- API key usage and quotas
- Geographic distribution of requests

### Built-in Alerts

Configure Supabase platform alerts:

1. **Database Connection Limits** - Alert when approaching connection limits
2. **Storage Thresholds** - Notify before storage limits reached
3. **Performance Degradation** - Alert on slow query detection
4. **Error Rate Spikes** - Notify on unusual error patterns
5. **Authentication Anomalies** - Alert on suspicious login patterns

### Supabase Monitoring Setup

```javascript
// Enable detailed logging in Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      debug: process.env.NODE_ENV === 'development',
    },
    global: {
      debug: process.env.NODE_ENV === 'development',
    },
  }
)
```

## Application-Level Monitoring

### Custom Metrics Collection

Implement application-specific monitoring:

```javascript
// Database performance tracking
const trackDatabaseOperation = async (operation, duration, success) => {
  await supabase.from('monitoring_metrics').insert({
    metric_type: 'database_operation',
    operation_name: operation,
    duration_ms: duration,
    success: success,
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  })
}

// Usage example
const startTime = Date.now()
try {
  const result = await supabase.from('itineraries').select('*')
  await trackDatabaseOperation(
    'select_itineraries',
    Date.now() - startTime,
    true
  )
  return result
} catch (error) {
  await trackDatabaseOperation(
    'select_itineraries',
    Date.now() - startTime,
    false
  )
  throw error
}
```

### Business Logic Monitoring

Track key application metrics:

```javascript
// User activity monitoring
const trackUserActivity = async (userId, activityType, metadata = {}) => {
  await supabase.from('user_activity_log').insert({
    user_id: userId,
    activity_type: activityType, // 'login', 'itinerary_created', 'search_performed'
    metadata: metadata,
    timestamp: new Date(),
    session_id: getCurrentSessionId(),
  })
}

// AI generation monitoring
const trackAIGeneration = async (sessionId, tokenUsage, duration, success) => {
  await supabase.from('ai_monitoring').insert({
    session_id: sessionId,
    tokens_used: tokenUsage,
    generation_duration_ms: duration,
    success: success,
    timestamp: new Date(),
    model_version: getCurrentModelVersion(),
  })
}
```

## Performance Monitoring

### Query Performance Analysis

Monitor and optimize database query performance:

```sql
-- Create query performance tracking
CREATE TABLE IF NOT EXISTS query_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  query_hash TEXT,
  execution_plan JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to track slow queries
CREATE OR REPLACE FUNCTION track_slow_query(
  p_query_type TEXT,
  p_execution_time INTEGER,
  p_row_count INTEGER DEFAULT NULL,
  p_query_hash TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Only track queries slower than 1 second
  IF p_execution_time > 1000 THEN
    INSERT INTO query_performance (
      query_type, execution_time_ms, row_count, query_hash
    ) VALUES (
      p_query_type, p_execution_time, p_row_count, p_query_hash
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Index Usage Monitoring

```sql
-- Monitor index effectiveness
CREATE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
  CASE
    WHEN idx_scan = 0 THEN 'Unused'
    WHEN idx_scan < 100 THEN 'Low Usage'
    WHEN idx_scan < 1000 THEN 'Medium Usage'
    ELSE 'High Usage'
  END as usage_category
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
ORDER BY idx_scan DESC;
```

### Connection Pool Monitoring

```javascript
// Monitor connection pool status
const checkConnectionHealth = async () => {
  try {
    const { data, error } = await supabase.rpc('get_connection_stats')

    if (error) throw error

    const metrics = {
      total_connections: data.total_connections,
      active_connections: data.active_connections,
      idle_connections: data.idle_connections,
      pool_utilization: (data.active_connections / data.max_connections) * 100,
    }

    // Alert if pool utilization > 80%
    if (metrics.pool_utilization > 80) {
      await sendAlert('high_connection_usage', metrics)
    }

    return metrics
  } catch (error) {
    console.error('Connection health check failed:', error)
    return null
  }
}
```

## Security Monitoring

### Access Pattern Analysis

Monitor for suspicious database access:

```sql
-- Create security monitoring table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to detect anomalous access patterns
CREATE OR REPLACE FUNCTION detect_access_anomalies()
RETURNS TABLE (
  user_id UUID,
  suspicious_activity TEXT,
  event_count INTEGER,
  risk_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_activity AS (
    SELECT
      se.user_id,
      se.event_type,
      COUNT(*) as event_count,
      COUNT(DISTINCT se.ip_address) as unique_ips
    FROM security_events se
    WHERE se.timestamp > NOW() - INTERVAL '1 hour'
    AND se.user_id IS NOT NULL
    GROUP BY se.user_id, se.event_type
  )
  SELECT
    ua.user_id,
    CASE
      WHEN ua.event_count > 100 THEN 'High frequency access'
      WHEN ua.unique_ips > 5 THEN 'Multiple IP addresses'
      ELSE 'Normal activity'
    END as suspicious_activity,
    ua.event_count,
    CASE
      WHEN ua.event_count > 100 OR ua.unique_ips > 5 THEN 'HIGH'
      WHEN ua.event_count > 50 OR ua.unique_ips > 3 THEN 'MEDIUM'
      ELSE 'LOW'
    END as risk_level
  FROM user_activity ua
  WHERE ua.event_count > 50 OR ua.unique_ips > 3;
END;
$$ LANGUAGE plpgsql;
```

### Failed Authentication Monitoring

```javascript
// Track authentication failures
const monitorAuthFailures = async (email, reason, ipAddress) => {
  await supabase.from('security_events').insert({
    event_type: 'auth_failure',
    details: {
      email: email,
      failure_reason: reason,
      attempt_time: new Date(),
    },
    ip_address: ipAddress,
    risk_score: calculateRiskScore(email, ipAddress),
    timestamp: new Date(),
  })

  // Check for brute force patterns
  const recentFailures = await supabase
    .from('security_events')
    .select('*')
    .eq('event_type', 'auth_failure')
    .eq('details->email', email)
    .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000)) // Last 15 minutes

  if (recentFailures.data && recentFailures.data.length > 5) {
    await sendSecurityAlert('brute_force_attempt', {
      email: email,
      attempts: recentFailures.data.length,
      ip_address: ipAddress,
    })
  }
}
```

## Alerting System

### Alert Configuration

Set up multi-channel alerting:

```javascript
// Alert configuration
const alertConfig = {
  channels: {
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#database-alerts',
    },
    email: {
      recipients: ['dba@cardinal.com', 'security@cardinal.com'],
      smtp: process.env.SMTP_CONFIG,
    },
    pagerduty: {
      integration_key: process.env.PAGERDUTY_KEY,
      severity: 'critical',
    },
  },
  thresholds: {
    query_time: 5000, // 5 seconds
    connection_usage: 80, // 80% of pool
    error_rate: 5, // 5% error rate
    storage_usage: 85, // 85% of allocated storage
  },
}

// Alert dispatcher
const sendAlert = async (alertType, data, severity = 'medium') => {
  const alert = {
    type: alertType,
    severity: severity,
    timestamp: new Date(),
    data: data,
    environment: process.env.NODE_ENV,
  }

  // Log alert to database
  await supabase.from('alerts').insert(alert)

  // Send to appropriate channels based on severity
  if (severity === 'critical') {
    await sendSlackAlert(alert)
    await sendEmailAlert(alert)
    await sendPagerDutyAlert(alert)
  } else if (severity === 'high') {
    await sendSlackAlert(alert)
    await sendEmailAlert(alert)
  } else {
    await sendSlackAlert(alert)
  }
}
```

### Predefined Alert Types

```javascript
// Database performance alerts
const performanceAlerts = {
  slow_query: {
    threshold: 5000, // 5 seconds
    message: 'Slow query detected',
    severity: 'medium',
  },
  high_connection_usage: {
    threshold: 80, // 80% utilization
    message: 'High database connection usage',
    severity: 'high',
  },
  storage_warning: {
    threshold: 85, // 85% full
    message: 'Database storage approaching limit',
    severity: 'high',
  },
  index_scan_anomaly: {
    threshold: 1000000, // 1M scans without index
    message: 'High table scan activity detected',
    severity: 'medium',
  },
}

// Security alerts
const securityAlerts = {
  brute_force: {
    threshold: 5, // 5 failed attempts
    message: 'Brute force attack detected',
    severity: 'critical',
  },
  unusual_access: {
    threshold: 100, // 100 requests in 5 minutes
    message: 'Unusual access pattern detected',
    severity: 'high',
  },
  privilege_escalation: {
    threshold: 1, // Any attempt
    message: 'Privilege escalation attempt',
    severity: 'critical',
  },
}
```

## Backup Strategy

### Automated Backup Configuration

Supabase provides automated backups, but implement additional safeguards:

```bash
#!/bin/bash
# Enhanced backup script for additional protection

# Configuration
BACKUP_DIR="/backups/cardinal"
RETENTION_DAYS=30
S3_BUCKET="cardinal-database-backups"

# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cardinal_backup_${TIMESTAMP}.sql"

# Perform backup with compression
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Verify backup integrity
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}.gz"; then
  echo "Backup integrity verified: ${BACKUP_FILE}.gz"
else
  echo "Backup integrity check failed: ${BACKUP_FILE}.gz"
  exit 1
fi

# Upload to S3 with encryption
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
  "s3://${S3_BUCKET}/$(date +%Y)/$(date +%m)/${BACKUP_FILE}.gz" \
  --sse AES256

# Clean up old local backups
find "${BACKUP_DIR}" -name "*.gz" -mtime +${RETENTION_DAYS} -delete

# Log backup completion
echo "Backup completed successfully: ${BACKUP_FILE}.gz"
```

### Backup Monitoring Script

```javascript
// Monitor backup status
const monitorBackups = async () => {
  try {
    // Check Supabase backup status
    const backupStatus = await checkSupabaseBackups()

    // Check custom backup status
    const customBackupStatus = await checkCustomBackups()

    // Validate backup integrity
    const integrityCheck = await validateBackupIntegrity()

    const status = {
      supabase_backups: backupStatus,
      custom_backups: customBackupStatus,
      integrity_check: integrityCheck,
      last_check: new Date(),
    }

    // Alert if any backup failures
    if (
      !backupStatus.success ||
      !customBackupStatus.success ||
      !integrityCheck.success
    ) {
      await sendAlert('backup_failure', status, 'critical')
    }

    // Log status
    await supabase.from('backup_monitoring').insert(status)

    return status
  } catch (error) {
    console.error('Backup monitoring failed:', error)
    await sendAlert(
      'backup_monitoring_failure',
      { error: error.message },
      'high'
    )
  }
}
```

### Point-in-Time Recovery Setup

```javascript
// Point-in-time recovery helper
const performPointInTimeRecovery = async (targetTime, recoveryOptions = {}) => {
  const recoveryPlan = {
    target_time: targetTime,
    recovery_database: recoveryOptions.database || 'cardinal_recovery',
    validation_required: true,
    rollback_plan: true,
  }

  console.log('Starting point-in-time recovery:', recoveryPlan)

  try {
    // 1. Create recovery database
    await createRecoveryDatabase(recoveryPlan.recovery_database)

    // 2. Restore to target time
    await restoreToPointInTime(
      recoveryPlan.target_time,
      recoveryPlan.recovery_database
    )

    // 3. Validate recovery
    const validationResult = await validateRecoveryDatabase(
      recoveryPlan.recovery_database
    )

    // 4. Generate recovery report
    const report = await generateRecoveryReport(recoveryPlan, validationResult)

    return report
  } catch (error) {
    console.error('Point-in-time recovery failed:', error)
    throw error
  }
}
```

## Health Check System

### Comprehensive Health Checks

```javascript
// Database health check suite
const performHealthCheck = async () => {
  const healthStatus = {
    timestamp: new Date(),
    checks: {},
    overall_status: 'healthy',
  }

  try {
    // 1. Connection check
    healthStatus.checks.connection = await checkDatabaseConnection()

    // 2. Performance check
    healthStatus.checks.performance = await checkQueryPerformance()

    // 3. Storage check
    healthStatus.checks.storage = await checkStorageUsage()

    // 4. Index health check
    healthStatus.checks.indexes = await checkIndexHealth()

    // 5. Replication check (if applicable)
    healthStatus.checks.replication = await checkReplicationStatus()

    // 6. Security check
    healthStatus.checks.security = await checkSecurityStatus()

    // Determine overall status
    const failedChecks = Object.values(healthStatus.checks).filter(
      check => !check.healthy
    )
    if (failedChecks.length > 0) {
      healthStatus.overall_status = failedChecks.some(check => check.critical)
        ? 'critical'
        : 'degraded'
    }

    // Log health status
    await supabase.from('health_checks').insert(healthStatus)

    // Alert on health issues
    if (healthStatus.overall_status !== 'healthy') {
      await sendAlert(
        'health_check_failure',
        healthStatus,
        healthStatus.overall_status === 'critical' ? 'critical' : 'high'
      )
    }

    return healthStatus
  } catch (error) {
    console.error('Health check failed:', error)
    await sendAlert('health_check_error', { error: error.message }, 'high')
    return { ...healthStatus, overall_status: 'error', error: error.message }
  }
}
```

### Automated Health Check Scheduling

```bash
# Cron job for regular health checks
# Add to crontab: crontab -e

# Health check every 5 minutes
*/5 * * * * /usr/local/bin/node /app/scripts/health-check.js

# Performance monitoring every hour
0 * * * * /usr/local/bin/node /app/scripts/performance-monitor.js

# Security scan every 6 hours
0 */6 * * * /usr/local/bin/node /app/scripts/security-scan.js

# Backup verification daily at 2 AM
0 2 * * * /usr/local/bin/node /app/scripts/backup-verify.js
```

## Monitoring Dashboard

### Custom Monitoring Dashboard

Create a monitoring dashboard for Cardinal-specific metrics:

```javascript
// Dashboard data aggregation
const getDashboardData = async () => {
  const timeRange = '24 hours'

  const dashboard = {
    system_health: await getSystemHealth(),
    performance_metrics: await getPerformanceMetrics(timeRange),
    user_activity: await getUserActivityMetrics(timeRange),
    ai_usage: await getAIUsageMetrics(timeRange),
    security_events: await getSecurityEventsSummary(timeRange),
    backup_status: await getBackupStatus(),
    alerts: await getRecentAlerts(timeRange),
  }

  return dashboard
}

// Key performance indicators
const getKPIs = async () => {
  return {
    database_uptime: await calculateUptime('24h'),
    avg_query_time: await getAverageQueryTime('1h'),
    active_users: await getActiveUserCount('1h'),
    error_rate: await getErrorRate('1h'),
    storage_usage: await getStorageUsagePercentage(),
    backup_freshness: await getLastBackupAge(),
  }
}
```

## Troubleshooting Guide

### Common Monitoring Issues

1. **High Query Response Times**
   - Check slow query log
   - Analyze query execution plans
   - Review index usage
   - Consider query optimization

2. **Connection Pool Exhaustion**
   - Monitor connection leaks
   - Review connection timeout settings
   - Implement connection pooling
   - Scale connection limits

3. **Storage Growth**
   - Analyze table sizes
   - Review data retention policies
   - Implement archiving strategy
   - Clean up unused data

4. **Security Alerts**
   - Investigate access patterns
   - Review authentication logs
   - Check for privilege escalation
   - Validate RLS policies

### Emergency Response Procedures

```javascript
// Emergency response automation
const handleEmergency = async (alertType, severity, data) => {
  console.log(`Emergency response triggered: ${alertType} (${severity})`)

  switch (alertType) {
    case 'database_down':
      await initiateDatabaseFailover()
      break
    case 'security_breach':
      await lockdownSecurityBreach(data)
      break
    case 'data_corruption':
      await initiateDataRecovery(data)
      break
    case 'performance_degradation':
      await mitigatePerformanceIssue(data)
      break
    default:
      await escalateToOnCall(alertType, data)
  }
}
```

This comprehensive monitoring and backup setup ensures Cardinal's database infrastructure is robust, secure, and well-monitored across all environments.
