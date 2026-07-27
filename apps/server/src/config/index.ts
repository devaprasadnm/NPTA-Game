// ============================================
// Server Configuration
// ============================================

import dotenv from 'dotenv';
import path from 'path';

// Load .env files from both root and apps/server with override: true
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

if (!process.env['DATABASE_URL'] || !process.env['DATABASE_URL'].startsWith('file:')) {
  process.env['DATABASE_URL'] = 'file:./dev.db';
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`Environment variable ${key} must be a number`);
  return parsed;
}

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvInt('PORT', 3001),
  isProduction: getEnv('NODE_ENV', 'development') === 'production',

  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  },

  session: {
    secret: getEnv('SESSION_SECRET', 'dev-secret-change-in-production'),
    expiryHours: 72,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
} as const;
