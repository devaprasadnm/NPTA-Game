// ============================================
// Socket Middleware — Authentication
// ============================================

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@npta/shared';
import { SessionService } from '../../services/SessionService.js';
import { logger } from '../../utils/logger.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Socket.IO middleware that authenticates connections via session token.
 * Token is passed as `auth.token` in the handshake.
 */
export async function socketAuthMiddleware(
  socket: GameSocket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth['token'] as string | undefined;

    if (!token) {
      next(new Error('INVALID_SESSION'));
      return;
    }

    const result = await SessionService.validateSession(token);

    if (!result.valid || !result.player) {
      next(new Error('SESSION_EXPIRED'));
      return;
    }

    // Attach player data to socket
    socket.data.playerId = result.player.id;
    socket.data.playerName = result.player.displayName;
    socket.data.sessionToken = token;
    socket.data.roomCode = null;

    logger.info('SocketAuth', `Authenticated: ${result.player.displayName} (${result.player.id})`);
    next();
  } catch (error) {
    logger.error('SocketAuth', 'Authentication failed', error);
    next(new Error('INTERNAL_ERROR'));
  }
}
