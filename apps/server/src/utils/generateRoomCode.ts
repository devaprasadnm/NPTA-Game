// ============================================
// Room Code Generator
// ============================================

import { ROOM_CODE_CHARS } from '@npta/shared';
import { ROOM_CODE_LENGTH } from '@npta/shared';

/**
 * Generate a random room code using unambiguous characters.
 * Characters I, O, 0, 1 are excluded to prevent confusion.
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }
  return code;
}
