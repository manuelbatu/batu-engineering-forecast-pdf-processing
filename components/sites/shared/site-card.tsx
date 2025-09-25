'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Upload, 
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Site {
  publicId: string;
  name: string;
  location: string;
  description?: string;
  systemSize?: number;
  installationType?: string;
  status: string;
  createdAt: string;
}

interface SiteCardProps {
  site: Site;
  onDelete?: (siteId: string) => void;
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{site.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {site.location}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(site.status)}>
              {site.status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/sites/${site.publicId}`}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Site
                  </Link>
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(site.publicId)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {site.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {site.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {site.systemSize && (
            <div>
              <span className="text-gray-500">System Size</span>
              <p className="font-medium">{site.systemSize} kW</p>
            </div>
          )}
          
          {site.installationType && (
            <div>
              <span className="text-gray-500">Type</span>
              <p className="font-medium">{site.installationType}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          Created {formatDate(site.createdAt)}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={`/dashboard/sites/${site.publicId}/upload`}>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
