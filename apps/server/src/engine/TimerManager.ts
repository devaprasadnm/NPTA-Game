// ============================================
// Timer Manager — Per-room server-side timers
// ============================================

import { logger } from '../utils/logger.js';

interface ActiveTimer {
  roomCode: string;
  remaining: number;
  intervalId: ReturnType<typeof setInterval>;
  onTick: (remaining: number) => void;
  onComplete: () => void;
}

export class TimerManager {
  private timers: Map<string, ActiveTimer> = new Map();

  /**
   * Start a countdown timer for a room.
   */
  startTimer(
    roomCode: string,
    durationSeconds: number,
    onTick: (remaining: number) => void,
    onComplete: () => void,
  ): void {
    // Clear existing timer for this room
    this.stopTimer(roomCode);

    let remaining = durationSeconds;

    const intervalId = setInterval(() => {
      remaining--;
      onTick(remaining);

      if (remaining <= 0) {
        this.stopTimer(roomCode);
        onComplete();
      }
    }, 1000);

    this.timers.set(roomCode, {
      roomCode,
      remaining,
      intervalId,
      onTick,
      onComplete,
    });

    logger.info('TimerManager', `Timer started for room ${roomCode}: ${durationSeconds}s`);
  }

  /**
   * Stop and remove the timer for a room.
   */
  stopTimer(roomCode: string): void {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer.intervalId);
      this.timers.delete(roomCode);
      logger.info('TimerManager', `Timer stopped for room ${roomCode}`);
    }
  }

  /**
   * Get remaining time for a room's timer.
   */
  getRemaining(roomCode: string): number {
    const timer = this.timers.get(roomCode);
    return timer?.remaining ?? 0;
  }

  /**
   * Check if a room has an active timer.
   */
  hasTimer(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }

  /**
   * Clear all timers (for cleanup on server shutdown).
   */
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer.intervalId);
    }
    this.timers.clear();
    logger.info('TimerManager', 'All timers cleared');
  }
}

// Singleton
export const timerManager = new TimerManager();
