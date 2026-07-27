// ============================================
// Socket.IO Setup — Main socket orchestration
// ============================================

import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@npta/shared';
import { config } from '../config/index.js';
import { socketAuthMiddleware } from './middleware/authMiddleware.js';
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerGameHandlers } from './handlers/gameHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { registerConnectionHandlers } from './handlers/connectionHandler.js';
import { GameEngine } from '../engine/GameEngine.js';
import { logger } from '../utils/logger.js';

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: config.cors.origin.split(',').map((o) => o.trim()),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
  });

  // Auth middleware
  io.use(socketAuthMiddleware);

  // Game engine (needs io reference)
  const gameEngine = new GameEngine(io);

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('Socket', `Connected: ${socket.data.playerName} (${socket.id})`);

    // Register all event handlers
    registerConnectionHandlers(socket);
    registerRoomHandlers(socket);
    registerGameHandlers(socket, gameEngine);
    registerChatHandlers(socket);
  });

  logger.info('Socket', 'Socket.IO server initialized');
  return io;
}
