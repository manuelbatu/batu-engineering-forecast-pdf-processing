/**
 * Site Repository
 * Data access layer for site operations using Drizzle ORM
 */

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { sites, type Site, type NewSite } from '@/lib/db/schema/sites-domain'

export class SiteRepository {
  /**
   * Create a new site
   */
  async create(siteData: Omit<NewSite, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
    const [newSite] = await db
      .insert(sites)
      .values({
        ...siteData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return newSite
  }

  /**
   * Find site by public ID
   */
  async findByPublicId(publicId: string): Promise<Site | null> {
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.publicId, publicId))
      .limit(1)

    return site || null
  }

  /**
   * Find site by public ID and user ID (for access control)
   */
  async findByPublicIdAndUserId(publicId: string, userId: string): Promise<Site | null> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(
        eq(sites.publicId, publicId),
        eq(sites.userId, userId)
      ))
      .limit(1)

    return site || null
  }

  /**
   * Find all sites for a user
   */
  async findByUserId(userId: string): Promise<Site[]> {
    return await db
      .select()
      .from(sites)
      .where(eq(sites.userId, userId))
      .orderBy(sites.createdAt)
  }

  /**
   * Update site
   */
  async update(publicId: string, updates: Partial<Omit<Site, 'id' | 'publicId' | 'createdAt'>>): Promise<Site | null> {
    const [updatedSite] = await db
      .update(sites)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sites.publicId, publicId))
      .returning()

    return updatedSite || null
  }

  /**
   * Delete site
   */
  async delete(publicId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(sites)
      .where(and(
        eq(sites.publicId, publicId),
        eq(sites.userId, userId)
      ))
      .returning()

    return result.length > 0
  }

  /**
   * Check if sitekey already exists for user (enforce unique constraint)
   */
  async existsBySitekeyAndUserId(sitekey: string, userId: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(
        eq(sites.sitekey, sitekey),
        eq(sites.userId, userId)
      ))
      .limit(1)

    return !!existing
  }
}
