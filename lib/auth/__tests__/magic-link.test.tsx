/**
 * Integration Tests for Magic Link Authentication Flow
 */

import { createClient } from '@supabase/supabase-js'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import CallbackPage from '@/app/auth/callback/page'
import CheckEmailPage from '@/app/auth/check-email/page'
import SignInPage from '@/app/auth/signin/page'

// Mock Supabase client module
jest.mock('../../database/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock Next.js dynamic for SSR components
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    // Return a simple component for testing
    return function DynamicComponent(props: any) {
      return props.children || null
    }
  },
}))

describe('Magic Link Authentication Flow', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithOtp: jest.fn(),
        getSession: jest.fn(),
        exchangeCodeForSession: jest.fn(),
      },
    }

    // Mock createClient to return our mock client
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('Sign In Page', () => {
    it('should render sign in form', () => {
      render(<SignInPage />)

      expect(
        screen.getByRole('heading', { name: /sign in to cardinal/i })
      ).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /send magic link/i })
      ).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', {
        name: /send magic link/i,
      })

      // Try invalid email
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      // Check for validation (HTML5 validation)
      expect(emailInput).toBeInvalid()
    })

    it('should send magic link on valid submission', async () => {
      const user = userEvent.setup()
      const mockPush = jest.fn()

      // Mock useRouter
      const useRouter = require('next/navigation').useRouter
      useRouter.mockReturnValue({ push: mockPush })

      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        error: null,
      })

      render(<SignInPage />)

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', {
        name: /send magic link/i,
      })

      // Enter valid email
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          },
        })
      })

      // Should redirect to check email page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/check-email?email=test%40example.com'
        )
      })
    })

    it('should handle sign in errors', async () => {
      const user = userEvent.setup()

      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      })

      render(<SignInPage />)

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', {
        name: /send magic link/i,
      })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      // Make the promise hang to test loading state
      mockSupabaseClient.auth.signInWithOtp.mockImplementation(
        () => new Promise(() => {})
      )

      render(<SignInPage />)

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', {
        name: /send magic link/i,
      })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Button should show loading state
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/sending.../i)).toBeInTheDocument()
    })
  })

  describe('Check Email Page', () => {
    it('should display check email message', () => {
      const useSearchParams = require('next/navigation').useSearchParams
      useSearchParams.mockReturnValue({
        get: jest.fn(key => {
          if (key === 'email') {
            return 'test@example.com'
          }
          return null
        }),
      })

      render(<CheckEmailPage />)

      expect(
        screen.getByRole('heading', { name: /check your email/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
      expect(
        screen.getByText(/we've sent you a magic link/i)
      ).toBeInTheDocument()
    })

    it('should allow resending magic link', async () => {
      const user = userEvent.setup()
      const useSearchParams = require('next/navigation').useSearchParams
      useSearchParams.mockReturnValue({
        get: jest.fn(key => {
          if (key === 'email') {
            return 'test@example.com'
          }
          return null
        }),
      })

      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        error: null,
      })

      render(<CheckEmailPage />)

      const resendButton = screen.getByRole('button', {
        name: /resend email/i,
      })

      await user.click(resendButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          },
        })
      })

      // Should show success message
      expect(screen.getByText(/email sent!/i)).toBeInTheDocument()
    })
  })

  describe('Auth Callback Page', () => {
    it('should exchange code for session', async () => {
      const mockPush = jest.fn()
      const useRouter = require('next/navigation').useRouter
      const useSearchParams = require('next/navigation').useSearchParams

      useRouter.mockReturnValue({ push: mockPush })
      useSearchParams.mockReturnValue({
        get: jest.fn(key => {
          if (key === 'code') {
            return 'test-code-123'
          }
          return null
        }),
      })

      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'token-123',
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
        error: null,
      })

      render(<CallbackPage />)

      // Should show processing message
      expect(screen.getByText(/verifying.../i)).toBeInTheDocument()

      await waitFor(() => {
        expect(
          mockSupabaseClient.auth.exchangeCodeForSession
        ).toHaveBeenCalledWith('test-code-123')
      })

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle callback errors', async () => {
      const mockPush = jest.fn()
      const useRouter = require('next/navigation').useRouter
      const useSearchParams = require('next/navigation').useSearchParams

      useRouter.mockReturnValue({ push: mockPush })
      useSearchParams.mockReturnValue({
        get: jest.fn(key => {
          if (key === 'code') {
            return 'invalid-code'
          }
          return null
        }),
      })

      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid or expired code' },
      })

      render(<CallbackPage />)

      await waitFor(() => {
        expect(
          mockSupabaseClient.auth.exchangeCodeForSession
        ).toHaveBeenCalledWith('invalid-code')
      })

      // Should redirect to sign in with error
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/signin?error=Invalid%20or%20expired%20code'
        )
      })
    })

    it('should handle missing code parameter', async () => {
      const mockPush = jest.fn()
      const useRouter = require('next/navigation').useRouter
      const useSearchParams = require('next/navigation').useSearchParams

      useRouter.mockReturnValue({ push: mockPush })
      useSearchParams.mockReturnValue({
        get: jest.fn(() => null),
      })

      render(<CallbackPage />)

      // Should redirect to sign in immediately
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })

      // Should not attempt to exchange code
      expect(
        mockSupabaseClient.auth.exchangeCodeForSession
      ).not.toHaveBeenCalled()
    })
  })
})
