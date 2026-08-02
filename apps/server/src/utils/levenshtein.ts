// ============================================
// Levenshtein Distance Utility
// Pure implementation — no external dependencies
// Optimised with two-row DP: O(n·m) time, O(min(n,m)) space
// ============================================

/**
 * Compute the Levenshtein edit distance between two strings.
 * Uses a memory-efficient two-row DP approach.
 */
export function levenshtein(a: string, b: string): number {
  // Swap so `a` is the shorter string (optimises space)
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const aLen = a.length;
  const bLen = b.length;

  // If one string is empty, distance is the length of the other
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Initialise previous row: distance from empty string to every prefix of `b`
  let prev: number[] = Array.from({ length: aLen + 1 }, (_, i) => i);
  let curr: number[] = new Array<number>(aLen + 1);

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        (prev[i] ?? 0) + 1,       // deletion
        (curr[i - 1] ?? 0) + 1,   // insertion
        (prev[i - 1] ?? 0) + cost, // substitution
      );
    }
    // Swap rows
    [prev, curr] = [curr, prev];
  }

  return prev[aLen] ?? aLen;
}

export interface FuzzyMatch {
  match: string;
  distance: number;
}

/**
 * Find the closest word in `candidates` to `word` within `maxDistance`.
 *
 * Strategy:
 * - Only considers candidates that start with the same letter as `word`
 *   (massive space reduction for performance).
 * - Early-exits on a distance of 1 (very close match).
 * - Returns null if no candidate is within maxDistance.
 *
 * Performance: With ~1000 words per category and 26-letter filtering,
 * the average scan is ~38 words. Each Levenshtein call is < 0.05 ms.
 * Total: < 2 ms worst-case per validation miss.
 */
export function findClosestMatch(
  word: string,
  candidates: Set<string>,
  maxDistance: number = 2,
): FuzzyMatch | null {
  if (candidates.size === 0 || word.length === 0) return null;

  const firstChar = word[0];
  let best: FuzzyMatch | null = null;

  for (const candidate of candidates) {
    // Filter by first character to avoid full-set scans
    if (candidate[0] !== firstChar) continue;

    // Skip candidates with length difference already exceeding maxDistance
    if (Math.abs(candidate.length - word.length) > maxDistance) continue;

    const dist = levenshtein(word, candidate);

    if (dist <= maxDistance) {
      if (best === null || dist < best.distance) {
        best = { match: candidate, distance: dist };
        // Perfect or near-perfect — no need to keep searching
        if (dist <= 1) break;
      }
    }
  }

  return best;
}
