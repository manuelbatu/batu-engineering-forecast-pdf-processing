/**
 * Validation Schemas
 * Zod schemas for data validation following PRD specifications
 */

import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255, "El nombre es muy largo"),
  sitekey: z.string().regex(
    /^\/\d+\/\d+\/\d+$/,
    "El sitekey debe tener formato /{int}/{int}/{int}"
  ),
})

export const updateSiteSchema = siteSchema.partial()

export const pdfUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.type === 'application/pdf', "Debe ser un archivo PDF")
    .refine(file => file.size <= 10 * 1024 * 1024, "El archivo debe ser menor a 10MB"),
})

export const engineeringForecastSchema = z.object({
  totalEnergyToGrid: z.number().positive().optional(),
  extractionConfidence: z.number().min(0).max(100).optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
})

export const engineeringForecastPeriodSchema = z.object({
  year: z.string().regex(/^\d{4}$/, "Year must be 4 digits"),
  month: z.string().regex(/^(0[1-9]|1[0-2])$/, "Month must be 01-12"),
  kwhValue: z.number().nonnegative("kWh value must be non-negative"),
})

// Type inference
export type SiteInput = z.infer<typeof siteSchema>
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>
export type PdfUploadInput = z.infer<typeof pdfUploadSchema>
export type EngineeringForecastInput = z.infer<typeof engineeringForecastSchema>
export type EngineeringForecastPeriodInput = z.infer<typeof engineeringForecastPeriodSchema>
