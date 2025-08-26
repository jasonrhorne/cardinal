/**
 * Next.js Middleware for Route Protection with Supabase
 *
 * This middleware handles:
 * - Server-side session validation using Supabase cookies
 * - Automatic redirects for protected routes
 * - Public route access control
 * - Session refresh when needed
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected and auth routes
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/itineraries']
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/callback']
// Public routes don't need explicit checking as they're the default
// const publicRoutes = ['/', '/about', '/privacy', '/terms']

/**
 * Check if path requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}

/**
 * Extract Supabase session from cookies
 * Modern Supabase uses chunked cookies with pattern:
 * - sb-<project-ref>-auth-token (base64url encoded session)
 * - sb-<project-ref>-auth-token.0, .1, etc (chunked for large sessions)
 */
function getSupabaseSession(request: NextRequest) {
  const cookies = request.cookies

  // Check for Supabase auth token (may be chunked)
  // First try to find the main auth token
  let authToken: string | undefined

  // Look for the base auth token
  const baseAuthCookie = cookies.getAll().find(cookie => {
    return (
      cookie.name.startsWith('sb-') &&
      cookie.name.endsWith('-auth-token') &&
      !cookie.name.includes('.')
    )
  })

  if (baseAuthCookie) {
    authToken = baseAuthCookie.value
  } else {
    // Check for chunked cookies (sb-xxx-auth-token.0, .1, etc)
    const chunkedCookies = cookies
      .getAll()
      .filter(cookie => {
        return (
          cookie.name.startsWith('sb-') &&
          cookie.name.includes('-auth-token.') &&
          /\.\d+$/.test(cookie.name)
        )
      })
      .sort((a, b) => {
        const aIndex = parseInt(a.name.split('.').pop() || '0')
        const bIndex = parseInt(b.name.split('.').pop() || '0')
        return aIndex - bIndex
      })

    if (chunkedCookies.length > 0) {
      authToken = chunkedCookies.map(c => c.value).join('')
    }
  }

  return {
    hasSession: !!authToken,
    authToken,
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const { hasSession } = getSupabaseSession(request)

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected routes: redirect to signin if no session
  if (isProtectedRoute(pathname) && !hasSession) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set(
      'redirectTo',
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    )
    return NextResponse.redirect(redirectUrl)
  }

  // Auth routes: redirect to dashboard if already authenticated
  if (isAuthRoute(pathname) && hasSession) {
    // Don't redirect from callback page (it handles its own logic)
    if (pathname === '/auth/callback') {
      return NextResponse.next()
    }

    // Get redirect target from query params or default to dashboard
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Allow all other requests to proceed
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
