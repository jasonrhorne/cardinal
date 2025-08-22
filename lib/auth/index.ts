/**
 * Authentication Module Exports
 *
 * Centralized exports for all authentication utilities
 */

// Client utilities
export {
  signInWithMagicLink,
  signOut,
  getSession,
  getUser,
  refreshSession,
  isAuthenticated,
  isEmailVerified,
  getUserMetadata,
  AuthError,
  parseAuthError,
} from './client'

// React hooks
export {
  useAuth,
  useUser,
  useSession,
  useMagicLink,
  useAuthGuard,
  useAuthLoading,
} from './hooks'

// Middleware utilities
export {
  validateSession,
  withAuth,
  withOptionalAuth,
  withRole,
  isProtectedRoute,
  isPublicRoute,
  getAuthRedirectUrl,
  getUserFromRequest,
  hasPermission,
  createSessionResponse,
  clearSessionResponse,
  createAuthErrorResponse,
  AuthMiddlewareError,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
} from './middleware'

// React components and providers
export {
  AuthProvider,
  ProtectedRoute,
  PublicRoute,
  AuthGuard,
  SessionPersistence,
  UserProfileProvider,
  useAuthContext,
  useUserProfile,
} from './providers'

// Types
export type { AuthResponse, MagicLinkResponse } from './client'
