// ============================================
// Health Controller
// ============================================

import type { Request, Response } from 'express';

const startTime = Date.now();

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: '1.0.0',
    },
  });
}
