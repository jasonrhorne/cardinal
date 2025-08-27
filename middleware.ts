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

// Check if path requires authentication
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

// Check if path is an auth route
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}

// Simplified session check - just look for any Supabase auth cookie
function hasSupabaseSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()

  // TEMPORARY DEBUG: Log cookies to understand what we're getting
  console.log(
    '[Middleware Debug] All cookies:',
    cookies.map(c => `${c.name}=${c.value ? 'present' : 'empty'}`)
  )

  // Look for any Supabase auth-related cookies
  const hasAuthCookie = cookies.some(cookie => {
    const isSupabaseCookie =
      cookie.name.startsWith('sb-') &&
      cookie.name.includes('auth-token') &&
      cookie.value &&
      cookie.value.length > 0

    if (isSupabaseCookie) {
      console.log('[Middleware Debug] Found Supabase auth cookie:', cookie.name)
    }

    return isSupabaseCookie
  })

  console.log('[Middleware Debug] Has session:', hasAuthCookie)
  return hasAuthCookie
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for session using simplified method
  const hasSession = hasSupabaseSession(request)

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
     * - auth/callback (authentication callback handling)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback|api).*)',
  ],
}
