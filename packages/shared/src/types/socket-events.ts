// ============================================
// Socket.IO Event Type Definitions
// ============================================

import type { RoomSettings, RoomInfo, PlayerInfo } from './room.js';
import type {
  RoundAnswers,
  RoundResult,
  LeaderboardEntry,
  GameInfo,
  RoundInfo,
} from './game.js';

// ----------------------------------------
// Client → Server Events
// ----------------------------------------
export interface ClientToServerEvents {
  // Room events
  'room:create': (data: CreateRoomPayload, callback: (res: SocketResponse<RoomInfo>) => void) => void;
  'room:join': (data: JoinRoomPayload, callback: (res: SocketResponse<RoomInfo>) => void) => void;
  'room:leave': () => void;
  'room:settings': (data: UpdateSettingsPayload) => void;

  // Player events
  'player:ready': (data: { isReady: boolean }) => void;

  // Game events
  'game:start': () => void;
  'game:submit': (data: SubmitAnswersPayload, callback: (res: SocketResponse<null>) => void) => void;

  // Challenge/Voting events
  'game:challenge': (data: ChallengePayload, callback: (res: SocketResponse<null>) => void) => void;
  'game:challenge_done': () => void;

  // Chat events
  'chat:message': (data: ChatMessagePayload) => void;
  'chat:emoji': (data: EmojiReactionPayload) => void;
}

// ----------------------------------------
// Server → Client Events
// ----------------------------------------
export interface ServerToClientEvents {
  // Room events
  'room:created': (data: RoomInfo) => void;
  'room:joined': (data: RoomInfo) => void;
  'room:player_joined': (data: PlayerInfo) => void;
  'room:player_left': (data: { playerId: string }) => void;
  'room:player_reconnected': (data: { playerId: string }) => void;
  'room:host_changed': (data: { newHostId: string; newHostName: string }) => void;
  'room:settings_updated': (data: RoomSettings) => void;
  'room:player_ready': (data: { playerId: string; isReady: boolean }) => void;

  // Game events
  'game:started': (data: GameInfo) => void;
  'game:round_starting': (data: { round: RoundInfo; countdown: number }) => void;
  'game:round_active': (data: { round: RoundInfo }) => void;
  'game:timer_update': (data: { remaining: number }) => void;
  'game:player_submitted': (data: { playerId: string }) => void;
  'game:round_completed': (data: RoundResult) => void;
  'game:leaderboard': (data: { leaderboard: LeaderboardEntry[] }) => void;
  'game:finished': (data: { winner: LeaderboardEntry; leaderboard: LeaderboardEntry[] }) => void;

  // Challenge/Voting events
  'game:voting_started': (data: { roundResult: RoundResult; duration: number }) => void;
  'game:challenge_update': (data: ChallengeUpdate) => void;
  'game:voting_timer': (data: { remaining: number }) => void;
  'game:voting_ended': (data: { roundResult: RoundResult }) => void;

  // Chat events
  'chat:message': (data: ChatMessage) => void;
  'chat:emoji': (data: EmojiReaction) => void;

  // System events
  'error': (data: SocketError) => void;
  'session:restored': (data: { room: RoomInfo; game: GameInfo | null }) => void;
}

// ----------------------------------------
// Inter-Server Events (for scaling)
// ----------------------------------------
export interface InterServerEvents {
  ping: () => void;
}

// ----------------------------------------
// Socket Data (attached to each socket)
// ----------------------------------------
export interface SocketData {
  playerId: string;
  playerName: string;
  sessionToken: string;
  roomCode: string | null;
}

// ----------------------------------------
// Payload Types
// ----------------------------------------
export interface CreateRoomPayload {
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  roomCode: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<RoomSettings>;
}

export interface SubmitAnswersPayload {
  answers: RoundAnswers;
}

export interface ChatMessagePayload {
  message: string;
}

export interface EmojiReactionPayload {
  emoji: string;
}

// ----------------------------------------
// Response Types
// ----------------------------------------
export interface SocketResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SocketError {
  code: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
}

export interface EmojiReaction {
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: string;
}

// ----------------------------------------
// Challenge/Voting Types
// ----------------------------------------
export interface ChallengePayload {
  targetPlayerId: string;
  category: string;
}

export interface ChallengeUpdate {
  /** key = "playerId:category", value = array of voter player IDs */
  challenges: Record<string, string[]>;
}
