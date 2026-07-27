// ============================================
// Auth Controller — Guest login & session validation
// ============================================

import type { Request, Response } from 'express';
import { SessionService } from '../services/SessionService.js';
import { logger } from '../utils/logger.js';

export async function guestLogin(req: Request, res: Response): Promise<void> {
  try {
    const { displayName } = req.body as { displayName: string };
    const result = await SessionService.createGuestSession(displayName);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('AuthController', 'Guest login failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' },
    });
  }
}

export async function validateSession(req: Request, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'No session token provided' },
      });
      return;
    }

    const result = await SessionService.validateSession(token);

    if (!result.valid) {
      res.status(401).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' },
      });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('AuthController', 'Session validation failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to validate session' },
    });
  }
}
