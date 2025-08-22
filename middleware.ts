/**
 * Next.js Middleware for Route Protection
 *
 * This middleware handles:
 * - Route-based authentication
 * - Automatic redirects for protected routes
 * - Public route access control
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define route patterns (temporarily unused while middleware is disabled)
// const protectedRoutes = ['/dashboard', '/profile', '/settings', '/itineraries']
// const authRoutes = ['/auth/signin', '/auth/signup', '/auth/callback']
// const publicRoutes = ['/', '/about', '/privacy', '/terms'] // For future use

export function middleware(_request: NextRequest) {
  // Temporarily disable middleware to allow client-side auth to work
  // We'll re-enable this later with proper session handling
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
