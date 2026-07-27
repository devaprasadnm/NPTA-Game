// ============================================
// Room Manager — In-memory room state + DB sync
// ============================================

import type { RoomSettings, PlayerInfo, RoomInfo } from '@npta/shared';
import { DEFAULT_ROOM_SETTINGS, RoomStatus } from '@npta/shared';
import { prisma } from '../lib/prisma.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';
import { logger } from '../utils/logger.js';

/** In-memory representation of a room (for fast Socket.IO lookups) */
interface RoomState {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Map<string, PlayerState>;
  gameId: string | null;
}

interface PlayerState {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
  isOnline: boolean;
  isReady: boolean;
  socketId: string | null;
}

export class RoomManager {
  /** roomCode → RoomState */
  private rooms: Map<string, RoomState> = new Map();
  /** playerId → roomCode (quick lookup) */
  private playerRoomMap: Map<string, string> = new Map();
  /** socketId → playerId */
  private socketPlayerMap: Map<string, string> = new Map();

  // ---- Room Operations ----

  async createRoom(playerId: string, playerName: string, settings?: Partial<RoomSettings>): Promise<RoomInfo> {
    const code = generateRoomCode();
    const mergedSettings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS, ...settings };

    // Persist to DB
    const room = await prisma.room.create({
      data: {
        code,
        hostId: playerId,
        status: 'WAITING',
        settings: JSON.stringify(mergedSettings),
        roomPlayers: {
          create: {
            playerId,
            isHost: true,
            isOnline: true,
          },
        },
      },
    });

    // In-memory state
    const playerState: PlayerState = {
      id: playerId,
      displayName: playerName,
      avatarUrl: null,
      isHost: true,
      isOnline: true,
      isReady: false,
      socketId: null,
    };

    const roomState: RoomState = {
      id: room.id,
      code,
      hostId: playerId,
      status: RoomStatus.WAITING,
      settings: mergedSettings,
      players: new Map([[playerId, playerState]]),
      gameId: null,
    };

    this.rooms.set(code, roomState);
    this.playerRoomMap.set(playerId, code);

