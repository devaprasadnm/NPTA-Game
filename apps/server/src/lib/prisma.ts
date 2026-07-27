// ============================================
// Prisma Client Singleton
// ============================================

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env files if present, without overriding environment variables set by host
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env['DATABASE_URL']) {
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
