'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button, Input } from '@/components/ui'
import { useMagicLink, useAuth } from '@/lib/auth'

export default function SignInPage() {
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

    const result = await sendMagicLink(
      email,
      `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
    )

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
