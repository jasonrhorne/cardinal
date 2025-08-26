/**
 * Unit Tests for Authentication Providers and Components
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { useAuth } from '../hooks'
import {
  AuthProvider,
  useAuthContext,
  ProtectedRoute,
  PublicRoute,
  AuthGuard,
} from '../providers'

// Mock the hooks module
jest.mock('../hooks', () => ({
  useAuth: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Test component to access auth context
function TestComponent() {
  const auth = useAuthContext()
  return (
    <div>
      <div data-testid="user-email">{auth.user?.email || 'No user'}</div>
      <div data-testid="is-authenticated">
        {auth.isAuthenticated ? 'true' : 'false'}
      </div>
      <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  const mockUseAuth = useAuth as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide auth context to children', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'test@example.com'
    )
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('should throw error when useAuthContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => render(<TestComponent />)).toThrow(
      'useAuthContext must be used within an AuthProvider'
    )

    consoleSpy.mockRestore()
  })
})

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth as jest.Mock
  const mockRouterPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    })
  })

  it('should show loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    // Should show loading spinner (look for the loading div)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render children when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it.skip('should redirect to signin when not authenticated', async () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/dashboard',
        search: '?test=1',
        href: 'http://localhost:3000/dashboard?test=1',
        toString: () => 'http://localhost:3000/dashboard?test=1',
      },
    })

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/auth/signin?redirectTo=%2Fdashboard%3Ftest%3D1'
      )
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it.skip('should redirect to custom path when specified', async () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/dashboard',
        search: '',
        href: 'http://localhost:3000/dashboard',
        toString: () => 'http://localhost:3000/dashboard',
      },
    })

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute redirectTo="/login">
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/login?redirectTo=%2Fdashboard'
      )
    })
  })

  it('should redirect to verify email when email not verified', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com', email_confirmed_at: null },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute requireEmailVerification>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/auth/verify-email')
    })
  })

  it('should render custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<div>Custom Loading</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.getByText('Custom Loading')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})

describe('PublicRoute', () => {
  const mockUseAuth = useAuth as jest.Mock
  const mockRouterPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    })
  })

  it('should render children when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })
  })

  it('should render children when authenticated and redirectIfAuthenticated is false', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('should redirect when authenticated and redirectIfAuthenticated is true', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <PublicRoute redirectIfAuthenticated>
          <div>Public Content</div>
        </PublicRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should redirect to custom path when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <PublicRoute redirectIfAuthenticated redirectTo="/app">
          <div>Public Content</div>
        </PublicRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/app')
    })
  })
})

describe('AuthGuard', () => {
  const mockUseAuth = useAuth as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children when auth requirements are met', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: true,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard requireAuth>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Guarded Content')).toBeInTheDocument()
  })

  it('should render fallback when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard requireAuth>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard requireAuth fallback={<div>Please Login</div>}>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Please Login')).toBeInTheDocument()
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('should render email verification fallback when email not verified', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com', email_confirmed_at: null },
      session: { access_token: 'token' },
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard requireAuth requireEmailVerification>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('should render custom loading fallback', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard loadingFallback={<div>Custom Loading</div>}>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Custom Loading')).toBeInTheDocument()
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('should render children when requireAuth is false', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: false,
      isEmailVerified: false,
      signOut: jest.fn(),
    })

    render(
      <AuthProvider>
        <AuthGuard requireAuth={false}>
          <div>Guarded Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText('Guarded Content')).toBeInTheDocument()
  })
})
