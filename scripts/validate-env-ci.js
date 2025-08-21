#!/usr/bin/env node

/**
 * CI Environment Validation Script
 *
 * This script validates only the essential environment variables
 * needed for CI/CD without requiring full application configuration.
 */

console.log('🔍 Validating CI environment configuration...')

// Check for required public environment variables
const requiredPublicVars = [
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_PUBLIC_APP_VERSION',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
]

let hasErrors = false

requiredPublicVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`)
    hasErrors = true
  } else {
    console.log(`✅ ${varName}=${process.env[varName]}`)
  }
})

// Validate URL formats
const urlVars = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL']
urlVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    try {
      new URL(value)
      console.log(`✅ ${varName} is a valid URL`)
    } catch (error) {
      console.error(`❌ ${varName} is not a valid URL: ${value}`)
      hasErrors = true
    }
  }
})

// Check environment consistency
const appEnv = process.env.NEXT_PUBLIC_APP_ENV
const nodeEnv = process.env.NODE_ENV

console.log(
  `📊 Environment: NODE_ENV=${nodeEnv}, NEXT_PUBLIC_APP_ENV=${appEnv}`
)

if (hasErrors) {
  console.error('\n❌ Environment validation failed!')
  process.exit(1)
} else {
  console.log('\n✅ CI environment validation passed!')
  process.exit(0)
}
