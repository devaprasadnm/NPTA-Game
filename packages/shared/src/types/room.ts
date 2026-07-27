// ============================================
// Room & Player Types
// ============================================

export enum RoomStatus {
  WAITING = 'WAITING',
  LOBBY = 'LOBBY',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
}

export interface RoomSettings {
  rounds: number;
  roundDuration: number;
  minPlayers: number;
  maxPlayers: number;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  rounds: 5,
  roundDuration: 60,
  minPlayers: 2,
  maxPlayers: 10,
};

export interface PlayerInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
  isOnline: boolean;
  isReady: boolean;
}

export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  isPrivate: boolean;
  settings: RoomSettings;
  players: PlayerInfo[];
  createdAt: string;
}

export interface RecentRoom {
  code: string;
  playerCount: number;
  lastVisited: string;
}
