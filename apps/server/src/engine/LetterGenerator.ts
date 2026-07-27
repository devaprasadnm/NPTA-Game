// ============================================
// Letter Generator — Picks random unused letters
// ============================================

import { ALL_LETTERS } from '@npta/shared';
import { logger } from '../utils/logger.js';

export class LetterGenerator {
  /**
   * Pick a random unused letter for the game.
   * If all 26 letters have been used, resets the pool.
   */
  static pickLetter(usedLetters: string[]): string {
    let available = ALL_LETTERS.filter((l: string) => !usedLetters.includes(l));

    if (available.length === 0) {
      logger.info('LetterGenerator', 'All 26 letters used, resetting pool');
      available = [...ALL_LETTERS];
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const letter = available[randomIndex]!;

    logger.info('LetterGenerator', `Selected letter: ${letter}`, {
      available: available.length,
      used: usedLetters.length,
    });

    return letter;
  }
}
