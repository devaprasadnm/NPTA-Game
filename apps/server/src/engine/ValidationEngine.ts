// ============================================
// Validation Engine — Fully offline, dataset-backed server-side validation
// Zero external API calls. O(1) lookups via in-memory Sets.
// ============================================

import { type Category } from '@npta/shared';
import { datasetLoader } from '../data/datasetLoader.js';
import { findClosestMatch } from '../utils/levenshtein.js';
import { logger } from '../utils/logger.js';

// Maximum Levenshtein distance to suggest a correction (inclusive)
const FUZZY_MAX_DISTANCE = 2;

// ---- Types ---------------------------------------------------------------

export type ValidationReason =
  | 'empty'
  | 'wrong_letter'
  | 'not_in_dataset'
  | 'invalid_category';

export interface ValidationResult {
  isValid: boolean;
  /** Why the answer was rejected (only present when isValid === false) */
  reason?: ValidationReason;
  /** Closest valid word found by fuzzy matching */
  suggestion?: string;
  /** Edit distance to the suggestion */
  editDistance?: number;
}

// ---- Helpers -------------------------------------------------------------

/**
 * Normalise an answer for validation:
 * 1. Trim surrounding whitespace.
 * 2. Convert to lowercase.
 * 3. Collapse consecutive whitespace to a single space.
 * 4. Strip leading/trailing non-alphanumeric chars (punctuation, apostrophes, etc.)
 */
function normaliseAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

// ---- ValidationEngine ----------------------------------------------------

export class ValidationEngine {
  /**
   * Validate a single answer against a round letter and category.
   *
   * Validation steps (in order):
   * 1. Trim whitespace.
   * 2. Convert to lowercase.
   * 3. Normalise spaces and punctuation.
   * 4. Reject empty values.
   * 5. Verify the answer starts with the assigned letter.
   * 6. Exact O(1) lookup in the category dataset.
   * 7. If exact lookup fails → fuzzy Levenshtein scan (maxDist = 2).
   *    – Match found  → invalid, but suggestion returned.
   *    – No match     → invalid, reason = 'not_in_dataset'.
   *
   * The server is fully authoritative. Clients never influence this result.
   */
  static validateAnswer(
    answer: string,
    letter: string,
    category: Category,
  ): ValidationResult {
    // ── Step 1–3: Normalise ───────────────────────────────────────────────
    const normalised = normaliseAnswer(answer);

    // ── Step 4: Reject empty ──────────────────────────────────────────────
    if (normalised.length === 0) {
      return { isValid: false, reason: 'empty' };
    }

    // ── Step 5: Must start with the correct letter ────────────────────────
    const requiredLetter = letter.toLowerCase();
    if (!normalised.startsWith(requiredLetter)) {
      return { isValid: false, reason: 'wrong_letter' };
    }

    // ── Step 6: Exact dataset lookup (O(1)) ───────────────────────────────
    const dataset = datasetLoader.getDataset(category);

    if (dataset.size === 0) {
      // Category has no dataset loaded — fail safe, reject
      logger.warn('ValidationEngine', `Dataset for category "${category}" is empty or not loaded`);
      return { isValid: false, reason: 'invalid_category' };
    }

    if (dataset.has(normalised)) {
      return { isValid: true };
    }

    // ── Step 7: Fuzzy match via Levenshtein ───────────────────────────────
    const fuzzy = findClosestMatch(normalised, dataset, FUZZY_MAX_DISTANCE);

    if (fuzzy !== null) {
      logger.debug(
        'ValidationEngine',
        `Fuzzy match for "${normalised}" → "${fuzzy.match}" (dist=${fuzzy.distance})`,
      );
      return {
        isValid: false,
        reason: 'not_in_dataset',
        suggestion: fuzzy.match,
        editDistance: fuzzy.distance,
      };
    }

    return { isValid: false, reason: 'not_in_dataset' };
  }

  /**
   * Validate all answers for a player's round submission.
   *
   * @param answers  Map of category → raw answer string
   * @param letter   The round letter
   * @returns        Map of category → ValidationResult
   */
  static validateRoundAnswers(
    answers: Record<string, string>,
    letter: string,
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [category, answer] of Object.entries(answers)) {
      results[category] = this.validateAnswer(
        answer ?? '',
        letter,
        category as Category,
      );
    }

    logger.debug(
      'ValidationEngine',
      `Validated answers for letter "${letter}"`,
      Object.fromEntries(
        Object.entries(results).map(([cat, r]) => [
          cat,
          r.isValid ? 'valid' : `invalid(${r.reason ?? '?'})${r.suggestion ? ` → ${r.suggestion}` : ''}`,
        ]),
      ),
    );

    return results;
  }
}
