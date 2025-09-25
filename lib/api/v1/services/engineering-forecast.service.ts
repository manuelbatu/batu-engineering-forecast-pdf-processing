/**
 * Engineering Forecast Service
 * Business logic for engineering forecast operations
 */

import { BaseApiService, type JSendResponse } from './base-api.service';
import { EngineeringForecastRepository } from '../repositories/engineering-forecast.repository';
import { EngineeringForecastPeriodsRepository } from '../repositories/engineering-forecast-periods.repository';
import type { EngineeringForecast } from '@/lib/db/schema/sites-domain';

interface ExtractedData {
  totalEnergyToGrid: number | null;
  monthlyValues: Record<string, number>;
  extractionConfidence: number;
  hasValidMonthlyData: boolean;
  errors: string[];
}

export class EngineeringForecastService extends BaseApiService {
  private forecastRepository = new EngineeringForecastRepository();
  private periodsRepository = new EngineeringForecastPeriodsRepository();

  /**
   * Create engineering forecast from extracted PDF data
   */
  async createFromExtractedData(
    siteId: string, 
    extractedData: ExtractedData
  ): Promise<JSendResponse<EngineeringForecast>> {
    try {
      // Create or update the main forecast record
      const forecast = await this.forecastRepository.upsertBySiteId(siteId, {
        totalEnergyToGrid: extractedData.totalEnergyToGrid?.toString() || null,
        extractionConfidence: extractedData.extractionConfidence.toString(),
        processingStatus: 'completed',
      });

      // Determine the year (assume current year for now, could be extracted from PDF later)
      const currentYear = new Date().getFullYear().toString();

      // Create period records for monthly data
      const periodRecords = Object.entries(extractedData.monthlyValues)
        .filter(([_, value]) => value > 0) // Only include months with data
        .map(([monthName, kwhValue]) => {
          // Convert month name to number (01-12)
          const monthNumber = this.getMonthNumber(monthName);
          return {
            year: currentYear,
            month: monthNumber,
            kwhValue: kwhValue.toString(),
          };
        });

      // Replace existing periods with new data
      if (periodRecords.length > 0) {
        await this.periodsRepository.replaceByForecastId(forecast.id, periodRecords);
      }

      // Return forecast with display-friendly monthly values for frontend
      const forecastWithMonthlyValues = {
        ...forecast,
        monthlyValues: extractedData.monthlyValues, // Keep original format for display
      };

      return this.successResponse(forecastWithMonthlyValues, 'Engineering forecast created successfully');
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to create engineering forecast',
        'FORECAST_CREATE_ERROR'
      );
    }
  }

  /**
   * Get forecast with periods for a site
   */
  async getForecastWithPeriods(siteId: string): Promise<JSendResponse<any>> {
    try {
      // Get the main forecast record
      const forecast = await this.forecastRepository.findBySiteId(siteId);
      if (!forecast) {
        return this.failResponse({ message: 'No forecast found for this site' });
      }

      // Get all periods for this forecast
      const periods = await this.periodsRepository.findByForecastId(forecast.id);

      // Convert periods to monthly values for easier consumption
      const monthlyValues: Record<string, number> = {};
      periods.forEach(period => {
        const monthName = this.getMonthName(period.month);
        monthlyValues[monthName] = parseFloat(period.kwhValue);
      });

      const result = {
        ...forecast,
        monthlyValues,
        periods, // Include raw periods for detailed analysis
      };

      return this.successResponse(result);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch forecast',
        'FORECAST_FETCH_ERROR'
      );
    }
  }

  /**
   * Get all forecasts with periods for analytics
   */
  async getAllForecastsWithPeriods(siteIds: string[]): Promise<JSendResponse<any[]>> {
    try {
      const forecasts = [];
      
      for (const siteId of siteIds) {
        const forecastResponse = await this.getForecastWithPeriods(siteId);
        if (forecastResponse.status === 'success') {
          forecasts.push({
            siteId,
            ...forecastResponse.data
          });
        }
      }

      return this.successResponse(forecasts);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch forecasts',
        'FORECASTS_FETCH_ERROR'
      );
    }
  }

  /**
   * Convert month number to name
   */
  private getMonthName(monthNumber: string): string {
    const months = {
      '01': 'january', '02': 'february', '03': 'march', '04': 'april',
      '05': 'may', '06': 'june', '07': 'july', '08': 'august',
      '09': 'september', '10': 'october', '11': 'november', '12': 'december'
    };
    return months[monthNumber as keyof typeof months] || 'january';
  }

  /**
   * Convert month name to zero-padded number
   */
  private getMonthNumber(monthName: string): string {
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };
    return months[monthName.toLowerCase() as keyof typeof months] || '01';
  }
}
