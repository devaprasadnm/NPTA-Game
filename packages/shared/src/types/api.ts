// ============================================
// REST API Request/Response Types
// ============================================

import type { RoomInfo, PlayerInfo, RoomSettings } from './room';
import type { LeaderboardEntry, GameInfo } from './game';

// ----------------------------------------
// Auth
// ----------------------------------------
export interface GuestLoginRequest {
  displayName: string;
}

export interface GuestLoginResponse {
  player: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  token: string;
  expiresAt: string;
}

export interface SessionValidationResponse {
  valid: boolean;
  player?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ----------------------------------------
// Rooms
// ----------------------------------------
export interface CreateRoomRequest {
  settings?: Partial<RoomSettings>;
}

export interface CreateRoomResponse {
  room: RoomInfo;
}

export interface GetRoomResponse {
  room: RoomInfo;
}

export interface GetRoomPlayersResponse {
  players: PlayerInfo[];
}

// ----------------------------------------
// Game
// ----------------------------------------
export interface GetGameResponse {
  game: GameInfo;
}

export interface GetLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

// ----------------------------------------
// Player Stats
// ----------------------------------------
export interface PlayerStatsResponse {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  avgScore: number;
}

export interface GameHistoryItem {
  gameId: string;
  roomCode: string;
  totalScore: number;
  rank: number;
  playerCount: number;
  finishedAt: string;
}

export interface GameHistoryResponse {
  history: GameHistoryItem[];
}

// ----------------------------------------
// Health
// ----------------------------------------
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
}

// ----------------------------------------
// Generic API Response
// ----------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
