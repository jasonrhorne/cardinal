import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Cardinal API is running',
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'healthy',
    method: 'POST',
    timestamp: new Date().toISOString(),
  })
}
