/**
 * New Site Page
 */

import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SiteForm } from '@/components/sites/management/site-form';

export default async function NewSitePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sites">
            <ArrowLeft className="h-4 w-4" />
            Back to Sites
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Site</h1>
        <p className="mt-2 text-gray-600">
          Create a new solar installation site for PDF analysis
        </p>
      </div>

      <div className="max-w-2xl">
        <SiteForm mode="create" />
      </div>
    </div>
  );
}
