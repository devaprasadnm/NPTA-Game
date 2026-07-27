// ============================================
// Game Constants
// ============================================

/** All valid letters for the game */
export const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Score for a unique valid answer */
export const SCORE_UNIQUE = 10;

/** Score for a duplicate valid answer (same answer given by multiple players) */
export const SCORE_DUPLICATE = 5;

/** Score for an invalid or blank answer */
export const SCORE_INVALID = 0;

/** Maximum score achievable in a single round (5 categories × 10 points) */
export const MAX_ROUND_SCORE = 50;

/** Number of categories per round */
export const CATEGORY_COUNT = 5;

/** Default number of rounds */
export const DEFAULT_ROUNDS = 5;

/** Default round duration in seconds */
export const DEFAULT_ROUND_DURATION = 60;

/** Default minimum players to start */
export const DEFAULT_MIN_PLAYERS = 2;

/** Default maximum players per room */
export const DEFAULT_MAX_PLAYERS = 10;

/** Absolute minimum players allowed */
export const MIN_PLAYERS_LIMIT = 1;

/** Absolute maximum players allowed */
export const MAX_PLAYERS_LIMIT = 20;

/** Minimum rounds */
export const MIN_ROUNDS = 1;

/** Maximum rounds (limited by alphabet) */
export const MAX_ROUNDS = 26;

/** Minimum round duration in seconds */
export const MIN_ROUND_DURATION = 15;

/** Maximum round duration in seconds */
export const MAX_ROUND_DURATION = 180;

/** Countdown before round starts (seconds) */
export const ROUND_START_COUNTDOWN = 3;

/** Time to show results before next round (seconds) */
export const RESULTS_DISPLAY_DURATION = 8;

/** Duration of the voting/challenge phase (seconds) */
export const VOTING_DURATION = 15;

/** Duration to show final results after voting resolves (seconds) */
export const FINAL_RESULTS_DURATION = 5;

/** Room code length */
export const ROOM_CODE_LENGTH = 6;

/** Maximum display name length */
export const MAX_DISPLAY_NAME_LENGTH = 20;

/** Minimum display name length */
export const MIN_DISPLAY_NAME_LENGTH = 2;

/** Maximum answer length per category */
export const MAX_ANSWER_LENGTH = 100;

/** Maximum chat message length */
export const MAX_CHAT_MESSAGE_LENGTH = 200;

/** Session token expiry in hours */
export const SESSION_EXPIRY_HOURS = 72;

/** Reconnect window in seconds (how long a player can be offline and still rejoin) */
export const RECONNECT_WINDOW_SECONDS = 300;

/** Available avatar options */
export const AVATARS = [
  '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎵', '🎸',
  '🚀', '⚡', '🔥', '💎', '🌟', '🌈', '🦊', '🐱',
  '🐶', '🦁', '🐼', '🦄', '🐙', '🦋', '🌸', '🍀',
] as const;
