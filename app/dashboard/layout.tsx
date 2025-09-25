/**
 * Dashboard Layout
 * Protected layout for authenticated users
 * Includes header with navigation and logout functionality
 */

import { getCurrentUser } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
