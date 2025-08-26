/**
 * Authentication Providers and Context
 *
 * This module provides:
 * - AuthProvider for app-wide auth state
 * - Session management components
 * - Auth context utilities
 * - Protected route components
 */

'use client'

import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

import { useAuth } from './hooks'

// =============================================================================
// AUTH CONTEXT
// =============================================================================

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
  isEmailVerified: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// =============================================================================
// AUTH PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireEmailVerification?: boolean
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/auth/signin',
  requireEmailVerification = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isEmailVerified, loading, initialized } =
    useAuthContext()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!initialized) {
      return
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search
        const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      }
      return
    }

    if (requireEmailVerification && !isEmailVerified) {
      router.push('/auth/verify-email')
      return
    }

    setShouldRender(true)
  }, [
    isAuthenticated,
    isEmailVerified,
    initialized,
    router,
    redirectTo,
    requireEmailVerification,
  ])

  if (loading || !initialized) {
    return fallback || <AuthLoadingSpinner />
  }

  if (!shouldRender) {
    return fallback || <AuthLoadingSpinner />
  }

  return <>{children}</>
}

// =============================================================================
// PUBLIC ROUTE COMPONENT
// =============================================================================

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
  redirectIfAuthenticated?: boolean
}

export function PublicRoute({
  children,
  redirectTo = '/dashboard',
  redirectIfAuthenticated = false,
}: PublicRouteProps) {
  const { isAuthenticated, loading, initialized } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!initialized) {
      return
    }

    if (redirectIfAuthenticated && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [
    isAuthenticated,
    initialized,
    router,
    redirectTo,
    redirectIfAuthenticated,
  ])

  if (loading || !initialized) {
    return <AuthLoadingSpinner />
  }

  return <>{children}</>
}

// =============================================================================
// AUTH GUARD COMPONENT
// =============================================================================

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  requireAuth?: boolean
  requireEmailVerification?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  fallback,
  loadingFallback,
  requireAuth = true,
  requireEmailVerification = false,
  redirectTo = '/auth/signin',
}: AuthGuardProps) {
  const { isAuthenticated, isEmailVerified, loading, initialized } =
    useAuthContext()

  if (loading || !initialized) {
    return loadingFallback || <AuthLoadingSpinner />
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthRequiredFallback redirectTo={redirectTo} />
  }

  if (requireEmailVerification && !isEmailVerified) {
    return fallback || <EmailVerificationRequiredFallback />
  }

  return <>{children}</>
}

// =============================================================================
// LOADING AND FALLBACK COMPONENTS
// =============================================================================

function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

function AuthRequiredFallback({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [router, redirectTo])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-4">
          Please sign in to access this page.
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
      </div>
    </div>
  )
}

function EmailVerificationRequiredFallback() {
  const router = useRouter()

  useEffect(() => {
    router.push('/auth/verify-email')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Email Verification Required
        </h2>
        <p className="text-gray-600 mb-4">
          Please verify your email address to continue.
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
      </div>
    </div>
  )
}

// =============================================================================
// SESSION PERSISTENCE COMPONENT
// =============================================================================

interface SessionPersistenceProps {
  children: React.ReactNode
}

export function SessionPersistence({ children }: SessionPersistenceProps) {
  const { session, initialized } = useAuthContext()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !initialized) {
      return
    }

    // Persist session state to localStorage for faster initial loads
    if (session) {
      localStorage.setItem(
        'cardinal-auth-state',
        JSON.stringify({
          hasSession: true,
          userId: session.user?.id,
          timestamp: Date.now(),
        })
      )
    } else {
      localStorage.removeItem('cardinal-auth-state')
    }
  }, [session, initialized, isClient])

  return <>{children}</>
}

// =============================================================================
// USER PROFILE PROVIDER
// =============================================================================

interface UserProfile {
  id: string
  email: string | undefined
  name: string
}

interface UserProfileContextType {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
)

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}

interface UserProfileProviderProps {
  children: React.ReactNode
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { user, isAuthenticated } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TODO: Implement profile fetching from your database
      // const response = await fetch(`/api/users/${user.id}/profile`)
      // const data = await response.json()
      // setProfile(data)

      // Placeholder for now
      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
      }
      setProfile(userProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    } else {
      setProfile(null)
      setError(null)
    }
  }, [isAuthenticated, fetchProfile])

  const contextValue: UserProfileContextType = {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  }

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  )
}
