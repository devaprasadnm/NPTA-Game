// ============================================
// Game Controller — REST endpoints for games & stats
// ============================================

import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export async function getGameById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        rounds: true,
      },
    });

    if (!game) {
      res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: 'Game not found' },
      });
      return;
    }

    res.json({ success: true, data: { game } });
  } catch (error) {
    logger.error('GameController', 'Failed to fetch game', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch game' },
    });
  }
}

export async function getPlayerStats(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const stats = await prisma.playerStats.findUnique({
      where: { playerId: id },
    });

    if (!stats) {
      res.json({
        success: true,
        data: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          avgScore: 0,
        },
      });
      return;
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('GameController', 'Failed to fetch player stats', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch player stats' },
    });
  }
}

export async function getPlayerHistory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const history = await prisma.gameHistory.findMany({
      where: { playerId: id },
      orderBy: { finishedAt: 'desc' },
      take: 20,
      include: {
        game: {
          include: { room: true },
        },
      },
    });

    const items = history.map((h) => ({
      gameId: h.gameId,
      roomCode: h.game.room.code,
      totalScore: h.totalScore,
      rank: h.rank,
      finishedAt: h.finishedAt.toISOString(),
    }));

    res.json({ success: true, data: { history: items } });
  } catch (error) {
    logger.error('GameController', 'Failed to fetch player history', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch player history' },
    });
  }
}
