/**
 * Reports Analytics Page
 * Shows generation data in table format across all sites
 */

import { getCurrentUser } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
import { SiteService } from '@/lib/api/v1/services/site.service';
import { EngineeringForecastService } from '@/lib/api/v1/services/engineering-forecast.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Get all sites for the user
  const siteService = new SiteService();
  const sitesResponse = await siteService.getUserSites(user.id);
  
  let sites = [];
  if (sitesResponse.status === 'success') {
    sites = sitesResponse.data || [];
  }

  // Filter sites that have PDF data
  const sitesWithData = sites.filter(site => site.pdfUploaded);

  // Get forecast data for all sites with PDFs
  const forecastService = new EngineeringForecastService();
  const siteIds = sitesWithData.map(site => site.id);
  
  let forecastsData = [];
  if (siteIds.length > 0) {
    const forecastsResponse = await forecastService.getAllForecastsWithPeriods(siteIds);
    if (forecastsResponse.status === 'success') {
      forecastsData = forecastsResponse.data || [];
    }
  }

  // Combine site info with forecast data
  const sitesWithForecasts = sitesWithData.map(site => {
    const forecast = forecastsData.find(f => f.siteId === site.id);
    return {
      ...site,
      forecast: forecast || null
    };
  });

  // Prepare monthly breakdown data
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  const formatNumber = (num: number | null) => 
    num ? num.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '0';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Production Reports
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze monthly generation data across all your solar sites
          </p>
        </div>
        
        {sitesWithForecasts.length > 0 && (
          <a 
            href="/api/v1/reports/export?format=csv"
            download
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        )}
      </div>

      {sitesWithForecasts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Production Data Available</CardTitle>
            <CardDescription>
              Upload PDF reports for your sites to view generation analytics here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Sites with uploaded PDFs will appear in this analytics dashboard with monthly production breakdowns.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Production Overview</CardTitle>
              <CardDescription>
                Annual totals and status across all sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sitekey
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Annual Total (kWh)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sitesWithForecasts.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {site.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {site.sitekey}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">
                            {site.forecast 
                              ? formatNumber(parseFloat(site.forecast.totalEnergyToGrid || '0'))
                              : 'No data'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {site.forecast ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              parseFloat(site.forecast.extractionConfidence || '0') >= 80 
                                ? 'bg-green-100 text-green-800' 
                                : parseFloat(site.forecast.extractionConfidence || '0') >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(parseFloat(site.forecast.extractionConfidence || '0'))}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(site.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>
                Detailed monthly production data by site and period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sitesWithForecasts.map((site) => (
                  <div key={site.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{site.name}</h4>
                      <span className="text-sm text-gray-500">Sitekey: {site.sitekey}</span>
                    </div>
                    
                    {site.forecast ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {monthNames.map((monthName) => {
                          const monthKey = monthName.toLowerCase();
                          const value = site.forecast.monthlyValues[monthKey] || 0;
                          return (
                            <div key={monthName} className="bg-gray-50 p-3 rounded-md text-center">
                              <div className="text-xs text-gray-600 uppercase tracking-wider font-medium">
                                {monthName.slice(0, 3)}
                              </div>
                              <div className="text-lg font-semibold text-gray-900 mt-1">
                                {formatNumber(value)}
                              </div>
                              <div className="text-xs text-gray-500">kWh</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No monthly data available for this site
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
              <CardDescription>
                Aggregate statistics across all sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {sitesWithForecasts.length}
                  </div>
                  <div className="text-sm text-blue-800">Active Sites</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(
                      sitesWithForecasts.reduce((total, site) => 
                        total + (site.forecast ? parseFloat(site.forecast.totalEnergyToGrid || '0') : 0), 0
                      )
                    )}
                  </div>
                  <div className="text-sm text-green-800">Total Annual kWh</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(
                      sitesWithForecasts.reduce((total, site, _, arr) => 
                        total + (site.forecast ? parseFloat(site.forecast.extractionConfidence || '0') : 0), 0
                      ) / Math.max(sitesWithForecasts.length, 1)
                    )}%
                  </div>
                  <div className="text-sm text-purple-800">Avg. Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
