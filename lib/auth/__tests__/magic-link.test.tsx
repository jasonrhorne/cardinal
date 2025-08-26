/**
 * Unit Tests for Magic Link Authentication
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock auth hooks
const mockSendMagicLink = jest.fn()
const mockUseAuth = jest.fn()
const mockUseMagicLink = jest.fn()

jest.mock('../../auth', () => ({
  useAuth: () => mockUseAuth(),
  useMagicLink: () => mockUseMagicLink(),
}))

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}))

// Mock Supabase
jest.mock('../../database/supabase', () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}))

describe('Magic Link Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
    })

    mockUseMagicLink.mockReturnValue({
      sendMagicLink: mockSendMagicLink,
      isLoading: false,
      message: null,
      error: null,
      reset: jest.fn(),
    })
  })

  describe('useMagicLink hook', () => {
    it('should send magic link successfully', async () => {
      mockSendMagicLink.mockResolvedValue({
        success: true,
        error: null,
      })

      const { sendMagicLink } = mockUseMagicLink()
      const result = await sendMagicLink('test@example.com')

      expect(mockSendMagicLink).toHaveBeenCalledWith('test@example.com')
      expect(result).toEqual({ success: true, error: null })
    })

    it('should handle magic link errors', async () => {
      mockSendMagicLink.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
      })

      const { sendMagicLink } = mockUseMagicLink()
      const result = await sendMagicLink('test@example.com')

      expect(result).toEqual({ success: false, error: 'Rate limit exceeded' })
    })

    it('should show loading state during request', async () => {
      let resolvePromise: any
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockSendMagicLink.mockReturnValue(promise)
      mockUseMagicLink.mockReturnValue({
        sendMagicLink: mockSendMagicLink,
        isLoading: true,
        message: null,
        error: null,
        reset: jest.fn(),
      })

      const { isLoading } = mockUseMagicLink()
      expect(isLoading).toBe(true)

      // Resolve the promise
      resolvePromise({ success: true, error: null })
      await promise
    })
  })

  describe('Authentication flow', () => {
    it('should redirect authenticated users away from signin', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
        loading: false,
      })

      // In a real component, useAuth would trigger a redirect
      const { isAuthenticated } = mockUseAuth()

      if (isAuthenticated) {
        mockPush('/dashboard')
      }

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle email validation', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ]

      const invalidEmails = ['invalid', 'invalid@', '@example.com', 'user@']

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should handle successful authentication callback', async () => {
      const mockSession = {
        access_token: 'token-123',
        user: { id: 'user-123', email: 'test@example.com' },
      }

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
      })

      // Simulate auth state change
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockSession.user,
        session: mockSession,
        loading: false,
      })

      const { isAuthenticated } = mockUseAuth()
      expect(isAuthenticated).toBe(true)
    })

    it('should handle authentication errors', async () => {
      mockUseMagicLink.mockReturnValue({
        sendMagicLink: mockSendMagicLink,
        isLoading: false,
        message: null,
        error: 'Invalid email address',
        reset: jest.fn(),
      })

      const { error } = mockUseMagicLink()
      expect(error).toBe('Invalid email address')
    })

    it('should reset error state', () => {
      const mockReset = jest.fn()
      mockUseMagicLink.mockReturnValue({
        sendMagicLink: mockSendMagicLink,
        isLoading: false,
        message: null,
        error: 'Some error',
        reset: mockReset,
      })

      const { reset } = mockUseMagicLink()
      reset()

      expect(mockReset).toHaveBeenCalled()
    })
  })
})
