/**
 * Environment Configuration
 * Centralized environment variable management following Batu patterns
 */

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isVercel = !!process.env.VERCEL;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Make sure you have it set in ${
          isProd ? 'Vercel dashboard' : '.env.local'
        }`
    );
  }
  return value;
}

export const env = {
  // Environment detection
  isDev,
  isProd,
  isTest,
  isVercel,

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // External APIs
  PDFCO_API_KEY: process.env.PDFCO_API_KEY || 'manuel@batuenergy.com_GEYzKhT71wo2JSuGiaLiJGMoaszOzR70C6nno4Bj04sQPOEr3b7I6Gdq4bVX91Az',

  // Security
  VAULT_SECRET_KEY: process.env.VAULT_SECRET_KEY || 'dev-secret-key',
} as const;
