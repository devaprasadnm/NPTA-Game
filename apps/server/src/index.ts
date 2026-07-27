// ============================================
// NPTA Server — Entry Point
// ============================================

import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { corsOptions } from './config/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './socket/index.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { prisma } from './lib/prisma.js';
import { SessionService } from './services/SessionService.js';
import { logger } from './utils/logger.js';

async function main() {
  // ---- Express Setup ----
  const app = express();
  const httpServer = createServer(app);

  // Security & parsing
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting (API only)
  app.use('/api', apiLimiter);

  // ---- Routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/health', healthRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  // ---- Socket.IO ----
  setupSocketIO(httpServer);

  // ---- Database connection check ----
  try {
    await prisma.$connect();
    logger.info('Server', 'Database connected');
  } catch (error) {
    logger.error('Server', 'Database connection failed', error);
    process.exit(1);
  }

  // ---- Session Cleanup (every hour) ----
  setInterval(() => {
    void SessionService.cleanupExpiredSessions();
  }, 60 * 60 * 1000);

  // ---- Start Server ----
  httpServer.listen(config.port, () => {
    logger.info('Server', `🚀 NPTA Server running on port ${config.port}`);
    logger.info('Server', `   Environment: ${config.nodeEnv}`);
    logger.info('Server', `   CORS Origin: ${config.cors.origin}`);
  });

  // ---- Graceful Shutdown ----
  const shutdown = async (signal: string) => {
    logger.info('Server', `${signal} received, shutting down gracefully...`);
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Server', 'Fatal error during startup', error);
  process.exit(1);
});
