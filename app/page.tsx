/**
 * Root Page
 * Redirects users to appropriate page based on auth state
 * This is handled by middleware, so this page should rarely be seen
 */

import { getCurrentUser } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const user = await getCurrentUser()
  
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
