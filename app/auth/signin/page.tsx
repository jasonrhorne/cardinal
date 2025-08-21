'use client'

import { useState } from 'react'

import { Button, Input } from '@/components/ui'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // TODO: Implement magic link authentication with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setMessage('Magic link sent! Check your email.')
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
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

      {message && (
        <div
          className={`text-sm ${message.includes('sent') ? 'text-success-600' : 'text-error-600'}`}
        >
          {message}
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
