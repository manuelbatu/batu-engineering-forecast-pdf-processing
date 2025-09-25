/**
 * Site Detail Page
 */

import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Edit3 } from 'lucide-react';
import { SiteService } from '@/lib/api/v1/services/site.service';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SiteDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch real site data
  const siteService = new SiteService();
  const siteResponse = await siteService.getByPublicId(params.id, user.id);
  
  if (siteResponse.status !== 'success') {
    redirect('/dashboard/sites');
  }

  const site = siteResponse.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sites">
            <ArrowLeft className="h-4 w-4" />
            Back to Sites
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
          <p className="mt-2 text-gray-600">Sitekey: {site.sitekey}</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Site
          </Button>
          <Button asChild>
            <Link href={`/dashboard/sites/${params.id}/upload`}>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Site Information</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sitekey</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{site.sitekey}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">PDF Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      site.pdfUploaded 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {site.pdfUploaded ? '✅ PDF Uploaded' : '📄 No PDF Yet'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <Button asChild className="w-full">
                <Link href={`/dashboard/sites/${params.id}/upload`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF Report
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Site Details
              </Button>
            </div>
          </div>

          {/* PDF Processing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📊 PDF Processing</h4>
            <p className="text-sm text-blue-800 mb-3">
              Upload Aurora Solar or HelioScope PDFs to extract monthly production data automatically.
            </p>
            <Button size="sm" asChild>
              <Link href={`/dashboard/sites/${params.id}/upload`}>
                Get Started →
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
