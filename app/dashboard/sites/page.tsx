/**
 * Sites Management Page
 */

import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SiteService } from '@/lib/api/v1/services/site.service';

export default async function SitesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch actual sites from the service
  const siteService = new SiteService();
  const sitesResponse = await siteService.getUserSites(user.id);
  
  let sites: any[] = [];
  if (sitesResponse.status === 'success') {
    sites = sitesResponse.data || [];
  } else {
    console.error('Failed to fetch sites:', sitesResponse);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solar Sites</h1>
          <p className="mt-2 text-gray-600">
            Manage your solar installation sites and upload production reports
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sites/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Site
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div key={site.publicId} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">Sitekey: {site.sitekey}</p>
              <p className="mt-1 text-sm text-gray-500">
                {site.pdfUploaded ? '✅ PDF Uploaded' : '📄 No PDF'}
              </p>
              
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/sites/${site.publicId}`}>
                    View Details
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/sites/${site.publicId}/upload`}>
                    Upload PDF
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sites.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">🚀 Get Started</h3>
          <p className="text-sm text-blue-800 mb-3">
            No sites created yet. Create your first site to start uploading PDF reports.
          </p>
          <Button size="sm" asChild>
            <Link href="/dashboard/sites/new">
              Create Your First Site →
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
