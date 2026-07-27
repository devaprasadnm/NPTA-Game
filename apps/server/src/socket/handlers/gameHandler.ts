// ============================================
// Socket Handler — Game Events
// ============================================

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@npta/shared';
import { GameEngine } from '../../engine/GameEngine.js';
import { logger } from '../../utils/logger.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(socket: GameSocket, gameEngine: GameEngine): void {
  const { playerId, playerName } = socket.data;

  // ---- Start Game ----
  socket.on('game:start', async () => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) {
        socket.emit('error', { code: 'NOT_IN_ROOM', message: 'You are not in a room' });
        return;
      }

      await gameEngine.startGame(roomCode, playerId);
      logger.info('GameHandler', `Game started by ${playerName} in room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game';
      socket.emit('error', { code: message, message: getErrorMessage(message) });
      logger.error('GameHandler', `Start game failed: ${message}`);
    }
  });

  // ---- Submit Answers ----
  socket.on('game:submit', async (data, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) {
        callback({ success: false, error: 'NOT_IN_ROOM' });
        return;
      }

      await gameEngine.submitAnswers(roomCode, playerId, data.answers);
      callback({ success: true });

      logger.info('GameHandler', `${playerName} submitted answers in room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit answers';
      callback({ success: false, error: message });
      logger.error('GameHandler', `Submit failed: ${message}`);
    }
  });

  // ---- Challenge Answer (Voting) ----
  socket.on('game:challenge', async (data, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) {
        callback({ success: false, error: 'NOT_IN_ROOM' });
        return;
      }

      await gameEngine.challengeAnswer(roomCode, playerId, data.targetPlayerId, data.category);
      callback({ success: true });

      logger.info('GameHandler', `${playerName} challenged ${data.targetPlayerId}:${data.category} in room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to challenge answer';
      callback({ success: false, error: message });
      logger.error('GameHandler', `Challenge failed: ${message}`);
    }
  });

  // ---- Challenge Done (Confirm finished voting) ----
  socket.on('game:challenge_done', async () => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;

      await gameEngine.confirmChallengeDone(roomCode, playerId);
      logger.info('GameHandler', `${playerName} confirmed done voting in room ${roomCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm done';
      logger.error('GameHandler', `Challenge done failed: ${message}`);
    }
  });
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'NOT_HOST':
      return 'Only the host can start the game';
    case 'NOT_ENOUGH_PLAYERS':
      return 'Not enough players to start the game';
    case 'ROOM_NOT_FOUND':
      return 'Room not found';
    case 'ALREADY_SUBMITTED':
      return 'You have already submitted your answers';
    case 'ROUND_NOT_ACTIVE':
      return 'No active round to submit answers for';
    case 'VOTING_NOT_ACTIVE':
      return 'No active voting phase';
    case 'CANNOT_CHALLENGE_OWN':
      return 'You cannot challenge your own answer';
    default:
      return 'An error occurred';
  }
}

