/**
 * Cardinal Security Headers Testing Utilities
 * Tools for validating security header implementation
 */

import { validateSecurityHeaders, SECURITY_HEADERS } from './headers'

export interface SecurityTestResult {
  url: string
  timestamp: string
  passed: number
  failed: number
  warnings: number
  results: SecurityHeaderTest[]
  score: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface SecurityHeaderTest {
  header: string
  present: boolean
  value?: string | undefined
  expected?: string | undefined
  status: 'pass' | 'fail' | 'warning'
  message: string
  category: string
}

// Test security headers on a given URL
export async function testSecurityHeaders(
  url: string
): Promise<SecurityTestResult> {
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Only need headers, not content
    })

    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    const results = analyzeHeaders(headers)
    const score = calculateSecurityScore(results)
    const grade = getSecurityGrade(score)

    return {
      url,
      timestamp: new Date().toISOString(),
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length,
      results,
      score,
      grade,
    }
  } catch (error) {
    throw new Error(`Failed to test security headers: ${error}`)
  }
}

// Analyze headers against our security requirements
function analyzeHeaders(headers: Record<string, string>): SecurityHeaderTest[] {
  const tests: SecurityHeaderTest[] = []

  // Test each expected security header
  for (const securityHeader of SECURITY_HEADERS) {
    const headerName = securityHeader.name.toLowerCase()
    const present = headerName in headers
    const value = headers[headerName]

    let status: 'pass' | 'fail' | 'warning' = 'fail'
    let message = `Header missing: ${securityHeader.name}`

    if (present) {
      if (value === securityHeader.value) {
        status = 'pass'
        message = `Header correctly configured: ${securityHeader.name}`
      } else {
        status = 'warning'
        message = `Header present but value differs from expected: ${securityHeader.name}`
      }
    }

    tests.push({
      header: securityHeader.name,
      present,
      value,
      expected: securityHeader.value,
      status,
      message,
      category: securityHeader.category,
    })
  }

  // Test for problematic headers that should not be present
  const problematicHeaders = [
    { name: 'server', message: 'Server header exposes server information' },
    {
      name: 'x-powered-by',
      message: 'X-Powered-By header exposes technology stack',
    },
  ]

  for (const problem of problematicHeaders) {
    if (headers[problem.name]) {
      tests.push({
        header: problem.name,
        present: true,
        value: headers[problem.name],
        status: 'warning',
        message: problem.message,
        category: 'information-disclosure',
      })
    }
  }

  // Additional CSP analysis
  const csp = headers['content-security-policy']
  if (csp) {
    // Check for common CSP issues
    if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
      tests.push({
        header: 'content-security-policy',
        present: true,
        value: csp,
        status: 'warning',
        message:
          'CSP allows unsafe-inline scripts (acceptable for Next.js but consider nonces)',
        category: 'csp',
      })
    }

    if (!csp.includes('upgrade-insecure-requests')) {
      tests.push({
        header: 'content-security-policy',
        present: true,
        status: 'warning',
        message: 'CSP missing upgrade-insecure-requests directive',
        category: 'csp',
      })
    }
  }

  return tests
}

// Calculate security score based on test results
function calculateSecurityScore(results: SecurityHeaderTest[]): number {
  let score = 100

  for (const result of results) {
    switch (result.status) {
      case 'fail':
        score -= 15 // Major deduction for missing critical headers
        break
      case 'warning':
        score -= 5 // Minor deduction for warnings
        break
      case 'pass':
        // No deduction for passing tests
        break
    }
  }

  // Bonus points for advanced security features
  const advancedHeaders = [
    'content-security-policy',
    'permissions-policy',
    'cross-origin-embedder-policy',
  ]
  for (const header of advancedHeaders) {
    const test = results.find(
      r => r.header.toLowerCase() === header && r.status === 'pass'
    )
    if (test) {
      score += 5
    }
  }

  return Math.max(0, Math.min(100, score))
}

// Convert score to letter grade
function getSecurityGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) {
    return 'A+'
  }
  if (score >= 90) {
    return 'A'
  }
  if (score >= 80) {
    return 'B'
  }
  if (score >= 70) {
    return 'C'
  }
  if (score >= 60) {
    return 'D'
  }
  return 'F'
}

// Generate security report
export function generateSecurityReport(result: SecurityTestResult): string {
  const report: string[] = []

  report.push(`Security Headers Analysis Report`)
  report.push(`URL: ${result.url}`)
  report.push(`Generated: ${result.timestamp}`)
  report.push(`Score: ${result.score}/100 (${result.grade})`)
  report.push(
    `Tests: ${result.passed} passed, ${result.failed} failed, ${result.warnings} warnings`
  )
  report.push('')

  // Group results by category
  const categories = [...new Set(result.results.map(r => r.category))]

  for (const category of categories) {
    const categoryTests = result.results.filter(r => r.category === category)
    report.push(`## ${category.toUpperCase()} (${categoryTests.length} tests)`)

    for (const test of categoryTests) {
      const icon =
        test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌'
      report.push(`${icon} ${test.message}`)

      if (test.value && test.expected && test.value !== test.expected) {
        report.push(`   Expected: ${test.expected}`)
        report.push(`   Actual: ${test.value}`)
      }
    }
    report.push('')
  }

  // Recommendations
  report.push('## Recommendations')
  const failedTests = result.results.filter(r => r.status === 'fail')
  const warningTests = result.results.filter(r => r.status === 'warning')

  if (failedTests.length > 0) {
    report.push('### Critical Issues')
    for (const test of failedTests) {
      report.push(`- Fix: ${test.message}`)
    }
  }

  if (warningTests.length > 0) {
    report.push('### Improvements')
    for (const test of warningTests) {
      report.push(`- Consider: ${test.message}`)
    }
  }

  if (result.score >= 90) {
    report.push('### Excellent Security Posture!')
    report.push(
      'Your security headers are well-configured and provide strong protection.'
    )
  }

  return report.join('\n')
}

// CLI utility for testing security headers
export async function testAndReport(url: string): Promise<void> {
  console.log(`🔒 Testing security headers for: ${url}`)
  console.log('⏳ Analyzing headers...')

  try {
    const result = await testSecurityHeaders(url)
    const report = generateSecurityReport(result)

    console.log('\n' + report)

    // Exit with error code if there are critical failures
    if (result.failed > 0 || result.score < 70) {
      process.exit(1)
    }
  } catch (error) {
    console.error(`❌ Error testing security headers: ${error}`)
    process.exit(1)
  }
}

// Quick validation for local development
export function validateLocalHeaders(): boolean {
  console.log('🔒 Validating security headers configuration...')

  try {
    const validation = validateSecurityHeaders({
      'content-security-policy':
        SECURITY_HEADERS.find(h => h.name === 'Content-Security-Policy')
          ?.value || '',
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
    })

    if (validation.valid) {
      console.log('✅ Security headers configuration is valid')
      if (validation.warnings.length > 0) {
        console.log('⚠️ Warnings:')
        validation.warnings.forEach(warning => console.log(`   - ${warning}`))
      }
      return true
    } else {
      console.log('❌ Security headers configuration has issues:')
      validation.missing.forEach(missing =>
        console.log(`   - Missing: ${missing}`)
      )
      validation.warnings.forEach(warning =>
        console.log(`   - Warning: ${warning}`)
      )
      return false
    }
  } catch (error) {
    console.error(`❌ Error validating headers: ${error}`)
    return false
  }
}
