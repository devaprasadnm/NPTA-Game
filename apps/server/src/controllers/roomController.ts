// ============================================
// Room Controller — REST endpoints for rooms
// ============================================

import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { roomManager } from '../engine/RoomManager.js';
import { logger } from '../utils/logger.js';

export async function getRoomByCode(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params as { code: string };
    const uppercaseCode = code.toUpperCase();

    const roomState = roomManager.getRoom(uppercaseCode);
    if (roomState) {
      res.json({
        success: true,
        data: {
          id: roomState.id,
          code: roomState.code,
          hostId: roomState.hostId,
          status: roomState.status,
          settings: roomState.settings,
          playerCount: roomState.players.size,
        },
      });
      return;
    }

    const dbRoom = await prisma.room.findUnique({
      where: { code: uppercaseCode },
      include: {
        roomPlayers: {
          include: { player: true },
        },
      },
    });

    if (!dbRoom) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: dbRoom.id,
        code: dbRoom.code,
        hostId: dbRoom.hostId,
        status: dbRoom.status,
        settings: dbRoom.settings,
        playerCount: dbRoom.roomPlayers.length,
      },
    });
  } catch (error) {
    logger.error('RoomController', 'Failed to fetch room', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch room' },
    });
  }
}

export async function getRoomPlayers(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params as { code: string };
    const uppercaseCode = code.toUpperCase();

    const dbRoom = await prisma.room.findUnique({
      where: { code: uppercaseCode },
      include: {
        roomPlayers: {
          include: { player: true },
        },
      },
    });

    if (!dbRoom) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' },
      });
      return;
    }

    const players = dbRoom.roomPlayers.map((rp) => ({
      id: rp.playerId,
      displayName: rp.player.displayName,
      avatarUrl: rp.player.avatarUrl,
      isHost: rp.isHost,
      isOnline: rp.isOnline,
      isReady: rp.isReady,
    }));

    res.json({ success: true, data: { players } });
  } catch (error) {
    logger.error('RoomController', 'Failed to fetch room players', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch room players' },
    });
  }
}
