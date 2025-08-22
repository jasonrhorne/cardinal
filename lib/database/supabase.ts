/**
 * Supabase Database Client Configuration
 *
 * This module provides:
 * - Supabase client initialization
 * - Database connection management
 * - Environment-aware configuration
 * - Type-safe database operations
 */

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

// =============================================================================
// CLIENT-SIDE SUPABASE CLIENT
// =============================================================================

// Singleton client instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Client-side Supabase client for browser operations
 * Uses anon key and respects RLS policies
 */
export const createSupabaseClient = () => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Get environment variables directly from process.env for client-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables for client')
  }

  // Create and cache the client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: 'public',
    },
  })

  return supabaseClient
}

// =============================================================================
// SERVER-SIDE SUPABASE CLIENT
// =============================================================================

/**
 * Server-side Supabase client for administrative operations
 * Uses service role key and bypasses RLS
 */
export const createSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for server')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}

// =============================================================================
// DATABASE CONNECTION HELPERS
// =============================================================================

/**
 * Get Supabase client with automatic environment detection
 */
export const getSupabaseClient = () => {
  // Check if we're on the server or client
  if (typeof window === 'undefined') {
    // Server-side: Use service role client
    return createSupabaseServerClient()
  } else {
    // Client-side: Use anon client
    return createSupabaseClient()
  }
}

/**
 * Database connection health check
 */
export const checkDatabaseConnection = async () => {
  try {
    const supabase = createSupabaseServerClient()

    // Simple query to test connection
    const { error } = await supabase.from('users').select('count(*)').limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (expected during setup)
      throw error
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Database connection successful',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message:
        error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

// =============================================================================
// TYPE-SAFE QUERY HELPERS
// =============================================================================

/**
 * Execute a raw SQL query with proper error handling
 * Note: This is a placeholder function. In practice, you would use
 * Supabase's built-in query methods or create custom RPC functions.
 */
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    // For now, return a placeholder response
    // In production, you would implement proper SQL execution
    console.warn('executeQuery is a placeholder function', { query, params })
    return { data: null as T, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown query error'),
    }
  }
}

/**
 * Get database statistics and health metrics
 */
export const getDatabaseStats = async () => {
  try {
    const supabase = createSupabaseServerClient()

    // Get basic table statistics
    const queries = [
      supabase.from('users').select('count()', { count: 'exact', head: true }),
      supabase
        .from('itineraries')
        .select('count()', { count: 'exact', head: true }),
      supabase.from('places').select('count()', { count: 'exact', head: true }),
    ]

    const [usersResult, itinerariesResult, placesResult] =
      await Promise.all(queries)

    return {
      users: usersResult?.count || 0,
      itineraries: itinerariesResult?.count || 0,
      places: placesResult?.count || 0,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return {
      users: 0,
      itineraries: 0,
      places: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown stats error',
    }
  }
}

// =============================================================================
// SUPABASE-SPECIFIC UTILITIES
// =============================================================================

/**
 * Enable real-time subscriptions for a table
 */
export const subscribeToTable = <T = any>(
  tableName: string,
  callback: (payload: T) => void,
  filter?: string
) => {
  const supabase = createSupabaseClient()

  const subscription = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filter,
      },
      callback
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob
) => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`File upload failed: ${error.message}`)
  }

  return data
}

/**
 * Get signed URL for private file access
 */
export const getSignedUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
) => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// =============================================================================
// TYPES
// =============================================================================

export type SupabaseClient = ReturnType<typeof createSupabaseClient>
export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>

// Re-export Supabase types for convenience
export type { User, Session } from '@supabase/supabase-js'
