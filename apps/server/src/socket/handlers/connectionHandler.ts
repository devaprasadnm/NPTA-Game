// ============================================
// Socket Handler — Connection Events
// ============================================

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@npta/shared';
import { roomManager } from '../../engine/RoomManager.js';
import { logger } from '../../utils/logger.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerConnectionHandlers(socket: GameSocket): void {
  const { playerId, playerName } = socket.data;

  // Check if player was in a room (reconnection)
  const existingRoomCode = roomManager.getRoomCode(playerId);
  if (existingRoomCode) {
    const room = roomManager.getRoom(existingRoomCode);
    if (room) {
      // Rejoin Socket.IO room
      void socket.join(existingRoomCode);
      socket.data.roomCode = existingRoomCode;
      void roomManager.playerReconnected(playerId, socket.id);

      // Notify other players
      socket.to(existingRoomCode).emit('room:player_reconnected', { playerId });

      logger.info('ConnectionHandler', `${playerName} reconnected to room ${existingRoomCode}`);

      // Send current state to reconnected player
      const roomInfo = {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        status: room.status,
        isPrivate: true,
        settings: room.settings,
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          isHost: p.isHost,
          isOnline: p.isOnline,
          isReady: p.isReady,
        })),
        createdAt: new Date().toISOString(),
      };

      socket.emit('session:restored', { room: roomInfo, game: null });
    }
  } else {
    roomManager.registerSocket(socket.id, playerId);
  }

  // ---- Disconnect ----
  socket.on('disconnect', async (reason) => {
    logger.info('ConnectionHandler', `${playerName} disconnected: ${reason}`);

    const roomCode = await roomManager.playerDisconnected(playerId, socket.id);
    if (roomCode) {
      socket.to(roomCode).emit('room:player_left', { playerId });

      // Check if all players are offline
      const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
      if (onlinePlayers.length === 0) {
        logger.info('ConnectionHandler', `All players offline in room ${roomCode}`);
      }
    }
  });
}
