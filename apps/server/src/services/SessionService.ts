// ============================================
// Session Service — Guest session management
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { SESSION_EXPIRY_HOURS } from '@npta/shared';
import { logger } from '../utils/logger.js';

export class SessionService {
  /**
   * Create a guest player and session.
   */
  static async createGuestSession(displayName: string) {
    const player = await prisma.player.create({
      data: { displayName },
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

    const session = await prisma.session.create({
      data: {
        playerId: player.id,
        token: uuidv4(),
        expiresAt,
      },
    });

    logger.info('SessionService', `Guest session created for "${displayName}"`, { playerId: player.id });

    return {
      player: {
        id: player.id,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
      },
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  /**
   * Validate a session token and return the player.
   */
  static async validateSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { player: true },
    });

    if (!session) {
      return { valid: false as const };
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return { valid: false as const };
    }

    return {
      valid: true as const,
      player: {
        id: session.player.id,
        displayName: session.player.displayName,
        avatarUrl: session.player.avatarUrl,
      },
    };
  }

  /**
   * Clean up expired sessions (called periodically).
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info('SessionService', `Cleaned up ${result.count} expired sessions`);
    }
    return result.count;
  }
}
