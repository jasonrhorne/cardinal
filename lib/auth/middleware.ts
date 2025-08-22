/**
 * Authentication Middleware for Server-Side Route Protection
 *
 * This module provides:
 * - Server-side session validation
 * - Route protection utilities
 * - Session management for API routes
 * - User context extraction
 */

import type { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/database/supabase'

// =============================================================================
// MIDDLEWARE FUNCTIONS
// =============================================================================

/**
 * Validate user session from request
 */
export async function validateSession(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Get the session token from the Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return {
        user: null,
        session: null,
        error: 'No authentication token found',
      }
    }

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        user: null,
        session: null,
        error: error?.message || 'Invalid token',
      }
    }

    return { user, session: { access_token: token }, error: null }
  } catch (error) {
    return {
      user: null,
      session: null,
      error:
        error instanceof Error ? error.message : 'Session validation failed',
    }
  }
}

/**
 * Create authenticated API route handler
 */
export function withAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    user: User,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    const { user, error } = await validateSession(request)

    if (error || !user) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Authentication required',
          details: error,
        },
        { status: 401 }
      )
    }

    return handler(request, user, ...args)
  }
}

/**
 * Create optional auth API route handler (user may or may not be authenticated)
 */
export function withOptionalAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    user: User | null,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    const { user } = await validateSession(request)
    return handler(request, user, ...args)
  }
}

// =============================================================================
// ROUTE PROTECTION
// =============================================================================

/**
 * Protected route patterns that require authentication
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/itineraries',
  '/settings',
  '/api/user',
  '/api/itineraries',
  '/api/preferences',
]

/**
 * Public route patterns that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/api/health',
  '/api/destinations',
  '/about',
  '/privacy',
  '/terms',
]

/**
 * Check if a path requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    route => pathname.startsWith(route) || pathname === route
  )
}

/**
 * Check if a path is publicly accessible
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname.startsWith(route) || pathname === route
  )
}

/**
 * Get redirect URL for unauthenticated users
 */
export function getAuthRedirectUrl(
  pathname: string,
  searchParams?: string
): string {
  const redirectTo = encodeURIComponent(
    pathname + (searchParams ? `?${searchParams}` : '')
  )
  return `/auth/signin?redirectTo=${redirectTo}`
}

// =============================================================================
// MIDDLEWARE UTILITIES
// =============================================================================

/**
 * Extract user context from request for API routes
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  const { user } = await validateSession(request)
  return user
}

/**
 * Check if user has required permissions (placeholder for future role-based access)
 */
export function hasPermission(user: User, permission: string): boolean {
  // Placeholder implementation - extend based on your permission system
  const userRoles = user.app_metadata?.roles || []
  const userPermissions = user.app_metadata?.permissions || []

  return userPermissions.includes(permission) || userRoles.includes('admin')
}

/**
 * Create role-based route handler
 */
export function withRole<T extends any[]>(
  requiredRole: string,
  handler: (
    request: NextRequest,
    user: User,
    ...args: T
  ) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: User, ...args: T) => {
    const userRoles = user.app_metadata?.roles || []

    if (!userRoles.includes(requiredRole) && !userRoles.includes('admin')) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Insufficient permissions',
          details: `Required role: ${requiredRole}`,
        },
        { status: 403 }
      )
    }

    return handler(request, user, ...args)
  })
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Create session response with proper headers
 */
export function createSessionResponse(
  data: any,
  session: { access_token: string }
): NextResponse {
  const response = NextResponse.json({
    status: 'success',
    data,
  })

  // Set session cookie for client-side access
  response.cookies.set('supabase-auth-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  return response
}

/**
 * Clear session cookies
 */
export function clearSessionResponse(): NextResponse {
  const response = NextResponse.json({
    status: 'success',
    message: 'Session cleared',
  })

  response.cookies.delete('supabase-auth-token')

  return response
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class AuthMiddlewareError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code?: string
  ) {
    super(message)
    this.name = 'AuthMiddlewareError'
  }
}

/**
 * Create standardized auth error response
 */
export function createAuthErrorResponse(
  error: string | AuthMiddlewareError,
  statusCode: number = 401
): NextResponse {
  const errorMessage = typeof error === 'string' ? error : error.message
  const code = typeof error === 'object' ? error.statusCode : statusCode

  return NextResponse.json(
    {
      status: 'error',
      error: errorMessage,
      code: 'AUTH_ERROR',
    },
    { status: code }
  )
}
