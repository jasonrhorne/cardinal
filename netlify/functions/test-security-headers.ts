/**
 * Test Security Headers Implementation
 * Validates that security headers are properly configured
 */

import { Handler } from '@netlify/functions'
import {
  testSecurityHeaders as testSecurityHeadersUtil,
  generateSecurityReport,
  validateLocalHeaders,
  SECURITY_HEADERS,
  getEnvironmentCSP,
} from '../../lib/security'
import {
  createSuccessResponse,
  createErrorResponse,
  handleCORSPreflight,
} from '../../lib/netlify/utils'
import { withErrorHandling } from '../../lib/netlify/error-handler'
import type { TFunctionContext } from '../../lib/netlify/types'

// Test request types
type TestType =
  | 'local-validation'
  | 'external-test'
  | 'csp-analysis'
  | 'header-check'

interface TestSecurityRequest {
  testType: TestType
  url?: string
  headers?: Record<string, string>
}

// Main test handler
const testSecurityHeaders = async (
  event: any,
  context: TFunctionContext
): Promise<any> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORSPreflight()
  }

  // Parse request
  let request: TestSecurityRequest
  try {
    const body = JSON.parse(event.body || '{}')
    request = {
      testType: body.testType || 'local-validation',
      url: body.url,
      headers: body.headers || {},
    }
  } catch (error) {
    return createErrorResponse(
      'Invalid request body',
      400,
      { error: (error as Error).message },
      context.requestId
    )
  }

  const { testType, url, headers } = request

  try {
    switch (testType) {
      case 'local-validation':
        return await testLocalValidation()

      case 'external-test':
        if (!url) {
          return createErrorResponse(
            'URL required for external test',
            400,
            undefined,
            context.requestId
          )
        }
        return await testExternalUrl(url)

      case 'csp-analysis':
        return await analyzeCsp()

      case 'header-check':
        return await checkHeaders(headers || {})

      default:
        return createErrorResponse(
          `Unknown test type: ${testType}`,
          400,
          undefined,
          context.requestId
        )
    }
  } catch (error) {
    return createErrorResponse(
      'Security test failed',
      500,
      { error: (error as Error).message },
      context.requestId
    )
  }
}

// Test local header validation
async function testLocalValidation() {
  const isValid = validateLocalHeaders()

  return createSuccessResponse(
    {
      testType: 'local-validation',
      valid: isValid,
      headers: SECURITY_HEADERS.map(h => ({
        name: h.name,
        category: h.category,
        description: h.description,
        configured: true,
      })),
      timestamp: new Date().toISOString(),
    },
    'Local security headers validation completed'
  )
}

// Test external URL security headers
async function testExternalUrl(url: string) {
  const result = await testSecurityHeadersUtil(url)
  const report = generateSecurityReport(result)

  return createSuccessResponse(
    {
      testType: 'external-test',
      url,
      result,
      report,
      timestamp: new Date().toISOString(),
    },
    `Security headers test completed for ${url}`
  )
}

// Analyze CSP configuration
async function analyzeCsp() {
  const csp = getEnvironmentCSP()

  // Parse CSP directives
  const directives: Record<string, string[]> = {}
  const parts = csp.split(';').map(p => p.trim())

  for (const part of parts) {
    if (part === 'upgrade-insecure-requests') {
      directives['upgrade-insecure-requests'] = []
      continue
    }

    const [directive, ...sources] = part.split(' ')
    if (directive) {
      directives[directive] = sources
    }
  }

  // Analyze for potential issues
  const analysis = {
    totalDirectives: Object.keys(directives).length,
    hasUnsafeInline: csp.includes("'unsafe-inline'"),
    hasUnsafeEval: csp.includes("'unsafe-eval'"),
    upgradesInsecureRequests: csp.includes('upgrade-insecure-requests'),
    allowsDataUris: csp.includes('data:'),
    allowsBlobUris: csp.includes('blob:'),
    directives,
    recommendations: [] as string[],
  }

  // Generate recommendations
  if (analysis.hasUnsafeInline) {
    analysis.recommendations.push(
      'Consider using nonces or hashes instead of unsafe-inline for better security'
    )
  }

  if (analysis.hasUnsafeEval) {
    analysis.recommendations.push(
      'unsafe-eval allows dynamic code execution - ensure this is necessary'
    )
  }

  if (!analysis.upgradesInsecureRequests) {
    analysis.recommendations.push(
      'Add upgrade-insecure-requests directive to enforce HTTPS'
    )
  }

  return createSuccessResponse(
    {
      testType: 'csp-analysis',
      csp,
      analysis,
      timestamp: new Date().toISOString(),
    },
    'CSP analysis completed'
  )
}

// Check specific headers
async function checkHeaders(providedHeaders: Record<string, string>) {
  const results: Array<{
    header: string
    present: boolean
    value?: string | undefined
    secure: boolean
    issues: string[]
  }> = []

  // Check each security header
  for (const securityHeader of SECURITY_HEADERS) {
    const headerName = securityHeader.name.toLowerCase()
    const present = headerName in providedHeaders
    const value = providedHeaders[headerName]

    const issues: string[] = []
    let secure = false

    if (!present) {
      issues.push('Header not present')
    } else {
      secure = value === securityHeader.value
      if (!secure) {
        issues.push('Header value differs from recommended configuration')
      }
    }

    results.push({
      header: securityHeader.name,
      present,
      value,
      secure,
      issues,
    })
  }

  // Calculate overall security score
  const presentCount = results.filter(r => r.present).length
  const secureCount = results.filter(r => r.secure).length
  const score = Math.round((secureCount / results.length) * 100)

  return createSuccessResponse(
    {
      testType: 'header-check',
      totalHeaders: results.length,
      presentHeaders: presentCount,
      secureHeaders: secureCount,
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'F',
      results,
      timestamp: new Date().toISOString(),
    },
    'Header security check completed'
  )
}

// Export the handler with error handling wrapper
export const handler: Handler = withErrorHandling(testSecurityHeaders, {
  functionName: 'test-security-headers',
  timeout: 30000,
  retries: 0,
})
