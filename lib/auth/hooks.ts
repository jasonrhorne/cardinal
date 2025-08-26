/**
 * Supabase Authentication React Hooks
 *
 * This module provides:
 * - useAuth hook for auth state management
 * - useUser hook for user data
 * - useSession hook for session management
 * - Custom hooks for auth operations
 */

'use client'

import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

import { createSupabaseClient } from '@/lib/database/supabase'

import { signInWithMagicLink, signOut, parseAuthError } from './client'

// =============================================================================
// AUTH STATE HOOK
// =============================================================================

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  })

  // Only create Supabase client on the client side
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') {
      return null as any
    }
    return createSupabaseClient()
  })

  useEffect(() => {
    // Skip on server-side
    if (!supabase || typeof window === 'undefined') {
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        initialized: true,
      })
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          initialized: true,
        })

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOutUser = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  return {
    ...authState,
    signOut: signOutUser,
    isAuthenticated: !!authState.user,
    isEmailVerified: !!authState.user?.email_confirmed_at,
  }
}

// =============================================================================
// USER HOOK
// =============================================================================

export function useUser() {
  const { user, loading, initialized } = useAuth()

  const userMetadata = user
    ? {
        id: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata,
        appMetadata: user.app_metadata,
      }
    : null

  return {
    user,
    userMetadata,
    loading,
    initialized,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
  }
}

// =============================================================================
// SESSION HOOK
// =============================================================================

export function useSession() {
  const { session, loading, initialized } = useAuth()

  return {
    session,
    loading,
    initialized,
    accessToken: session?.access_token,
    refreshToken: session?.refresh_token,
    expiresAt: session?.expires_at,
    isValid: !!session && session.expires_at! > Date.now() / 1000,
  }
}

// =============================================================================
// MAGIC LINK HOOK
// =============================================================================

export function useMagicLink() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendMagicLink = useCallback(
    async (email: string, redirectTo?: string) => {
      setIsLoading(true)
      setMessage('')
      setError(null)

      try {
        await signInWithMagicLink(email, redirectTo)
        setMessage('Magic link sent! Check your email to continue.')
        return { success: true }
      } catch (err) {
        const errorMessage = parseAuthError(err)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setMessage('')
    setError(null)
  }, [])

  return {
    sendMagicLink,
    isLoading,
    message,
    error,
    reset,
  }
}

// =============================================================================
// AUTH GUARD HOOK
// =============================================================================

interface UseAuthGuardOptions {
  redirectTo?: string
  onUnauthenticated?: () => void
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { isAuthenticated, loading, initialized } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      return
    }

    if (!isAuthenticated) {
      if (options.onUnauthenticated) {
        options.onUnauthenticated()
      } else if (options.redirectTo && typeof window !== 'undefined') {
        window.location.href = options.redirectTo
      }
      setIsAuthorized(false)
    } else {
      setIsAuthorized(true)
    }
  }, [isAuthenticated, initialized, options])

  return {
    isAuthorized,
    isLoading: loading || !initialized,
    isAuthenticated,
  }
}

// =============================================================================
// AUTH LOADING HOOK
// =============================================================================

export function useAuthLoading() {
  const { loading, initialized } = useAuth()

  return {
    isLoading: loading || !initialized,
    isInitialized: initialized,
  }
}
