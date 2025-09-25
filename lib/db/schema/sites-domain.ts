/**
 * Sites Domain Tables
 * Database schema for sites and engineering forecast tables
 */

import { pgTable, uuid, varchar, boolean, timestamp, decimal, index, text, unique } from 'drizzle-orm/pg-core'
import { generatePublicId } from '@/lib/utils'
import { PUBLIC_ID_PREFIXES } from './constants'

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  sitekey: varchar('sitekey', { length: 50 }).notNull(),
  publicId: text('public_id')
    .unique()
    .notNull()
    .$defaultFn(() => generatePublicId(PUBLIC_ID_PREFIXES.SITE)),
  pdfUploaded: boolean('pdf_uploaded').default(false),
  pdfFileName: varchar('pdf_file_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_sites_user_id').on(table.userId),
  // Unique constraint for user + sitekey combination
  userSitekeyUnique: index('sites_user_sitekey_unique').on(table.userId, table.sitekey),
}))

export const engineeringForecast = pgTable('engineering_forecast', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().unique(),
  publicId: text('public_id')
    .unique()
    .notNull()
    .$defaultFn(() => generatePublicId(PUBLIC_ID_PREFIXES.ENGINEERING_FORECAST)),
  
  // Valor total extraído de "Energy to Grid"
  totalEnergyToGrid: decimal('total_energy_to_grid', { precision: 15, scale: 2 }),
  
  // Metadatos de procesamiento
  extractionConfidence: decimal('extraction_confidence', { precision: 5, scale: 2 }), // 0-100%
  processingStatus: varchar('processing_status', { length: 50 }).default('pending'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_engineering_forecast_site_id').on(table.siteId),
}))

// New table for period-based data (much more flexible)
export const engineeringForecastPeriods = pgTable('engineering_forecast_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id').notNull().references(() => engineeringForecast.id, { onDelete: 'cascade' }),
  year: varchar('year', { length: 4 }).notNull(), // "2024", "2025", etc.
  month: varchar('month', { length: 2 }).notNull(), // "01", "02", ..., "12"
  kwhValue: decimal('kwh_value', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  forecastIdIdx: index('idx_forecast_periods_forecast_id').on(table.forecastId),
  periodIdx: index('idx_forecast_periods_year_month').on(table.year, table.month),
  // Unique constraint: one record per forecast/year/month
  uniquePeriod: unique('forecast_periods_unique').on(table.forecastId, table.year, table.month),
}))

// Type inference for TypeScript
export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
export type EngineeringForecast = typeof engineeringForecast.$inferSelect
export type NewEngineeringForecast = typeof engineeringForecast.$inferInsert
export type EngineeringForecastPeriod = typeof engineeringForecastPeriods.$inferSelect
export type NewEngineeringForecastPeriod = typeof engineeringForecastPeriods.$inferInsert
