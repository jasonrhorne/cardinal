'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

import { Button, Input } from '@/components/ui'
import { useMagicLink, useAuth } from '@/lib/auth'

// Force this page to be dynamic (not statically generated)
// This prevents SSR issues with client-side auth components
export const dynamic = 'force-dynamic'

function SignInContent() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const { sendMagicLink, isLoading, message, error, reset } = useMagicLink()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()

    // Handle SSR - window is not available during server-side rendering
    const callbackUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        : `/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

    const result = await sendMagicLink(email, callbackUrl)

    if (result.success) {
      // Optionally redirect to a confirmation page
      // router.push('/auth/check-email')
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email address"
        label="Email address"
      />

      {(message || error) && (
        <div
          className={`text-sm ${message ? 'text-green-600' : 'text-red-600'}`}
        >
          {message || error}
        </div>
      )}

      <Button
        type="submit"
        size="md"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send magic link'}
      </Button>

      <div className="text-center text-sm text-subtle">
        <p>We&apos;ll send you a secure link to sign in without a password.</p>
      </div>
    </form>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we prepare the sign-in page.
            </p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
