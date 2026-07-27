// ============================================
// Prisma Client Singleton
// ============================================

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env files with override: true so local dev config takes precedence over shell env
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

if (!process.env['DATABASE_URL'] || !process.env['DATABASE_URL'].startsWith('file:')) {
  process.env['DATABASE_URL'] = 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
