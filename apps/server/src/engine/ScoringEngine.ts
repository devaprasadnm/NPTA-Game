// ============================================
// Scoring Engine — Server-side score calculation
// ============================================

import {
  SCORE_UNIQUE,
  SCORE_DUPLICATE,
  SCORE_INVALID,
  CATEGORIES,
  normalizeAnswer,
  type Category,
  type AnswerResult,
  type PlayerRoundResult,
} from '@npta/shared';
import { ValidationEngine } from './ValidationEngine.js';
import { logger } from '../utils/logger.js';

interface PlayerAnswers {
  playerId: string;
  playerName: string;
  answers: Record<string, string>;
}

export class ScoringEngine {
  /**
   * Calculate scores for all players in a round.
   *
   * Scoring rules:
   * - Unique valid answer: +10
   * - Duplicate valid answer (same answer by multiple players): +5 each
   * - Invalid (wrong letter, empty): 0
   * - Blank: 0
   */
  static calculateRoundScores(
    playerAnswers: PlayerAnswers[],
    letter: string,
  ): PlayerRoundResult[] {
    const results: PlayerRoundResult[] = [];

    // For each category, group valid answers by normalized value
    for (const category of CATEGORIES) {
      const categoryKey = category as string;

      // Collect all valid answers for this category
      const validAnswers: Map<string, string[]> = new Map(); // normalized → playerIds[]

      for (const pa of playerAnswers) {
        const answer = pa.answers[categoryKey] ?? '';
        const validation = ValidationEngine.validateAnswer(answer, letter, category as Category);

        if (validation.isValid) {
          const normalized = normalizeAnswer(answer);
          const existing = validAnswers.get(normalized) ?? [];
          existing.push(pa.playerId);
          validAnswers.set(normalized, existing);
        }
      }

      // Now assign scores
      for (const pa of playerAnswers) {
        const answer = pa.answers[categoryKey] ?? '';
        const validation = ValidationEngine.validateAnswer(answer, letter, category as Category);

        let score = SCORE_INVALID;
        let isValid = false;

        if (validation.isValid) {
          isValid = true;
          const normalized = normalizeAnswer(answer);
          const playersWithSameAnswer = validAnswers.get(normalized) ?? [];

          if (playersWithSameAnswer.length === 1) {
            score = SCORE_UNIQUE;
          } else {
            score = SCORE_DUPLICATE;
          }
        }

        // Find or create the player result
        let playerResult = results.find((r) => r.playerId === pa.playerId);
        if (!playerResult) {
          playerResult = {
            playerId: pa.playerId,
            playerName: pa.playerName,
            answers: [],
            roundScore: 0,
          };
          results.push(playerResult);
        }

        const answerResult: AnswerResult = {
          category: category as Category,
          value: answer.trim(),
          isValid,
          score,
          challengedBy: [],
          wasChallenged: false,
        };

        playerResult.answers.push(answerResult);
        playerResult.roundScore += score;
      }
    }

    logger.info('ScoringEngine', `Calculated scores for ${playerAnswers.length} players`, {
      letter,
      scores: results.map((r) => ({ player: r.playerName, score: r.roundScore })),
    });

    return results;
  }
}
