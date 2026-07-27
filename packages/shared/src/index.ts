// ============================================
// Shared Package Entry Point
// ============================================

// Game & Room Enums / Constants from types
export {
  GameStatus,
  RoundStatus,
  Category,
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_PLACEHOLDERS,
  CATEGORY_ICONS,
} from './types/game.js';

export {
  RoomStatus,
  DEFAULT_ROOM_SETTINGS,
} from './types/room.js';

// Game Constants
export {
  ALL_LETTERS,
  SCORE_UNIQUE,
  SCORE_DUPLICATE,
  SCORE_INVALID,
  MAX_ROUND_SCORE,
  CATEGORY_COUNT,
  DEFAULT_ROUNDS,
  DEFAULT_ROUND_DURATION,
  DEFAULT_MIN_PLAYERS,
  DEFAULT_MAX_PLAYERS,
  MIN_PLAYERS_LIMIT,
  MAX_PLAYERS_LIMIT,
  MIN_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUND_DURATION,
  MAX_ROUND_DURATION,
  ROUND_START_COUNTDOWN,
  RESULTS_DISPLAY_DURATION,
  VOTING_DURATION,
  FINAL_RESULTS_DURATION,
  ROOM_CODE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  MAX_ANSWER_LENGTH,
  MAX_CHAT_MESSAGE_LENGTH,
  SESSION_EXPIRY_HOURS,
  RECONNECT_WINDOW_SECONDS,
  AVATARS,
} from './constants/game.js';

// Validation Constants
export {
  DISPLAY_NAME_REGEX,
  ROOM_CODE_REGEX,
  DISPLAY_NAME_RULES,
  ANSWER_RULES,
  CHAT_MESSAGE_RULES,
  ROOM_CODE_CHARS,
  ERROR_CODES,
} from './constants/validation.js';

// Utilities
export {
  normalizeAnswer,
  startsWithLetter,
  formatTime,
  ordinal,
  clamp,
  sleep,
  isNonEmptyString,
} from './utils/index.js';

// Types
export type * from './types/game.js';
export type * from './types/room.js';
export type * from './types/socket-events.js';
export type * from './types/api.js';
export type * from './constants/validation.js';
