/**
 * Engineering Forecast Periods Repository
 * Data access layer for period-based forecast data using Drizzle ORM
 */

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { 
  engineeringForecastPeriods, 
  type EngineeringForecastPeriod, 
  type NewEngineeringForecastPeriod 
} from '@/lib/db/schema/sites-domain'

export class EngineeringForecastPeriodsRepository {
  /**
   * Create multiple period records
   */
  async createMultiple(periods: Omit<NewEngineeringForecastPeriod, 'id' | 'createdAt'>[]): Promise<EngineeringForecastPeriod[]> {
    if (periods.length === 0) return [];
    
    const newPeriods = await db
      .insert(engineeringForecastPeriods)
      .values(periods.map(period => ({
        ...period,
        createdAt: new Date(),
      })))
      .returning()

    return newPeriods
  }

  /**
   * Find all periods for a forecast
   */
  async findByForecastId(forecastId: string): Promise<EngineeringForecastPeriod[]> {
    return await db
      .select()
      .from(engineeringForecastPeriods)
      .where(eq(engineeringForecastPeriods.forecastId, forecastId))
      .orderBy(engineeringForecastPeriods.year, engineeringForecastPeriods.month)
  }

  /**
   * Find periods for a specific year
   */
  async findByForecastIdAndYear(forecastId: string, year: string): Promise<EngineeringForecastPeriod[]> {
    return await db
      .select()
      .from(engineeringForecastPeriods)
      .where(and(
        eq(engineeringForecastPeriods.forecastId, forecastId),
        eq(engineeringForecastPeriods.year, year)
      ))
      .orderBy(engineeringForecastPeriods.month)
  }

  /**
   * Delete all periods for a forecast (used when updating)
   */
  async deleteByForecastId(forecastId: string): Promise<void> {
    await db
      .delete(engineeringForecastPeriods)
      .where(eq(engineeringForecastPeriods.forecastId, forecastId))
  }

  /**
   * Replace all periods for a forecast (delete + insert)
   */
  async replaceByForecastId(
    forecastId: string, 
    periods: Omit<NewEngineeringForecastPeriod, 'id' | 'forecastId' | 'createdAt'>[]
  ): Promise<EngineeringForecastPeriod[]> {
    // Delete existing periods
    await this.deleteByForecastId(forecastId);
    
    // Insert new periods
    return await this.createMultiple(
      periods.map(period => ({ ...period, forecastId }))
    );
  }
}
