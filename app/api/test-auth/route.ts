/**
 * Test endpoint to check Supabase auth configuration
 * DELETE THIS FILE after debugging!
 */

import { NextResponse } from 'next/server'

import { createSupabaseClient } from '@/lib/database/supabase'

export async function GET() {
  try {
    const supabase = createSupabaseClient()

    // Get the current auth settings
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Test what redirect URL would be generated
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`

    return NextResponse.json({
      message: 'Supabase Auth Test',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expectedRedirectUrl: redirectTo,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      sessionExists: !!session,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Supabase Auth Test Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
