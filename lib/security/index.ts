/**
 * Cardinal Security Module
 * Comprehensive security utilities and configurations
 */

// Security headers
export {
  type SecurityHeaderName,
  type SecurityHeader,
  type SecurityReportingConfig,
  CSP_DIRECTIVES,
  DEV_CSP_DIRECTIVES,
  SECURITY_HEADERS,
  buildCSPString,
  validateCSP,
  validateSecurityHeaders,
  getEnvironmentCSP,
  addReportingToCSP,
} from './headers'

// Security testing
export {
  type SecurityTestResult,
  type SecurityHeaderTest,
  testSecurityHeaders,
  generateSecurityReport,
  testAndReport,
  validateLocalHeaders,
} from './test-headers'