    logger.info('RoomManager', `Room ${code} created by ${playerName}`);
    return this.toRoomInfo(roomState);
  }

  async joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string,
  ): Promise<RoomInfo> {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error('ROOM_FULL');
    }

    if (room.status === RoomStatus.IN_GAME) {
      // Check if this player was already in the room (rejoin)
      const existing = room.players.get(playerId);
      if (!existing) throw new Error('ROOM_IN_GAME');
      // Allow rejoin
      existing.isOnline = true;
      await prisma.roomPlayer.updateMany({
        where: { roomId: room.id, playerId },
        data: { isOnline: true },
      });
      this.playerRoomMap.set(playerId, roomCode);
      return this.toRoomInfo(room);
    }

    // Check if already in room
    if (room.players.has(playerId)) {
      const player = room.players.get(playerId)!;
      player.isOnline = true;
      this.playerRoomMap.set(playerId, roomCode);
      return this.toRoomInfo(room);
    }

    // Add player to DB
    await prisma.roomPlayer.create({
      data: {
        roomId: room.id,
        playerId,
        isHost: false,
        isOnline: true,
      },
    });

    // Add to in-memory state
    const playerState: PlayerState = {
      id: playerId,
      displayName: playerName,
      avatarUrl: null,
      isHost: false,
      isOnline: true,
      isReady: false,
      socketId: null,
    };

    room.players.set(playerId, playerState);
    this.playerRoomMap.set(playerId, roomCode);

    // Update room status to LOBBY if enough players
    if (room.status === RoomStatus.WAITING && room.players.size >= room.settings.minPlayers) {
      room.status = RoomStatus.LOBBY;
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'LOBBY' },
      });
    }

    logger.info('RoomManager', `${playerName} joined room ${roomCode}`);
    return this.toRoomInfo(room);
  }

  async leaveRoom(playerId: string): Promise<{ roomCode: string; room: RoomState | null; newHostId: string | null }> {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) throw new Error('NOT_IN_ROOM');

    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const player = room.players.get(playerId);
    if (!player) throw new Error('NOT_IN_ROOM');

    // Remove player
    room.players.delete(playerId);
    this.playerRoomMap.delete(playerId);

    // Remove from DB
    await prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, playerId },
    });

    let newHostId: string | null = null;

    // If room is empty, delete it
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'FINISHED' },
      });
      logger.info('RoomManager', `Room ${roomCode} is now empty, marked finished`);
      return { roomCode, room: null, newHostId: null };
    }

    // If the leaving player was host, assign new host
    if (player.isHost) {
      const nextPlayer = room.players.values().next().value;
      if (nextPlayer) {
        nextPlayer.isHost = true;
        room.hostId = nextPlayer.id;
        newHostId = nextPlayer.id;

        await prisma.roomPlayer.updateMany({
          where: { roomId: room.id, playerId: nextPlayer.id },
          data: { isHost: true },
        });
        await prisma.room.update({
          where: { id: room.id },
          data: { hostId: nextPlayer.id },
        });

        logger.info('RoomManager', `Host changed to ${nextPlayer.displayName} in room ${roomCode}`);
      }
    }

    logger.info('RoomManager', `Player left room ${roomCode}`);
    return { roomCode, room, newHostId };
  }

  async playerDisconnected(playerId: string, socketId: string): Promise<string | null> {
    this.socketPlayerMap.delete(socketId);

    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (player) {
      player.isOnline = false;
      player.socketId = null;

      await prisma.roomPlayer.updateMany({
        where: { roomId: room.id, playerId },
        data: { isOnline: false },
      });

      logger.info('RoomManager', `Player ${player.displayName} disconnected from room ${roomCode}`);
    }

    return roomCode;
  }

  async playerReconnected(playerId: string, socketId: string): Promise<string | null> {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (player) {
      player.isOnline = true;
      player.socketId = socketId;
      this.socketPlayerMap.set(socketId, playerId);

      await prisma.roomPlayer.updateMany({
        where: { roomId: room.id, playerId },
        data: { isOnline: true },
      });

      logger.info('RoomManager', `Player ${player.displayName} reconnected to room ${roomCode}`);
    }

    return roomCode;
  }

  // ---- Settings ----

  async updateSettings(roomCode: string, playerId: string, settings: Partial<RoomSettings>): Promise<RoomSettings> {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostId !== playerId) throw new Error('NOT_HOST');

    room.settings = { ...room.settings, ...settings };

    await prisma.room.update({
      where: { id: room.id },
      data: { settings: JSON.stringify(room.settings) },
    });

    logger.info('RoomManager', `Settings updated for room ${roomCode}`, room.settings);
    return room.settings;
  }

  // ---- Ready Status ----

  setPlayerReady(playerId: string, isReady: boolean): { roomCode: string; allReady: boolean } {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) throw new Error('NOT_IN_ROOM');

    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const player = room.players.get(playerId);
    if (player) {
      player.isReady = isReady;
    }

    const allReady = Array.from(room.players.values())
      .filter((p) => p.isOnline)
      .every((p) => p.isReady);

    return { roomCode, allReady };
  }

  // ---- Lookups ----

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  getRoomByPlayerId(playerId: string): RoomState | undefined {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode);
  }

  getRoomCode(playerId: string): string | undefined {
    return this.playerRoomMap.get(playerId);
  }

  getPlayerSocketId(playerId: string): string | null {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const player = room.players.get(playerId);
    return player?.socketId ?? null;
  }

  registerSocket(socketId: string, playerId: string): void {
    this.socketPlayerMap.set(socketId, playerId);
    const roomCode = this.playerRoomMap.get(playerId);
    if (roomCode) {
      const room = this.rooms.get(roomCode);
      const player = room?.players.get(playerId);
      if (player) {
        player.socketId = socketId;
      }
    }
  }

  getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketPlayerMap.get(socketId);
  }

  getOnlinePlayers(roomCode: string): PlayerState[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values()).filter((p) => p.isOnline);
  }

  setRoomStatus(roomCode: string, status: RoomStatus): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.status = status;
    }
  }

  setGameId(roomCode: string, gameId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.gameId = gameId;
    }
  }

  // ---- Helpers ----

  private toRoomInfo(room: RoomState): RoomInfo {
    const players: PlayerInfo[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      isHost: p.isHost,
      isOnline: p.isOnline,
      isReady: p.isReady,
    }));

    return {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      isPrivate: true,
      settings: room.settings,
      players,
      createdAt: new Date().toISOString(),
    };
  }

  /** Restore room from DB (for server restart recovery) */
  async restoreRoom(roomCode: string): Promise<RoomInfo | null> {
    const dbRoom = await prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        roomPlayers: {
          include: { player: true },
        },
      },
    });

    if (!dbRoom || dbRoom.status === 'FINISHED') return null;

    const players = new Map<string, PlayerState>();
    for (const rp of dbRoom.roomPlayers) {
      players.set(rp.playerId, {
        id: rp.playerId,
        displayName: rp.player.displayName,
        avatarUrl: rp.player.avatarUrl,
        isHost: rp.isHost,
        isOnline: false, // Will be set true on reconnect
        isReady: false,
        socketId: null,
      });
    }

    const roomState: RoomState = {
      id: dbRoom.id,
      code: dbRoom.code,
      hostId: dbRoom.hostId,
      status: dbRoom.status as RoomStatus,
      settings: typeof dbRoom.settings === 'string' ? JSON.parse(dbRoom.settings) : dbRoom.settings,
      players,
      gameId: null,
    };

    this.rooms.set(roomCode, roomState);
    for (const playerId of players.keys()) {
      this.playerRoomMap.set(playerId, roomCode);
    }

    logger.info('RoomManager', `Room ${roomCode} restored from database`);
    return this.toRoomInfo(roomState);
  }
}

// Singleton
export const roomManager = new RoomManager();
