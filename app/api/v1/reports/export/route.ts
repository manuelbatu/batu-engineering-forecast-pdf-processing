/**
 * Export Reports API Route
 * Exports analytics data in CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { SiteService } from '@/lib/api/v1/services/site.service';
import { EngineeringForecastService } from '@/lib/api/v1/services/engineering-forecast.service';
import { BaseApiService } from '@/lib/api/v1/services/base-api.service';

const baseApi = new BaseApiService();

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        baseApi.errorResponse('Unauthorized', 'AUTH_ERROR'),
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return NextResponse.json(
        baseApi.failResponse({ message: 'Only CSV format is supported' }),
        { status: 400 }
      );
    }

    // Get all sites and forecasts
    const siteService = new SiteService();
    const forecastService = new EngineeringForecastService();
    
    const sitesResponse = await siteService.getUserSites(user.id);
    if (sitesResponse.status !== 'success') {
      return NextResponse.json(
        baseApi.errorResponse('Failed to fetch sites', 'SITES_FETCH_ERROR'),
        { status: 500 }
      );
    }

    const sitesWithData = sitesResponse.data.filter(site => site.pdfUploaded);
    const siteIds = sitesWithData.map(site => site.id);
    
    let forecastsData = [];
    if (siteIds.length > 0) {
      const forecastsResponse = await forecastService.getAllForecastsWithPeriods(siteIds);
      if (forecastsResponse.status === 'success') {
        forecastsData = forecastsResponse.data || [];
      }
    }

    // Combine data
    const sitesWithForecasts = sitesWithData.map(site => {
      const forecast = forecastsData.find(f => f.siteId === site.id);
      return { ...site, forecast: forecast || null };
    });

    // Generate CSV content
    const csvHeaders = [
      'Site Name',
      'Sitekey', 
      'Annual Total (kWh)',
      'Extraction Confidence (%)',
      'January (kWh)',
      'February (kWh)',
      'March (kWh)',
      'April (kWh)',
      'May (kWh)',
      'June (kWh)',
      'July (kWh)',
      'August (kWh)',
      'September (kWh)',
      'October (kWh)',
      'November (kWh)',
      'December (kWh)',
      'Last Updated'
    ].join(',');

    const csvRows = sitesWithForecasts.map(site => {
      const forecast = site.forecast;
      const monthlyValues = forecast?.monthlyValues || {};
      
      return [
        `"${site.name}"`,
        `"${site.sitekey}"`,
        forecast?.totalEnergyToGrid || '0',
        forecast?.extractionConfidence || '0',
        monthlyValues.january || '0',
        monthlyValues.february || '0',
        monthlyValues.march || '0',
        monthlyValues.april || '0',
        monthlyValues.may || '0',
        monthlyValues.june || '0',
        monthlyValues.july || '0',
        monthlyValues.august || '0',
        monthlyValues.september || '0',
        monthlyValues.october || '0',
        monthlyValues.november || '0',
        monthlyValues.december || '0',
        `"${new Date(site.updatedAt).toLocaleDateString()}"`
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Return CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `solar-production-report-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      baseApi.errorResponse(
        'Export failed',
        'EXPORT_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    );
  }
}
