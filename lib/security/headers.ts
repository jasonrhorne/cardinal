/**
 * Cardinal Security Headers Configuration
 * Centralized security headers management and validation
 */

export type SecurityHeaderName =
  | 'Content-Security-Policy'
  | 'Strict-Transport-Security'
  | 'X-Frame-Options'
  | 'X-Content-Type-Options'
  | 'Referrer-Policy'
  | 'Permissions-Policy'
  | 'X-XSS-Protection'
  | 'Cross-Origin-Embedder-Policy'
  | 'Cross-Origin-Opener-Policy'
  | 'Cross-Origin-Resource-Policy'
  | 'X-DNS-Prefetch-Control'

export interface SecurityHeader {
  name: SecurityHeaderName
  value: string
  description: string
  category: 'csp' | 'cors' | 'xss' | 'transport' | 'content' | 'permissions'
}

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-eval'", // Required for Next.js dev mode
    "'unsafe-inline'", // Required for Next.js and inline scripts
    'https://maps.googleapis.com',
    'https://www.googletagmanager.com',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    'https://lh3.googleusercontent.com', // Google Places photos
  ],
  connectSrc: [
    "'self'",
    'https://*.supabase.co', // Supabase API
    'https://api.anthropic.com', // Claude AI
    'https://api.openai.com', // OpenAI API
    'https://maps.googleapis.com', // Google Maps API
  ],
  frameSrc: [
    "'self'",
    'https://www.google.com', // Google Maps embeds
  ],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: true,
} as const

// Build CSP string from directives
export function buildCSPString(directives: typeof CSP_DIRECTIVES): string {
  const cspParts: string[] = []

  // Add each directive
  Object.entries(directives).forEach(([key, value]) => {
    if (key === 'upgradeInsecureRequests') {
      if (value) {
        cspParts.push('upgrade-insecure-requests')
      }
    } else {
      // Convert camelCase to kebab-case
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      const sources = Array.isArray(value) ? value.join(' ') : value
      cspParts.push(`${directive} ${sources}`)
    }
  })

  return cspParts.join('; ')
}

// Security headers configuration
export const SECURITY_HEADERS: SecurityHeader[] = [
  {
    name: 'Content-Security-Policy',
    value: buildCSPString(CSP_DIRECTIVES),
    description:
      'Controls resource loading to prevent XSS and data injection attacks',
    category: 'csp',
  },
  {
    name: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
    description: 'Forces HTTPS connections and prevents downgrade attacks',
    category: 'transport',
  },
  {
    name: 'X-Frame-Options',
    value: 'SAMEORIGIN',
    description: 'Prevents clickjacking by controlling frame embedding',
    category: 'xss',
  },
  {
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    description: 'Prevents MIME type sniffing vulnerabilities',
    category: 'content',
  },
  {
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    description: 'Controls referrer information sent with requests',
    category: 'content',
  },
  {
    name: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
      'usb=()',
    ].join(', '),
    description: 'Controls browser feature permissions',
    category: 'permissions',
  },
  {
    name: 'X-XSS-Protection',
    value: '1; mode=block',
    description: 'Enables XSS filtering (legacy browsers)',
    category: 'xss',
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless',
    description: 'Controls cross-origin resource embedding',
    category: 'cors',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
    description: 'Controls cross-origin window interactions',
    category: 'cors',
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin',
    description: 'Controls cross-origin resource sharing',
    category: 'cors',
  },
  {
    name: 'X-DNS-Prefetch-Control',
    value: 'on',
    description: 'Controls DNS prefetching for performance',
    category: 'content',
  },
]

// Header validation functions
export function validateCSP(csp: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for required directives
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'img-src',
  ]
  for (const directive of requiredDirectives) {
    if (!csp.includes(directive)) {
      errors.push(`Missing required directive: ${directive}`)
    }
  }

  // Check for unsafe configurations
  if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
    // This is acceptable for Next.js but should be noted
  }

  if (csp.includes("'unsafe-eval'") && !csp.includes('script-src')) {
    errors.push("'unsafe-eval' found outside of script-src directive")
  }

  // Check for wildcard usage
  if (csp.includes(' * ') || csp.includes(" '*' ")) {
    errors.push('Wildcard (*) usage detected - consider being more specific')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateSecurityHeaders(headers: Record<string, string>): {
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []

  // Check for required headers
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
  ]

  for (const headerName of requiredHeaders) {
    if (!headers[headerName]) {
      missing.push(headerName)
    }
  }

  // Check for recommended headers
  const recommendedHeaders = [
    'Strict-Transport-Security',
    'Referrer-Policy',
    'Permissions-Policy',
  ]

  for (const headerName of recommendedHeaders) {
    if (!headers[headerName]) {
      warnings.push(`Recommended header missing: ${headerName}`)
    }
  }

  // Validate CSP if present
  if (headers['Content-Security-Policy']) {
    const cspValidation = validateCSP(headers['Content-Security-Policy'])
    if (!cspValidation.valid) {
      warnings.push(...cspValidation.errors.map(err => `CSP: ${err}`))
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

// Development environment CSP (more permissive)
export const DEV_CSP_DIRECTIVES = {
  ...CSP_DIRECTIVES,
  scriptSrc: [
    ...CSP_DIRECTIVES.scriptSrc,
    "'unsafe-eval'", // Required for webpack HMR
    'webpack://', // Webpack dev server
  ],
  connectSrc: [
    ...CSP_DIRECTIVES.connectSrc,
    'ws://localhost:*', // Webpack HMR websocket
    'http://localhost:*', // Local development servers
  ],
} as const

// Get appropriate CSP based on environment
export function getEnvironmentCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const directives = isDevelopment ? DEV_CSP_DIRECTIVES : CSP_DIRECTIVES

  return buildCSPString(directives as typeof CSP_DIRECTIVES)
}

// Security reporting configuration
export interface SecurityReportingConfig {
  cspReportUri?: string
  hpkpReportUri?: string
  expectCtReportUri?: string
}

export function addReportingToCSP(
  csp: string,
  config: SecurityReportingConfig
): string {
  let updatedCSP = csp

  if (config.cspReportUri) {
    updatedCSP += `; report-uri ${config.cspReportUri}`
  }

  return updatedCSP
}
