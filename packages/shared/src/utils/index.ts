// ============================================
// Shared Utilities
// ============================================

/**
 * Normalize an answer: trim whitespace, convert to lowercase.
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

/**
 * Check if an answer starts with the given letter (case-insensitive, ignoring leading spaces).
 */
export function startsWithLetter(answer: string, letter: string): boolean {
  const normalized = answer.trim();
  if (normalized.length === 0) return false;
  return normalized[0]!.toUpperCase() === letter.toUpperCase();
}

/**
 * Generate a formatted time string from seconds (e.g., 65 → "1:05").
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate ordinal suffix for a number (1st, 2nd, 3rd, etc.).
 */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a delay/sleep promise.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
