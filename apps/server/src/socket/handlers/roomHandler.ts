// ============================================
// Socket Handler — Room Events
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

export function registerRoomHandlers(socket: GameSocket): void {
  const { playerId, playerName } = socket.data;

  // ---- Create Room ----
  socket.on('room:create', async (data, callback) => {
    try {
      const room = await roomManager.createRoom(playerId, playerName, data.settings);

      // Join Socket.IO room
      await socket.join(room.code);
      socket.data.roomCode = room.code;
      roomManager.registerSocket(socket.id, playerId);

      callback({ success: true, data: room });
      logger.info('RoomHandler', `Room ${room.code} created by ${playerName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room';
      callback({ success: false, error: message });
      logger.error('RoomHandler', `Create room failed: ${message}`);
    }
  });

  // ---- Join Room ----
  socket.on('room:join', async (data, callback) => {
    try {
      const roomCode = data.roomCode.toUpperCase().trim();
      const room = await roomManager.joinRoom(roomCode, playerId, playerName);

      // Join Socket.IO room
      await socket.join(roomCode);
      socket.data.roomCode = roomCode;
      roomManager.registerSocket(socket.id, playerId);

      // Notify existing players
      socket.to(roomCode).emit('room:player_joined', {
        id: playerId,
        displayName: playerName,
        avatarUrl: null,
        isHost: false,
        isOnline: true,
        isReady: false,
      });

      callback({ success: true, data: room });
      logger.info('RoomHandler', `${playerName} joined room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room';
      callback({ success: false, error: message });
      logger.error('RoomHandler', `Join room failed: ${message}`);
    }
  });

  // ---- Leave Room ----
  socket.on('room:leave', async () => {
    try {
      const { roomCode, newHostId } = await roomManager.leaveRoom(playerId);

      // Leave Socket.IO room
      await socket.leave(roomCode);
      socket.data.roomCode = null;

      // Notify remaining players
      socket.to(roomCode).emit('room:player_left', { playerId });

      if (newHostId) {
        const room = roomManager.getRoom(roomCode);
        const newHost = room?.players.get(newHostId);
        socket.to(roomCode).emit('room:host_changed', {
          newHostId,
          newHostName: newHost?.displayName ?? 'Unknown',
        });
      }

      logger.info('RoomHandler', `${playerName} left room ${roomCode}`);
    } catch (error) {
      logger.error('RoomHandler', `Leave room failed`, error);
    }
  });

  // ---- Update Settings ----
  socket.on('room:settings', async (data) => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;

      const settings = await roomManager.updateSettings(roomCode, playerId, data.settings);
      socket.to(roomCode).emit('room:settings_updated', settings);

      logger.info('RoomHandler', `Settings updated in room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      socket.emit('error', { code: 'INVALID_SETTINGS', message });
    }
  });

  // ---- Player Ready ----
  socket.on('player:ready', (data) => {
    try {
      const { roomCode, allReady } = roomManager.setPlayerReady(playerId, data.isReady);

      socket.to(roomCode).emit('room:player_ready', {
        playerId,
        isReady: data.isReady,
      });

      logger.info('RoomHandler', `${playerName} is ${data.isReady ? 'ready' : 'not ready'} in room ${roomCode} (all ready: ${allReady})`);
    } catch (error) {
      logger.error('RoomHandler', `Ready toggle failed`, error);
    }
  });
}
