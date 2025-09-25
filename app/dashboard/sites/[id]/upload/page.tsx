import { getCurrentUser } from '@/lib/auth/supabase-server';
import { SiteService } from '@/lib/api/v1/services/site.service';
import { PdfUpload } from '@/components/sites/pdf-processing/pdf-upload';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SiteUploadPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const siteService = new SiteService();
  
  try {
    const siteResponse = await siteService.getByPublicId(params.id, user.id);
    
    if (siteResponse.status !== 'success') {
      redirect('/dashboard/sites');
    }

    const site = siteResponse.data;

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/sites/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Upload PDF Report</h1>
          <p className="text-gray-600 mt-2">
            Upload a solar production PDF for <strong>{site.name}</strong>
          </p>
        </div>

        <div className="max-w-4xl">
          <PdfUpload siteId={params.id} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Supported PDF Formats</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Aurora Solar production reports with monthly data tables</li>
            <li>• HelioScope reports containing monthly kWh values</li>
            <li>• PDFs must include "Energy to Grid" total value</li>
            <li>• Monthly production data for all 12 months required</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading site:', error);
    redirect('/dashboard/sites');
  }
}
