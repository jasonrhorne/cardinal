/**
 * Profile API Route Handler
 *
 * Handles:
 * - GET /api/profile - Get current user's profile
 * - PUT /api/profile - Update current user's profile
 * - POST /api/profile - Create initial profile (if needed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createSupabaseServerClient } from '@/lib/database/supabase'
import type { UserProfile, ProfileUpdatePayload } from '@/types/profile'

// ============================================================================
// SCHEMAS
// ============================================================================

const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).nullable().optional(),
  display_name: z.string().min(1).max(50).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  travel_preferences: z
    .object({
      budget_range: z
        .object({
          min: z.number().positive(),
          max: z.number().positive(),
          currency: z.string().length(3),
        })
        .optional(),
      travel_pace: z.enum(['relaxed', 'moderate', 'packed']).optional(),
      interests: z.array(z.string()).optional(),
      dietary_restrictions: z.array(z.string()).optional(),
      accessibility_needs: z.array(z.string()).optional(),
      preferred_accommodation: z
        .array(z.enum(['hotel', 'airbnb', 'hostel', 'boutique']))
        .optional(),
      travel_style: z
        .array(z.enum(['luxury', 'comfort', 'budget', 'backpacking']))
        .optional(),
      group_composition: z
        .enum(['solo', 'couple', 'family', 'friends'])
        .optional(),
      preferred_destinations: z.array(z.string()).optional(),
    })
    .optional(),
  settings: z
    .object({
      email_notifications: z.boolean().optional(),
      marketing_emails: z.boolean().optional(),
      public_profile: z.boolean().optional(),
      default_currency: z.string().length(3).optional(),
      default_units: z.enum(['metric', 'imperial']).optional(),
      timezone: z.string().optional(),
    })
    .optional(),
})

// ============================================================================
// GET HANDLER - Fetch user profile
// ============================================================================

async function handleGet(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Fetch profile from database
    const { data: profile, error: profileError } = (await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()) as any

    if (profileError) {
      // If profile doesn't exist, return null (client can handle creation)
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          status: 'success',
          data: null,
        })
      }

      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        {
          status: 'error',
          error: 'Failed to fetch profile',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: profile as UserProfile,
    })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST HANDLER - Create initial profile
// ============================================================================

async function handlePost(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check if profile already exists
    const { data: existingProfile } = (await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()) as any

    if (existingProfile) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Profile already exists',
        },
        { status: 409 }
      )
    }

    // Create new profile
    const { data: profile, error: createError } = (await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name: validatedData.full_name || user.user_metadata?.full_name,
        display_name: validatedData.display_name,
        bio: validatedData.bio,
        avatar_url: validatedData.avatar_url || user.user_metadata?.avatar_url,
        travel_preferences: validatedData.travel_preferences || {},
        settings: validatedData.settings || {
          email_notifications: true,
          marketing_emails: false,
          public_profile: false,
          default_currency: 'USD',
          default_units: 'imperial',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      } as any)
      .select()
      .single()) as any

    if (createError) {
      console.error('Profile creation error:', createError)
      return NextResponse.json(
        {
          status: 'error',
          error: 'Failed to create profile',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        data: profile as UserProfile,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Invalid request data',
          details: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('POST /api/profile error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT HANDLER - Update profile
// ============================================================================

async function handlePut(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(
      body
    ) as ProfileUpdatePayload

    // Build update object
    const updateData: any = {}

    // Update basic fields if provided
    if (validatedData.full_name !== undefined) {
      updateData.full_name = validatedData.full_name
    }
    if (validatedData.display_name !== undefined) {
      updateData.display_name = validatedData.display_name
    }
    if (validatedData.bio !== undefined) {
      updateData.bio = validatedData.bio
    }
    if (validatedData.avatar_url !== undefined) {
      updateData.avatar_url = validatedData.avatar_url
    }

    // Merge travel preferences if provided (partial update)
    if (validatedData.travel_preferences) {
      const { data: currentProfile } = (await supabase
        .from('profiles')
        .select('travel_preferences')
        .eq('user_id', user.id)
        .single()) as any

      updateData.travel_preferences = {
        ...(currentProfile?.travel_preferences || {}),
        ...validatedData.travel_preferences,
      }
    }

    // Merge settings if provided (partial update)
    if (validatedData.settings) {
      const { data: currentProfile } = (await supabase
        .from('profiles')
        .select('settings')
        .eq('user_id', user.id)
        .single()) as any

      updateData.settings = {
        ...(currentProfile?.settings || {}),
        ...validatedData.settings,
      }
    }

    // Update profile
    const { data: profile, error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        {
          status: 'error',
          error: 'Failed to update profile',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: profile as UserProfile,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Invalid request data',
          details: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('PUT /api/profile error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// ROUTE EXPORTS
// ============================================================================

export async function GET(request: NextRequest) {
  return handleGet(request)
}

export async function POST(request: NextRequest) {
  return handlePost(request)
}

export async function PUT(request: NextRequest) {
  return handlePut(request)
}
