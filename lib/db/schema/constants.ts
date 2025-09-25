/**
 * Database Constants
 * Public ID prefixes and database constants following Batu patterns
 */

export const PUBLIC_ID_PREFIXES = {
  SITE: 'sit',
  ENGINEERING_FORECAST: 'efp',
} as const;

export type PublicIdPrefix = (typeof PUBLIC_ID_PREFIXES)[keyof typeof PUBLIC_ID_PREFIXES];
