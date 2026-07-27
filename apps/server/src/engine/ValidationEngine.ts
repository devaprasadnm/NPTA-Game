// ============================================
// Validation Engine — Server-side answer validation
// ============================================

import { normalizeAnswer, startsWithLetter } from '@npta/shared';
import { logger } from '../utils/logger.js';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export class ValidationEngine {
  /**
   * Validate a single answer against the round's letter.
   *
   * Rules:
   * - Must not be empty/blank
   * - Must start with the correct letter (case-insensitive)
   * - Leading/trailing spaces are ignored
   */
  static validateAnswer(answer: string, letter: string): ValidationResult {
    const normalized = normalizeAnswer(answer);

    // Empty or whitespace-only
    if (normalized.length === 0) {
      return { isValid: false, reason: 'empty' };
    }

    // Must start with the correct letter
    if (!startsWithLetter(normalized, letter)) {
      return { isValid: false, reason: `must start with "${letter}"` };
    }

    return { isValid: true };
  }

  /**
   * Validate all answers for a player's round submission.
   */
  static validateRoundAnswers(
    answers: Record<string, string>,
    letter: string,
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [category, answer] of Object.entries(answers)) {
      results[category] = this.validateAnswer(answer ?? '', letter);
    }

    logger.debug('ValidationEngine', `Validated answers for letter "${letter}"`, results);
    return results;
  }
}
