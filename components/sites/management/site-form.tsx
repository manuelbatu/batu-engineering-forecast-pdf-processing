'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { siteSchema } from '@/lib/validations/schemas';
import type { z } from 'zod';

type SiteFormData = z.infer<typeof siteSchema>;

interface SiteFormProps {
  initialData?: Partial<SiteFormData>;
  siteId?: string;
  mode: 'create' | 'edit';
}

export function SiteForm({ initialData, siteId, mode }: SiteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: initialData || {
      name: '',
      sitekey: '',
    },
  });

  const onSubmit = async (data: SiteFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = mode === 'create' 
        ? '/api/v1/sites' 
        : `/api/v1/sites/${siteId}`;
        
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${mode} site`);
      }

      if (result.status === 'success') {
        router.push('/dashboard/sites');
        router.refresh();
      } else {
        throw new Error(result.message || `Failed to ${mode} site`);
      }
    } catch (err) {
      console.error(`Error ${mode}ing site:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${mode} site`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Site' : 'Edit Site'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Main Solar Array"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitekey">Sitekey *</Label>
            <Input
              id="sitekey"
              {...register('sitekey')}
              placeholder="/123/456/789"
              className={errors.sitekey ? 'border-red-500' : ''}
            />
            {errors.sitekey && (
              <p className="text-sm text-red-600">{errors.sitekey.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Format: /{`{int}`}/{`{int}`}/{`{int}`} (e.g., /123/456/789)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Site' : 'Update Site')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
