/**
 * Debug endpoint to check current session status
 * DELETE THIS FILE after debugging!
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createSupabaseClient } from '@/lib/database/supabase'

export async function GET() {
  try {
    const supabase = createSupabaseClient()

    // Get the current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Check cookies
    const cookieStore = cookies()
    const allCookies: Record<string, string> = {}

    cookieStore.getAll().forEach(cookie => {
      // Only show Supabase-related cookies (hide sensitive values)
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        allCookies[cookie.name] = cookie.value ? 'Set (hidden)' : 'Not set'
      }
    })

    return NextResponse.json({
      message: 'Session Check',
      hasSession: !!session,
      sessionUser: session?.user?.email || null,
      sessionError: error?.message || null,
      cookies: allCookies,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Session Check Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
