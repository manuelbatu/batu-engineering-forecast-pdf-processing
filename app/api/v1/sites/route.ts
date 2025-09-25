/**
 * Sites API Routes
 * Handles CRUD operations for sites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { SiteService } from '@/lib/api/v1/services/site.service';
import { BaseApiService } from '@/lib/api/v1/services/base-api.service';
import { siteSchema } from '@/lib/validations/schemas';

const baseApi = new BaseApiService();

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        baseApi.failResponse({ message: 'Authentication required' }),
        { status: 401 }
      );
    }

    const siteService = new SiteService();
    const sitesResponse = await siteService.getUserSites(user.id);

    if (sitesResponse.status === 'success') {
      return NextResponse.json(sitesResponse, { status: 200 });
    } else {
      return NextResponse.json(sitesResponse, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      baseApi.errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        baseApi.failResponse({ message: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = siteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        baseApi.failResponse({ 
          message: 'Validation failed', 
          errors: validation.error.errors 
        }),
        { status: 400 }
      );
    }

    const siteService = new SiteService();
    const siteResponse = await siteService.createSite(validation.data, user.id);

    if (siteResponse.status === 'success') {
      return NextResponse.json(siteResponse, { status: 201 });
    } else {
      return NextResponse.json(siteResponse, { status: 400 });
    }

  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      baseApi.errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
