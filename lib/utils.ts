import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ulid } from 'ulid'
import type { PublicIdPrefix } from '@/lib/db/schema/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a public ID with prefix (following Batu patterns)
 * Format: {prefix}_{26_char_ulid}
 * Example: sit_01HKQJQM7X8N9P2R3S4T5V6W7Y
 */
export function generatePublicId(prefix: PublicIdPrefix): string {
  return `${prefix}_${ulid()}`
}

/**
 * Validate public ID format
 */
export function validatePublicId(publicId: string, prefix: string): boolean {
  const regex = new RegExp(`^${prefix}_[A-Z0-9]{26}$`)
  return regex.test(publicId)
}
