'use client'

import { useState } from 'react'

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
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Enter your email address"
        />
      </div>

      {message && (
        <div className={`text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send magic link'}
        </button>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>
          We&apos;ll send you a secure link to sign in without a password.
        </p>
      </div>
    </form>
  )
}