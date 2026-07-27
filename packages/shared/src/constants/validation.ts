// ============================================
// Validation Constants
// ============================================

import {
  MIN_DISPLAY_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_ANSWER_LENGTH,
  MAX_CHAT_MESSAGE_LENGTH,
  ROOM_CODE_LENGTH,
} from './game';

/** Regex to validate display name (alphanumeric, spaces, underscores, hyphens) */
export const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

/** Regex to validate room code (uppercase alphanumeric) */
export const ROOM_CODE_REGEX = new RegExp(`^[A-Z0-9]{${ROOM_CODE_LENGTH}}$`);

/** Validation rules for display name */
export const DISPLAY_NAME_RULES = {
  minLength: MIN_DISPLAY_NAME_LENGTH,
  maxLength: MAX_DISPLAY_NAME_LENGTH,
  pattern: DISPLAY_NAME_REGEX,
  patternMessage: 'Name can only contain letters, numbers, spaces, underscores, and hyphens',
} as const;

/** Validation rules for answers */
export const ANSWER_RULES = {
  maxLength: MAX_ANSWER_LENGTH,
} as const;

/** Validation rules for chat messages */
export const CHAT_MESSAGE_RULES = {
  maxLength: MAX_CHAT_MESSAGE_LENGTH,
} as const;

/** Characters used to generate room codes */
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded: I, O, 0, 1 to avoid confusion

/** Error codes used across the application */
export const ERROR_CODES = {
  // Auth
  INVALID_SESSION: 'INVALID_SESSION',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_NAME: 'INVALID_NAME',

  // Room
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_IN_GAME: 'ROOM_IN_GAME',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  NOT_HOST: 'NOT_HOST',
  INVALID_SETTINGS: 'INVALID_SETTINGS',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',

  // Game
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_NOT_ACTIVE: 'GAME_NOT_ACTIVE',
  ROUND_NOT_ACTIVE: 'ROUND_NOT_ACTIVE',
  ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
  INVALID_ANSWERS: 'INVALID_ANSWERS',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
