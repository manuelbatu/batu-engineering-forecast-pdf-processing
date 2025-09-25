/**
 * Site Service
 * Business logic for site management operations
 */

import { BaseApiService, type JSendResponse } from './base-api.service';
import { SiteRepository } from '../repositories/site.repository';
import type { Site } from '@/lib/db/schema/sites-domain';

export class SiteService extends BaseApiService {
  private siteRepository = new SiteRepository();

  /**
   * Update site PDF upload status
   */
  async updatePdfStatus(publicId: string, userId: string, pdfUploaded: boolean, pdfFileName?: string): Promise<JSendResponse<Site>> {
    try {
      // Verify user owns the site
      const site = await this.siteRepository.findByPublicIdAndUserId(publicId, userId);
      if (!site) {
        return this.failResponse({ message: 'Site not found or access denied' });
      }

      // Update the site
      const updatedSite = await this.siteRepository.update(publicId, {
        pdfUploaded,
        pdfFileName,
      });

      if (!updatedSite) {
        return this.errorResponse('Failed to update site', 'SITE_UPDATE_ERROR');
      }

      return this.successResponse(updatedSite);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to update site',
        'SITE_UPDATE_ERROR'
      );
    }
  }
  /**
   * Get site by public ID with user access control
   */
  async getByPublicId(publicId: string, userId: string): Promise<JSendResponse<Site>> {
    try {
      const site = await this.siteRepository.findByPublicIdAndUserId(publicId, userId);
      
      if (!site) {
        return this.failResponse({ message: 'Site not found or access denied' });
      }

      return this.successResponse(site);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch site',
        'SITE_FETCH_ERROR'
      );
    }
  }

  /**
   * List all sites for a user
   */
  async listByUserId(userId: string): Promise<JSendResponse<Site[]>> {
    try {
      const sites = await this.siteRepository.findByUserId(userId);
      return this.successResponse(sites);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to list sites',
        'SITE_LIST_ERROR'
      );
    }
  }

  /**
   * Get user sites (alias for listByUserId)
   */
  async getUserSites(userId: string): Promise<JSendResponse<Site[]>> {
    return this.listByUserId(userId);
  }

  /**
   * Create a new site
   */
  async createSite(siteData: { name: string; sitekey: string }, userId: string): Promise<JSendResponse<Site>> {
    try {
      // Check if sitekey already exists for this user
      const exists = await this.siteRepository.existsBySitekeyAndUserId(siteData.sitekey, userId);
      if (exists) {
        return this.failResponse({ 
          message: 'Site with this sitekey already exists for this user' 
        });
      }

      // Create the site in the database
      const newSite = await this.siteRepository.create({
        userId,
        name: siteData.name,
        sitekey: siteData.sitekey,
        pdfUploaded: false,
      });

      return this.successResponse(newSite, 'Site created successfully');
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Failed to create site',
        'SITE_CREATE_ERROR'
      );
    }
  }
}
