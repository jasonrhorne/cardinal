/**
 * Unit Tests for Authentication Hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react'

import { useAuth } from '../hooks'

// Mock the Supabase client module
jest.mock('../../database/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

describe('useAuth', () => {
  let mockSupabaseClient: any
  let mockAuthStateChange: jest.Mock

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup mock auth state change subscription
    mockAuthStateChange = jest.fn()

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        onAuthStateChange: jest.fn(callback => {
          mockAuthStateChange.mockImplementation(callback)
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }

    // Mock createSupabaseClient to return our mock client
    const { createSupabaseClient } = require('../../database/supabase')
    createSupabaseClient.mockReturnValue(mockSupabaseClient)
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.initialized).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('should set initialized after checking session', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
        expect(result.current.loading).toBe(false)
      })
    })
  })

  it('should handle authenticated user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isEmailVerified).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })
  })

  it('should handle unauthenticated user', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isEmailVerified).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  it('should handle unverified email', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: null, // Email not confirmed
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isEmailVerified).toBe(false)
    })
  })

  it('should handle sign out', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Sign out
    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const { result } = renderHook(() => useAuth())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    }

    // Simulate auth state change (user signs in)
    act(() => {
      mockAuthStateChange('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    // Simulate sign out
    act(() => {
      mockAuthStateChange('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  it('should handle session errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error'),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should cleanup subscription on unmount', async () => {
    const unsubscribe = jest.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})
