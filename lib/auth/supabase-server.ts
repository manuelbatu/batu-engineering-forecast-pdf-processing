/**
 * Supabase Server
 * Server-side Supabase configuration for App Router
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export function createSupabaseServer() {
  const cookieStore = cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  try {
    const supabase = createSupabaseServer()
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session.user
  } catch (error) {
    console.warn('Error getting current user:', error)
    return null
  }
}
