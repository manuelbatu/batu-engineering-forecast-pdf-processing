/**
 * Engineering Forecast Repository
 * Data access layer for engineering forecast operations using Drizzle ORM
 */

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { engineeringForecast, type EngineeringForecast, type NewEngineeringForecast } from '@/lib/db/schema/sites-domain'

export class EngineeringForecastRepository {
  /**
   * Create a new engineering forecast
   */
  async create(forecastData: Omit<NewEngineeringForecast, 'id' | 'createdAt' | 'updatedAt'>): Promise<EngineeringForecast> {
    const [newForecast] = await db
      .insert(engineeringForecast)
      .values({
        ...forecastData,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return newForecast
  }

  /**
   * Find forecast by site ID
   */
  async findBySiteId(siteId: string): Promise<EngineeringForecast | null> {
    const [forecast] = await db
      .select()
      .from(engineeringForecast)
      .where(eq(engineeringForecast.siteId, siteId))
      .limit(1)

    return forecast || null
  }

  /**
   * Update existing forecast
   */
  async updateBySiteId(siteId: string, updates: Partial<Omit<EngineeringForecast, 'id' | 'siteId' | 'createdAt'>>): Promise<EngineeringForecast | null> {
    const [updatedForecast] = await db
      .update(engineeringForecast)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(engineeringForecast.siteId, siteId))
      .returning()

    return updatedForecast || null
  }

  /**
   * Create or update forecast (upsert)
   */
  async upsertBySiteId(siteId: string, forecastData: Omit<NewEngineeringForecast, 'id' | 'siteId' | 'createdAt' | 'updatedAt'>): Promise<EngineeringForecast> {
    // Try to find existing forecast
    const existing = await this.findBySiteId(siteId);
    
    if (existing) {
      // Update existing
      const updated = await this.updateBySiteId(siteId, forecastData);
      return updated!;
    } else {
      // Create new
      return await this.create({
        siteId,
        ...forecastData,
      });
    }
  }
}
