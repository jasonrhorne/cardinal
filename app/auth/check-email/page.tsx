'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

import { useAuth } from '@/lib/auth'

function CheckEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get email from query params or localStorage
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      router.push(redirectTo)
    }
  }, [isAuthenticated, router, searchParams])

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h2>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a magic link to{' '}
          {email && <span className="font-medium text-gray-900">{email}</span>}
          {!email && 'your email address'}.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Click the link in the email to sign in. The link will expire in 1
          hour.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-md transition-colors"
        >
          Back to sign in
        </button>

        <div className="text-sm text-gray-500">
          <p>
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              onClick={() => router.push('/auth/signin')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-md text-left">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Having trouble?
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Make sure to check your spam/junk folder</li>
          <li>• The magic link expires after 1 hour</li>
          <li>• You can only use each magic link once</li>
          <li>• Make sure you&apos;re opening the link in the same browser</li>
        </ul>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
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
              Please wait while we prepare your confirmation page.
            </p>
          </div>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  )
}
