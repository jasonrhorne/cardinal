'use client'

import { useEffect, useState } from 'react'

import { createSupabaseClient } from '@/lib/database/supabase'

export default function TestDashboardPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createSupabaseClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      setSessionInfo({
        hasSession: !!session,
        user: session?.user?.email || null,
        error: error?.message || null,
        timestamp: new Date().toISOString(),
      })
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return <div className="p-8">Checking session...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Test Dashboard (No Protection)
      </h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(sessionInfo, null, 2)}
      </pre>
      <p className="mt-4 text-sm text-gray-600">
        This page has no auth protection to test if the session exists.
      </p>
    </div>
  )
}
