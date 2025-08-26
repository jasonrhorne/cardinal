/**
 * Debug endpoint to check environment variables
 * DELETE THIS FILE after debugging!
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // Show environment info (delete this endpoint after debugging)

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  }

  return NextResponse.json({
    message: 'Environment Variables',
    env: envVars,
    timestamp: new Date().toISOString(),
  })
}
