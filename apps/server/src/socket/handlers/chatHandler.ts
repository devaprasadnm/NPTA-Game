// ============================================
// Socket Handler — Chat Events
// ============================================

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@npta/shared';
import { MAX_CHAT_MESSAGE_LENGTH } from '@npta/shared';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerChatHandlers(socket: GameSocket): void {
  const { playerId, playerName } = socket.data;

  socket.on('chat:message', (data) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    // Sanitize message
    const message = data.message.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
    if (message.length === 0) return;

    socket.to(roomCode).emit('chat:message', {
      id: uuidv4(),
      playerId,
      playerName,
      message,
      timestamp: new Date().toISOString(),
    });

    logger.debug('ChatHandler', `${playerName} sent message in room ${roomCode}`);
  });

  socket.on('chat:emoji', (data) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    socket.to(roomCode).emit('chat:emoji', {
      playerId,
      playerName,
      emoji: data.emoji.slice(0, 4), // Limit emoji length
      timestamp: new Date().toISOString(),
    });
  });
}
