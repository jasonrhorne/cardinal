/**
 * Supabase Authentication Client Utilities
 *
 * This module provides:
 * - Magic link authentication functions
 * - Session management utilities
 * - Auth state helpers
 * - Type-safe auth operations
 */

import type { User, Session } from '@supabase/supabase-js'

import { createSupabaseClient } from '@/lib/database/supabase'

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Send magic link to user's email
 */
export const signInWithMagicLink = async (
  email: string,
  redirectTo?: string
) => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`)
  }

  return data
}

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const supabase = createSupabaseClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`)
  }
}

/**
 * Get current session
 */
export const getSession = async (): Promise<Session | null> => {
  const supabase = createSupabaseClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Failed to get session:', error.message)
    return null
  }

  return session
}

/**
 * Get current user
 */
export const getUser = async (): Promise<User | null> => {
  const supabase = createSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Failed to get user:', error.message)
    return null
  }

  return user
}

/**
 * Refresh the current session
 */
export const refreshSession = async () => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    throw new Error(`Failed to refresh session: ${error.message}`)
  }

  return data
}

// =============================================================================
// AUTH STATE HELPERS
// =============================================================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession()
  return !!session
}

/**
 * Check if user has verified email
 */
export const isEmailVerified = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user?.email_confirmed_at
}

/**
 * Get user metadata
 */
export const getUserMetadata = async () => {
  const user = await getUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
    metadata: user.user_metadata,
    appMetadata: user.app_metadata,
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Parse Supabase auth errors into user-friendly messages
 */
export const parseAuthError = (error: any): string => {
  if (!error) {
    return 'An unknown error occurred'
  }

  // Common Supabase auth error codes
  switch (error.message || error.code) {
    case 'Email rate limit exceeded':
      return 'Too many requests. Please wait a few minutes before trying again.'
    case 'Invalid login credentials':
      return 'Invalid email or password.'
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link.'
    case 'signups_disabled':
      return 'New signups are temporarily disabled.'
    case 'email_change_confirm_error':
      return 'Email change confirmation failed.'
    case 'same_password':
      return 'New password must be different from your current password.'
    case 'session_not_found':
      return 'Your session has expired. Please sign in again.'
    case 'refresh_token_not_found':
      return 'Authentication session expired. Please sign in again.'
    default:
      return error.message || 'Authentication failed. Please try again.'
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface MagicLinkResponse {
  success: boolean
  message: string
  error?: AuthError
}
